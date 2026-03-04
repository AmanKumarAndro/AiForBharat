import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
requests_table = dynamodb.Table('HH_Requests')
providers_table = dynamodb.Table('HH_Providers')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    """
    Get all jobs for a provider
    Query by provider_id and optionally filter by status
    """
    try:
        # Get provider_id from path parameters
        provider_id = event.get('pathParameters', {}).get('provider_id')
        
        if not provider_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing provider_id'})
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
        
        # Get optional status filter from query parameters
        query_params = event.get('queryStringParameters') or {}
        status_filter = query_params.get('status')  # MATCHED, COMPLETED
        
        # Scan for provider's jobs (Note: In production, use GSI for better performance)
        scan_params = {
            'FilterExpression': Attr('matched_provider_id').eq(provider_id)
        }
        
        # Add status filter if provided
        if status_filter:
            scan_params['FilterExpression'] = scan_params['FilterExpression'] & Attr('status').eq(status_filter)
        
        response = requests_table.scan(**scan_params)
        jobs = response.get('Items', [])
        
        # Sort by created_at (most recent first)
        jobs.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        # Categorize jobs
        ongoing = []
        completed = []
        
        for job in jobs:
            status = job.get('status')
            if status == 'COMPLETED':
                completed.append(job)
            elif status == 'MATCHED':
                ongoing.append(job)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'provider_id': provider_id,
                'provider_name': provider.get('name'),
                'provider_status': provider.get('status'),
                'is_available': provider.get('is_available'),
                'rating': float(provider.get('rating', 0)),
                'total_jobs': int(provider.get('total_jobs', 0)),
                'summary': {
                    'total': len(jobs),
                    'ongoing': len(ongoing),
                    'completed': len(completed)
                },
                'ongoing': ongoing,
                'completed': completed
            }, cls=DecimalEncoder)
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
