import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
requests_table = dynamodb.Table('HH_Requests')
providers_table = dynamodb.Table('HH_Providers')

def lambda_handler(event, context):
    """
    FR-10: Accept 1-5 rating from farmer
    FR-11: Recalculate provider rating as rolling average
    FR-12: Increment total_jobs and reset availability
    """
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        
        request_id = body.get('request_id')
        rating = body.get('rating')
        
        if not request_id or rating is None:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing request_id or rating'})
            }
        
        if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Rating must be between 1 and 5'})
            }
        
        # Get request details
        response = requests_table.get_item(Key={'request_id': request_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Request not found'})
            }
        
        request = response['Item']
        provider_id = request.get('matched_provider_id')
        
        if not provider_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'No provider matched to this request'})
            }
        
        # Update request with rating and status
        requests_table.update_item(
            Key={'request_id': request_id},
            UpdateExpression='SET farmer_rating_given = :rating, #status = :completed',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':rating': Decimal(str(rating)),
                ':completed': 'COMPLETED'
            }
        )
        
        # Get provider current stats
        provider_response = providers_table.get_item(Key={'provider_id': provider_id})
        provider = provider_response['Item']
        
        old_rating = float(provider.get('rating', 0))
        total_jobs = int(provider.get('total_jobs', 0))
        
        # Calculate new rolling average
        new_rating = ((old_rating * total_jobs) + rating) / (total_jobs + 1)
        
        # Update provider: rating, total_jobs, availability, status
        providers_table.update_item(
            Key={'provider_id': provider_id},
            UpdateExpression='SET rating = :new_rating, total_jobs = :new_total, is_available = :true, #status = :idle',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':new_rating': Decimal(str(round(new_rating, 2))),
                ':new_total': total_jobs + 1,
                ':true': True,
                ':idle': 'IDLE'
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Job completed and rated successfully',
                'provider_new_rating': round(new_rating, 2),
                'provider_total_jobs': total_jobs + 1
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
