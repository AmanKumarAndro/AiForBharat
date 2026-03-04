#!/usr/bin/env python3
"""Local test script for weather advisory Lambda"""

import json
from lambda_function import lambda_handler

# Test event simulating API Gateway
test_event = {
    'body': json.dumps({
        'lat': 28.4595,
        'lon': 77.0266,
        'activity': 'spraying'
    })
}

if __name__ == '__main__':
    print("Testing Weather Advisory Lambda...")
    print("-" * 50)
    
    response = lambda_handler(test_event, None)
    
    print(f"Status Code: {response['statusCode']}")
    print(f"Response Body:")
    print(json.dumps(json.loads(response['body']), indent=2))
