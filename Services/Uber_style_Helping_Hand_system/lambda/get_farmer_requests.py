import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
requests_table = dynamodb.Table('HH_Requests')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    """
    Get all requests for a farmer
    Query by farmer_id and optionally filter by status
    """
    try:
        # Get farmer_id from path parameters
        farmer_id = event.get('pathParameters', {}).get('farmer_id')
        
        if not farmer_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing farmer_id'})
            }
        
        # Get optional status filter from query parameters
        query_params = event.get('queryStringParameters') or {}
        status_filter = query_params.get('status')  # PENDING, NOTIFYING, MATCHED, COMPLETED
        
        # Scan for farmer's requests (Note: In production, use GSI for better performance)
        scan_params = {
            'FilterExpression': Attr('farmer_id').eq(farmer_id)
        }
        
        # Add status filter if provided
        if status_filter:
            scan_params['FilterExpression'] = scan_params['FilterExpression'] & Attr('status').eq(status_filter)
        
        response = requests_table.scan(**scan_params)
        requests = response.get('Items', [])
        
        # Sort by created_at (most recent first)
        requests.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        # Categorize requests
        ongoing = []
        completed = []
        pending = []
        
        for req in requests:
            status = req.get('status')
            if status == 'COMPLETED':
                completed.append(req)
            elif status in ['MATCHED', 'NOTIFYING']:
                ongoing.append(req)
            elif status in ['PENDING', 'NO_PROVIDERS_FOUND']:
                pending.append(req)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'farmer_id': farmer_id,
                'summary': {
                    'total': len(requests),
                    'ongoing': len(ongoing),
                    'completed': len(completed),
                    'pending': len(pending)
                },
                'ongoing': ongoing,
                'completed': completed,
                'pending': pending
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
