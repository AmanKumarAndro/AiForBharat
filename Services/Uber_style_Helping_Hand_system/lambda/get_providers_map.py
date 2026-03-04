import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
providers_table = dynamodb.Table('HH_Providers')
pincode_table = dynamodb.Table('HH_PincodeMappings')

def decimal_to_float(obj):
    """Convert Decimal to float for JSON serialization"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    """
    Get all available providers in nearby pincodes with coordinates for map display
    """
    try:
        params = event.get('queryStringParameters', {}) or {}
        farmer_pincode = params.get('pincode')
        service_type = params.get('service_type')  # Optional filter
        
        if not farmer_pincode:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing pincode parameter'})
            }
        
        # Get nearby pincodes
        nearby_pincodes = [farmer_pincode]
        try:
            pincode_response = pincode_table.get_item(Key={'pincode': farmer_pincode})
            if 'Item' in pincode_response:
                nearby_pincodes.extend(pincode_response['Item'].get('nearby', []))
        except Exception as e:
            print(f"Pincode lookup failed: {e}")
        
        # Query providers by service type or scan all
        if service_type:
            response = providers_table.query(
                IndexName='ServiceType-Rating-Index',
                KeyConditionExpression=Key('service_type').eq(service_type),
                ScanIndexForward=False  # Highest rated first
            )
        else:
            response = providers_table.scan()
        
        # Filter by availability and pincode
        available_providers = []
        for provider in response.get('Items', []):
            # Only show available providers
            if not provider.get('is_available', False):
                continue
            
            # Check if provider serves this area
            provider_pincodes = [provider.get('pin_code')] + provider.get('nearby_pincodes', [])
            if not any(pc in nearby_pincodes for pc in provider_pincodes):
                continue
            
            # Build provider object for map
            available_providers.append({
                'provider_id': provider['provider_id'],
                'name': provider['name'],
                'phone': provider['phone'],
                'service_type': provider['service_type'],
                'rating': float(provider.get('rating', 5.0)),
                'total_jobs': int(provider.get('total_jobs', 0)),
                'price_per_hour': int(provider.get('price_per_hour', 500)),
                'latitude': float(provider.get('latitude', 0)),
                'longitude': float(provider.get('longitude', 0)),
                'pincode': provider['pin_code'],
                'is_available': provider.get('is_available', True),
                'status': provider.get('status', 'IDLE')
            })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'count': len(available_providers),
                'providers': available_providers,
                'search_area': nearby_pincodes
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
