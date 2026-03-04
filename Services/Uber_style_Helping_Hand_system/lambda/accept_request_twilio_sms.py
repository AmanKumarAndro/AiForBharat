import json
import os
import boto3
from botocore.exceptions import ClientError

# Twilio imports
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    print("Twilio not installed, SMS notifications disabled")

dynamodb = boto3.resource('dynamodb')
requests_table = dynamodb.Table('HH_Requests')
providers_table = dynamodb.Table('HH_Providers')

# Twilio configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')

def send_sms(to_number, message):
    """Send SMS via Twilio"""
    if not TWILIO_AVAILABLE or not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        print(f"Twilio not configured, skipping SMS to {to_number}")
        return False
    
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
        msg = client.messages.create(
            from_=TWILIO_PHONE_NUMBER,
            body=message,
            to=to_number
        )
        
        print(f"✓ SMS sent to {to_number}: {msg.sid}")
        return True
    except Exception as e:
        print(f"✗ Failed to send SMS to {to_number}: {e}")
        return False

def lambda_handler(event, context):
    """
    FR-07: Atomic conditional write to accept request
    FR-08: Return 409 if already matched
    FR-09: Update provider availability and status
    """
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        
        request_id = body.get('request_id')
        provider_id = body.get('provider_id')
        
        if not request_id or not provider_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing request_id or provider_id'})
            }
        
        # Get provider details
        provider_response = providers_table.get_item(Key={'provider_id': provider_id})
        if 'Item' not in provider_response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Provider not found'})
            }
        
        provider = provider_response['Item']
        
        # Atomic conditional update - only if status is PENDING or NOTIFYING
        try:
            requests_table.update_item(
                Key={'request_id': request_id},
                UpdateExpression='SET #status = :matched, matched_provider_id = :provider_id',
                ConditionExpression='#status IN (:pending, :notifying)',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={
                    ':matched': 'MATCHED',
                    ':provider_id': provider_id,
                    ':pending': 'PENDING',
                    ':notifying': 'NOTIFYING'
                }
            )
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Request already taken by another provider'})
                }
            raise
        
        # Update provider availability
        providers_table.update_item(
            Key={'provider_id': provider_id},
            UpdateExpression='SET is_available = :false, #status = :on_job',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':false': False,
                ':on_job': 'ON_JOB'
            }
        )
        
        # Send SMS notification to farmer
        try:
            request_response = requests_table.get_item(Key={'request_id': request_id})
            if 'Item' in request_response:
                farmer_phone = request_response['Item'].get('farmer_id')
                
                sms_message = (
                    f"Helping Hand: {provider['name']} accepted your request! "
                    f"Rating: {float(provider['rating'])} stars. "
                    f"Call: {provider['phone']}. ID: {request_id[:8]}"
                )
                
                send_sms(farmer_phone, sms_message)
        except Exception as e:
            print(f"Failed to send SMS to farmer: {e}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Request accepted successfully',
                'request_id': request_id,
                'provider': {
                    'name': provider['name'],
                    'phone': provider['phone'],
                    'rating': float(provider['rating'])
                }
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
