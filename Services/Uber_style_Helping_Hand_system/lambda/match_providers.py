import json
import boto3
import os
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
requests_table = dynamodb.Table('HH_Requests')
providers_table = dynamodb.Table('HH_Providers')
pincode_table = dynamodb.Table('HH_PincodeMappings')

# Import Twilio
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')

def lambda_handler(event, context):
    """
    FR-03: Look up neighboring pincodes
    FR-04: Query providers GSI filtered by availability
    FR-05: Select top 3 by rating
    FR-06: Send SNS push to each provider
    """
    try:
        request_id = event.get('request_id')
        
        # Get request details
        response = requests_table.get_item(Key={'request_id': request_id})
        if 'Item' not in response:
            return {'statusCode': 404, 'body': 'Request not found'}
        
        request = response['Item']
        service_type = request['service_type']
        farmer_pincode = request['farmer_pincode']
        
        # Get nearby pincodes
        nearby_pincodes = [farmer_pincode]
        try:
            pincode_response = pincode_table.get_item(Key={'pincode': farmer_pincode})
            if 'Item' in pincode_response:
                nearby_pincodes.extend(pincode_response['Item'].get('nearby', []))
        except Exception as e:
            print(f"Pincode lookup failed: {e}")
        
        # Query providers by service type and rating (descending)
        response = providers_table.query(
            IndexName='ServiceType-Rating-Index',
            KeyConditionExpression=Key('service_type').eq(service_type),
            ScanIndexForward=False  # Descending order by rating
        )
        
        # Filter by availability and nearby pincodes
        available_providers = []
        for provider in response.get('Items', []):
            if not provider.get('is_available', False):
                continue
            
            provider_pincodes = [provider.get('pin_code')] + provider.get('nearby_pincodes', [])
            if any(pc in nearby_pincodes for pc in provider_pincodes):
                available_providers.append(provider)
                if len(available_providers) >= 3:
                    break
        
        if not available_providers:
            requests_table.update_item(
                Key={'request_id': request_id},
                UpdateExpression='SET #status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'NO_PROVIDERS_FOUND'}
            )
            return {'statusCode': 200, 'body': 'No providers found'}
        
        # Update request status to NOTIFYING
        requests_table.update_item(
            Key={'request_id': request_id},
            UpdateExpression='SET #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'NOTIFYING'}
        )
        
        # Send SMS notifications to providers via Twilio
        notifications_sent = 0
        for provider in available_providers:
            # Prepare SMS message with "Reply YES to accept"
            sms_message = (
                f"Helping Hand: New {service_type} request from {request['farmer_name']} "
                f"in {farmer_pincode}. Price: Rs{int(request.get('estimated_price', 500))}. "
                f"Reply YES to accept. ID: {request_id[:8]}"
            )
            
            # Send SMS via Twilio
            if TWILIO_AVAILABLE:
                try:
                    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                    message = client.messages.create(
                        from_=TWILIO_PHONE_NUMBER,
                        body=sms_message,
                        to=provider.get('phone')
                    )
                    notifications_sent += 1
                    print(f"✓ SMS sent to {provider.get('phone')}: {message.sid}")
                except Exception as e:
                    print(f"✗ Failed to send SMS to {provider['provider_id']}: {e}")
            else:
                print(f"✗ Twilio not available, skipping SMS to {provider['provider_id']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'providers_notified': len(available_providers),
                'sms_sent': notifications_sent,
                'provider_ids': [p['provider_id'] for p in available_providers]
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {'statusCode': 500, 'body': str(e)}
