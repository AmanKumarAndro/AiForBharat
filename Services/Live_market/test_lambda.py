#!/usr/bin/env python3
"""Test Lambda function locally without AWS deployment"""

import json
import sys
from lambda_function import lambda_handler

def test_analyze_endpoint():
    """Test the analyze endpoint"""
    print("\n" + "="*80)
    print("TEST 1: Analyze Endpoint (with Bedrock)")
    print("="*80)
    
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "state": "West Bengal",
            "district": "Coochbehar",
            "action": "analyze",
            "limit": 10
        }),
        "headers": {
            "Content-Type": "application/json"
        }
    }
    
    try:
        response = lambda_handler(event, None)
        print(f"\nStatus Code: {response['statusCode']}")
        
        body = json.loads(response['body'])
        if body.get('success'):
            print("\n✅ SUCCESS")
            print(f"\nMetadata:")
            print(json.dumps(body['data']['metadata'], indent=2))
            print(f"\nAnalysis Preview:")
            print(body['data']['analysis'][:500] + "...")
        else:
            print("\n❌ FAILED")
            print(f"Error: {body.get('error')}")
            
    except Exception as e:
        print(f"\n❌ EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()

def test_fetch_endpoint():
    """Test the fetch endpoint (no Bedrock)"""
    print("\n" + "="*80)
    print("TEST 2: Fetch Endpoint (Raw Data Only)")
    print("="*80)
    
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "state": "Maharashtra",
            "action": "fetch",
            "limit": 5
        }),
        "headers": {
            "Content-Type": "application/json"
        }
    }
    
    try:
        response = lambda_handler(event, None)
        print(f"\nStatus Code: {response['statusCode']}")
        
        body = json.loads(response['body'])
        if body.get('success'):
            print("\n✅ SUCCESS")
            data = body['data']
            print(f"\nTotal Records: {data.get('total', 0)}")
            print(f"Records Returned: {len(data.get('records', []))}")
            
            if data.get('records'):
                print(f"\nFirst Record:")
                print(json.dumps(data['records'][0], indent=2))
        else:
            print("\n❌ FAILED")
            print(f"Error: {body.get('error')}")
            
    except Exception as e:
        print(f"\n❌ EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()

def test_cors_options():
    """Test CORS OPTIONS request"""
    print("\n" + "="*80)
    print("TEST 3: CORS OPTIONS Request")
    print("="*80)
    
    event = {
        "httpMethod": "OPTIONS",
        "headers": {}
    }
    
    try:
        response = lambda_handler(event, None)
        print(f"\nStatus Code: {response['statusCode']}")
        print(f"Headers: {json.dumps(response['headers'], indent=2)}")
        
        if response['statusCode'] == 200:
            print("\n✅ CORS configured correctly")
        else:
            print("\n❌ CORS issue")
            
    except Exception as e:
        print(f"\n❌ EXCEPTION: {str(e)}")

def test_commodity_filter():
    """Test with commodity filter"""
    print("\n" + "="*80)
    print("TEST 4: Commodity Filter (Fetch Only)")
    print("="*80)
    
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "commodity": "Onion",
            "action": "fetch",
            "limit": 5
        }),
        "headers": {
            "Content-Type": "application/json"
        }
    }
    
    try:
        response = lambda_handler(event, None)
        print(f"\nStatus Code: {response['statusCode']}")
        
        body = json.loads(response['body'])
        if body.get('success'):
            print("\n✅ SUCCESS")
            data = body['data']
            print(f"\nTotal Onion Records: {data.get('total', 0)}")
            print(f"Records Returned: {len(data.get('records', []))}")
        else:
            print("\n❌ FAILED")
            print(f"Error: {body.get('error')}")
            
    except Exception as e:
        print(f"\n❌ EXCEPTION: {str(e)}")

if __name__ == "__main__":
    print("\n🧪 Testing Lambda Function Locally")
    print("Note: Bedrock tests require AWS credentials configured\n")
    
    # Test fetch endpoint first (no Bedrock required)
    test_fetch_endpoint()
    test_commodity_filter()
    test_cors_options()
    
    # Ask before testing Bedrock
    print("\n" + "="*80)
    response = input("\nTest Bedrock endpoint? This requires AWS credentials (y/n): ")
    if response.lower() == 'y':
        test_analyze_endpoint()
    else:
        print("\nSkipping Bedrock test")
    
    print("\n" + "="*80)
    print("✅ Testing Complete")
    print("="*80 + "\n")
