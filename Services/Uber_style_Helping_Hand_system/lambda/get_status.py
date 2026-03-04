import json
import boto3

dynamodb = boto3.resource('dynamodb')
requests_table = dynamodb.Table('HH_Requests')
providers_table = dynamodb.Table('HH_Providers')

def lambda_handler(event, context):
    """Get request status with provider details if matched"""
    try:
        request_id = event['pathParameters']['request_id']
        
        response = requests_table.get_item(Key={'request_id': request_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Request not found'})
            }
        
        request = response['Item']
        result = {
            'request_id': request['request_id'],
            'status': request['status'],
            'service_type': request['service_type'],
            'created_at': request['created_at']
        }
        
        # If matched, include provider details
        if request.get('matched_provider_id'):
            provider_response = providers_table.get_item(
                Key={'provider_id': request['matched_provider_id']}
            )
            if 'Item' in provider_response:
                provider = provider_response['Item']
                result['provider'] = {
                    'name': provider['name'],
                    'phone': provider['phone'],
                    'rating': float(provider['rating']),
                    'price_per_hour': float(provider.get('price_per_hour', 0))
                }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(result, default=str)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
