import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

def seed_providers():
    """Seed 3 test providers with different service types"""
    table = dynamodb.Table('HH_Providers')
    
    providers = [
        {
            'provider_id': 'PRV_9876543210',
            'name': 'Ramesh Kumar',
            'phone': '+919876543210',
            'service_type': 'TRACTOR',
            'pin_code': '411001',
            'nearby_pincodes': ['411002', '411003', '411004'],
            'rating': Decimal('4.8'),
            'total_jobs': 45,
            'price_per_hour': Decimal('500'),
            'is_available': True,
            'device_token': 'arn:aws:sns:us-east-1:123456789012:endpoint/FCM/HelpingHand/ramesh-device',
            'status': 'IDLE'
        },
        {
            'provider_id': 'PRV_9876543211',
            'name': 'Suresh Patil',
            'phone': '+919876543211',
            'service_type': 'TRACTOR',
            'pin_code': '411002',
            'nearby_pincodes': ['411001', '411003'],
            'rating': Decimal('4.5'),
            'total_jobs': 32,
            'price_per_hour': Decimal('450'),
            'is_available': True,
            'device_token': 'arn:aws:sns:us-east-1:123456789012:endpoint/FCM/HelpingHand/suresh-device',
            'status': 'IDLE'
        },
        {
            'provider_id': 'PRV_9876543212',
            'name': 'Ganesh Jadhav',
            'phone': '+919876543212',
            'service_type': 'LABOUR',
            'pin_code': '411001',
            'nearby_pincodes': ['411002', '411005'],
            'rating': Decimal('4.9'),
            'total_jobs': 67,
            'price_per_hour': Decimal('200'),
            'is_available': True,
            'device_token': 'arn:aws:sns:us-east-1:123456789012:endpoint/FCM/HelpingHand/ganesh-device',
            'status': 'IDLE'
        }
    ]
    
    for provider in providers:
        table.put_item(Item=provider)
        print(f"✓ Seeded provider: {provider['name']} ({provider['service_type']})")

def seed_pincode_mappings():
    """Seed pincode neighborhood mappings"""
    table = dynamodb.Table('HH_PincodeMappings')
    
    mappings = [
        {
            'pincode': '411001',
            'nearby': ['411002', '411003', '411004'],
            'district': 'Pune',
            'state': 'Maharashtra'
        },
        {
            'pincode': '411002',
            'nearby': ['411001', '411003'],
            'district': 'Pune',
            'state': 'Maharashtra'
        },
        {
            'pincode': '411003',
            'nearby': ['411001', '411002', '411004'],
            'district': 'Pune',
            'state': 'Maharashtra'
        }
    ]
    
    for mapping in mappings:
        table.put_item(Item=mapping)
        print(f"✓ Seeded pincode: {mapping['pincode']}")

if __name__ == '__main__':
    print("Seeding test data...")
    seed_providers()
    seed_pincode_mappings()
    print("\n✓ All test data seeded successfully")
