#!/usr/bin/env python3
"""
Add latitude and longitude coordinates to existing providers
"""
import boto3
from decimal import Decimal
import random

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
providers_table = dynamodb.Table('HH_Providers')

# Pincode to coordinates mapping (Pune area)
PINCODE_COORDS = {
    '411001': {'lat': 18.5204, 'lng': 73.8567},  # Pune Central
    '411002': {'lat': 18.5314, 'lng': 73.8446},  # Shivajinagar
    '411003': {'lat': 18.5362, 'lng': 73.8958},  # Deccan
    '411004': {'lat': 18.5089, 'lng': 73.8083},  # Kothrud
    '411005': {'lat': 18.5074, 'lng': 73.8077},  # Erandwane
    '411006': {'lat': 18.5196, 'lng': 73.8553},  # Sadashiv Peth
    '411007': {'lat': 18.5275, 'lng': 73.8737},  # Parvati
    '411008': {'lat': 18.5089, 'lng': 73.8249},  # Shivaji Nagar
}

def update_provider_coordinates():
    """Update all providers with latitude and longitude"""
    print("=" * 60)
    print("UPDATING PROVIDER COORDINATES")
    print("=" * 60)
    print()
    
    # Scan all providers
    response = providers_table.scan()
    providers = response['Items']
    
    print(f"Found {len(providers)} providers")
    print()
    
    for provider in providers:
        provider_id = provider['provider_id']
        pincode = provider.get('pin_code', '411001')
        name = provider.get('name', 'Unknown')
        
        # Get base coordinates for pincode
        coords = PINCODE_COORDS.get(pincode, {'lat': 18.5204, 'lng': 73.8567})
        
        # Add small random offset so providers don't overlap on map
        # Offset range: ~0.01 degrees = ~1km
        lat_offset = random.uniform(-0.01, 0.01)
        lng_offset = random.uniform(-0.01, 0.01)
        
        final_lat = coords['lat'] + lat_offset
        final_lng = coords['lng'] + lng_offset
        
        # Update provider with coordinates
        providers_table.update_item(
            Key={'provider_id': provider_id},
            UpdateExpression='SET latitude = :lat, longitude = :lng',
            ExpressionAttributeValues={
                ':lat': Decimal(str(round(final_lat, 6))),
                ':lng': Decimal(str(round(final_lng, 6)))
            }
        )
        
        print(f"✓ {name} ({provider_id})")
        print(f"  Pincode: {pincode}")
        print(f"  Coordinates: {final_lat:.6f}, {final_lng:.6f}")
        print()
    
    print("=" * 60)
    print(f"✓ Updated {len(providers)} providers with coordinates")
    print("=" * 60)

if __name__ == '__main__':
    update_provider_coordinates()
