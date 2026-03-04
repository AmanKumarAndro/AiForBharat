import json
import boto3
import os
from urllib.parse import parse_qs
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
requests_table = dynamodb.Table('HH_Requests')
providers_table = dynamodb.Table('HH_Providers')

# Import Twilio
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')

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
    Handle incoming SMS replies from Twilio webhook
    """
    try:
        # Parse Twilio webhook data (URL-encoded form data)
        body = event.get('body', '')
        params = parse_qs(body)
        
        # Extract Twilio parameters
        from_number = params.get('From', [''])[0]  # Provider's phone
        message_body = params.get('Body', [''])[0].strip().upper()
        
        print(f"SMS from {from_number}: {message_body}")
        
        # Check if reply is YES or ACCEPT
        if message_body not in ['YES', 'ACCEPT', 'Y', 'OK']:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'text/xml'},
                'body': '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Reply YES to accept a request.</Message></Response>'
            }
        
        # Find provider by phone number
        provider_id = f"PRV_{from_number.replace('+', '')}"
        
        try:
            provider_response = providers_table.get_item(Key={'provider_id': provider_id})
            if 'Item' not in provider_response:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'text/xml'},
                    'body': '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Provider not found. Please register first.</Message></Response>'
                }
            
            provider = provider_response['Item']
        except Exception as e:
            print(f"Error finding provider: {e}")
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'text/xml'},
                'body': '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error finding your account.</Message></Response>'
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
                'statusCode': 200,
                'headers': {'Content-Type': 'text/xml'},
                'body': '<?xml version="1.0" encoding="UTF-8"?><Response><Message>No pending requests found.</Message></Response>'
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
                    'statusCode': 200,
                    'headers': {'Content-Type': 'text/xml'},
                    'body': '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, this request was already taken by another provider.</Message></Response>'
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
        send_sms(from_number, provider_msg)
        
        # Send notification SMS to farmer
        farmer_msg = f"Helping Hand: {provider['name']} accepted your request! Rating: {float(provider['rating'])} stars. Call: {provider['phone']}. ID: {request_id[:8]}"
        send_sms(request['farmer_id'], farmer_msg)
        
        print(f"✓ Request {request_id} accepted by {provider['name']} via SMS")
        
        # Return empty TwiML response (Twilio expects XML)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'text/xml'},
            'body': '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'text/xml'},
            'body': '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Error processing your request. Please try again.</Message></Response>'
        }
