import json
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
requests_table = dynamodb.Table('HH_Requests')
providers_table = dynamodb.Table('HH_Providers')

# Import Twilio
try:
    from twilio.rest import Client
    import os
    TWILIO_AVAILABLE = True
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')
except ImportError:
    TWILIO_AVAILABLE = False

def send_sms(to_number, message):
    """Send SMS via Twilio"""
    if not TWILIO_AVAILABLE:
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
        print(f"✗ Failed to send SMS: {e}")
        return False

def lambda_handler(event, context):
    """
    Test endpoint to simulate SMS reply acceptance
    Call this API to test the acceptance flow without SMS reply
    """
    try:
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        
        provider_phone = body.get('provider_phone')
        
        if not provider_phone:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing provider_phone'})
            }
        
        # Find provider by phone number - try both formats
        provider_id_without_plus = f"PRV_{provider_phone.replace('+', '')}"
        provider_id_with_plus = f"PRV_{provider_phone}"
        
        provider = None
        try:
            # Try without + first
            provider_response = providers_table.get_item(Key={'provider_id': provider_id_without_plus})
            if 'Item' in provider_response:
                provider = provider_response['Item']
            else:
                # Try with +
                provider_response = providers_table.get_item(Key={'provider_id': provider_id_with_plus})
                if 'Item' in provider_response:
                    provider = provider_response['Item']
            
            if not provider:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': f'Provider not found for phone: {provider_phone}'})
                }
            
            provider_id = provider_id_with_plus if 'PRV_+' in provider_id_with_plus else provider_id_without_plus
            
        except Exception as e:
            print(f"Error finding provider: {e}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': f'Error finding provider: {str(e)}'})
            }
        
        # Find latest NOTIFYING request for this provider's service type
        scan_response = requests_table.scan(
            FilterExpression='#status = :status AND service_type = :service_type',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'NOTIFYING',
                ':service_type': provider['service_type']
            }
        )
        
        if not scan_response.get('Items'):
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'No pending requests found'})
            }
        
        # Get the most recent request
        requests = sorted(scan_response['Items'], key=lambda x: x['created_at'], reverse=True)
        request = requests[0]
        request_id = request['request_id']
        
        # Try to accept the request (atomic operation)
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
        
        # Update provider status
        providers_table.update_item(
            Key={'provider_id': provider_id},
            UpdateExpression='SET is_available = :false, #status = :on_job',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':false': False,
                ':on_job': 'ON_JOB'
            }
        )
        
        # Send confirmation SMS to provider
        provider_msg = f"Request accepted! Farmer: {request['farmer_name']}, Phone: {request['farmer_id']}, Location: {request['farmer_pincode']}. ID: {request_id[:8]}"
        send_sms(provider_phone, provider_msg)
        
        # Send notification SMS to farmer
        farmer_msg = f"Helping Hand: {provider['name']} accepted your request! Rating: {float(provider['rating'])} stars. Call: {provider['phone']}. ID: {request_id[:8]}"
        send_sms(request['farmer_id'], farmer_msg)
        
        print(f"✓ Request {request_id} accepted by {provider['name']} via test API")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Request accepted successfully (via test API)',
                'request_id': request_id,
                'provider': {
                    'name': provider['name'],
                    'phone': provider['phone'],
                    'rating': float(provider['rating'])
                },
                'farmer': {
                    'name': request['farmer_name'],
                    'phone': request['farmer_id']
                }
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
