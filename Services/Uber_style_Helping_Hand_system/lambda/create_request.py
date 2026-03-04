import json
import uuid
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')
requests_table = dynamodb.Table('HH_Requests')

def lambda_handler(event, context):
    """
    FR-01: Create service request with status PENDING
    FR-02: Asynchronously invoke match providers Lambda
    """
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        
        # Validate required fields
        required = ['farmer_id', 'farmer_name', 'service_type', 'farmer_pincode']
        for field in required:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Validate service type
        if body['service_type'] not in ['TRACTOR', 'LABOUR', 'TRANSPORT']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Invalid service_type. Must be TRACTOR, LABOUR, or TRANSPORT'})
            }
        
        request_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        # Create request record
        item = {
            'request_id': request_id,
            'farmer_id': body['farmer_id'],
            'farmer_name': body['farmer_name'],
            'service_type': body['service_type'],
            'farmer_pincode': body['farmer_pincode'],
            'status': 'PENDING',
            'created_at': timestamp,
            'estimated_price': Decimal(str(body.get('estimated_price', 500)))
        }
        
        requests_table.put_item(Item=item)
        
        # Asynchronously invoke match providers Lambda
        lambda_client.invoke(
            FunctionName='HH_MatchProviders',
            InvocationType='Event',
            Payload=json.dumps({'request_id': request_id})
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'request_id': request_id,
                'status': 'PENDING',
                'message': 'Request created successfully'
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
