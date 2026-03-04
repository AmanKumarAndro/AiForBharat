import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
providers_table = dynamodb.Table('HH_Providers')

def lambda_handler(event, context):
    """Register a new provider"""
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        
        required = ['phone', 'name', 'service_type', 'pin_code', 'price_per_hour']
        for field in required:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        if body['service_type'] not in ['TRACTOR', 'LABOUR', 'TRANSPORT']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Invalid service_type'})
            }
        
        provider_id = f"PRV_{body['phone']}"
        
        item = {
            'provider_id': provider_id,
            'name': body['name'],
            'phone': body['phone'],
            'service_type': body['service_type'],
            'pin_code': body['pin_code'],
            'nearby_pincodes': body.get('nearby_pincodes', []),
            'rating': Decimal('5.0'),
            'total_jobs': 0,
            'price_per_hour': Decimal(str(body['price_per_hour'])),
            'is_available': True,
            'device_token': body.get('device_token', ''),
            'status': 'IDLE'
        }
        
        providers_table.put_item(Item=item)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Provider registered successfully',
                'provider_id': provider_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
