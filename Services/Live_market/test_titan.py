#!/usr/bin/env python3
"""Test with Amazon Titan model"""

import json
import time
from lambda_function import lambda_handler

print("Testing with Amazon Titan model...")
print("Model: amazon.titan-text-premier-v1:0\n")

time.sleep(3)  # Wait for rate limit

event = {
    'httpMethod': 'POST',
    'body': json.dumps({
        'state': 'Maharashtra',
        'action': 'analyze',
        'limit': 5
    }),
    'headers': {'Content-Type': 'application/json'}
}

response = lambda_handler(event, None)
print(f'Status Code: {response["statusCode"]}')

body = json.loads(response['body'])
if body.get('success'):
    print('\n✅ SUCCESS!\n')
    meta = body['data']['metadata']
    print(f'State: {meta["state"]}')
    print(f'Total records: {meta["total_records"]:,}')
    print(f'Analyzed: {meta["analyzed_records"]}')
    print(f'\n{"="*80}')
    print('AI ANALYSIS')
    print("="*80)
    print(body['data']['analysis'])
    print("="*80)
else:
    print(f'\n❌ Error: {body.get("error")}')
