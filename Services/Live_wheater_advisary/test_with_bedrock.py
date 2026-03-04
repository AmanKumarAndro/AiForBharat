#!/usr/bin/env python3
"""Test script with mock Bedrock response for local testing"""

import json
import sys
import os

# Mock boto3 for local testing
class MockBedrockRuntime:
    def invoke_model(self, modelId, body):
        # Simulate Bedrock response
        request = json.loads(body)
        prompt = request['messages'][0]['content']
        
        # Simple mock response based on prompt content
        if "Not Safe" in prompt:
            mock_message = "Dear farmer, it's not a good time to spray pesticides right now. The weather forecast shows rain coming in the next few hours, and the wind is quite strong which can cause the spray to drift away from your crops. Please wait for calmer, drier conditions - maybe tomorrow morning would be better!"
        else:
            mock_message = "Good news! The weather conditions are perfect for spraying today. The wind is calm, no rain is expected, and humidity levels are comfortable. You can safely proceed with your pesticide application. Just remember to wear protective gear and follow safety guidelines."
        
        return {
            'body': MockBody(json.dumps({
                'content': [{'text': mock_message}]
            }))
        }

class MockBody:
    def __init__(self, content):
        self.content = content
    
    def read(self):
        return self.content

# Mock boto3 module
class MockBoto3:
    @staticmethod
    def client(service, region_name=None):
        if service == 'bedrock-runtime':
            return MockBedrockRuntime()
        return None

sys.modules['boto3'] = MockBoto3()

# Now import lambda function
from lambda_function import lambda_handler

# Test event
test_event = {
    'body': json.dumps({
        'lat': 28.4595,
        'lon': 77.0266,
        'activity': 'spraying'
    })
}

if __name__ == '__main__':
    print("Testing Weather Advisory with Bedrock Integration...")
    print("-" * 60)
    
    response = lambda_handler(test_event, None)
    
    print(f"Status Code: {response['statusCode']}")
    print(f"\nResponse Body:")
    body = json.loads(response['body'])
    print(json.dumps(body, indent=2))
    
    if 'friendly_message' in body:
        print(f"\n{'='*60}")
        print("FRIENDLY MESSAGE FOR FARMER:")
        print('='*60)
        print(body['friendly_message'])
