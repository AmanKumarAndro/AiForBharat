import json
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
requests_table = dynamodb.Table('HH_Requests')
providers_table = dynamodb.Table('HH_Providers')

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
                    f"🚜 Helping Hand: {provider['name']} accepted your request! "
                    f"Rating: {float(provider['rating'])}⭐ "
                    f"Call: {provider['phone']}. Request ID: {request_id[:8]}"
                )
                
                sns_client = boto3.client('sns')
                sns_client.publish(
                    PhoneNumber=farmer_phone,
                    Message=sms_message,
                    MessageAttributes={
                        'AWS.SNS.SMS.SMSType': {
                            'DataType': 'String',
                            'StringValue': 'Transactional'
                        }
                    }
                )
                print(f"SMS sent to farmer at {farmer_phone}")
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
