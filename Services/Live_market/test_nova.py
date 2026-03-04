#!/usr/bin/env python3
"""Test with Amazon Nova model (FREE, no marketplace)"""

import json
import boto3
import os

# Test with Amazon Nova Micro (FREE)
MODEL_ID = "amazon.nova-micro-v1:0"

print(f"Testing Bedrock Model: {MODEL_ID}")
print("This model is FREE and available by default (no marketplace subscription)\n")

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# Sample commodity data
mock_data = {
    "total": 100,
    "records": [
        {
            "State": "Maharashtra",
            "District": "Pune",
            "Commodity": "Onion",
            "Min_Price": "2000",
            "Max_Price": "2500",
            "Modal_Price": "2200",
            "Arrival_Date": "01/03/2026"
        },
        {
            "State": "Maharashtra",
            "District": "Pune",
            "Commodity": "Tomato",
            "Min_Price": "1500",
            "Max_Price": "1800",
            "Modal_Price": "1650",
            "Arrival_Date": "01/03/2026"
        }
    ]
}

prompt = f"""Analyze the following agricultural commodity market data and provide insights:

Total Records: {mock_data['total']}
Records Analyzed: {len(mock_data['records'])}

Data Sample:
{json.dumps(mock_data['records'], indent=2)}

Please provide:
1. Price Trend Analysis
2. Market Recommendations
3. Best Opportunities

Keep response concise and actionable."""

print("Sending request to Bedrock...")

try:
    # Amazon Nova format (Converse API)
    request_body = {
        "messages": [
            {
                "role": "user",
                "content": [{"text": prompt}]
            }
        ],
        "inferenceConfig": {
            "maxTokens": 1000,
            "temperature": 0.7
        }
    }
    
    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps(request_body)
    )
    
    response_body = json.loads(response['body'].read())
    analysis = response_body['output']['message']['content'][0]['text']
    
    print("\n" + "="*80)
    print("✅ SUCCESS - Amazon Nova Response:")
    print("="*80)
    print(analysis)
    print("="*80)
    
    print("\n💡 Model Info:")
    print(f"   - Model: {MODEL_ID}")
    print(f"   - Cost: FREE (included in AWS account)")
    print(f"   - Approval: Not required")
    print(f"   - Marketplace: Not required")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    
    if "payment" in str(e).lower() or "marketplace" in str(e).lower():
        print("\n⚠️  This might be a payment/marketplace issue.")
        print("Amazon Nova should be FREE and available by default.")
        print("\nTry these alternatives:")
        print("1. amazon.nova-lite-v1:0 (also FREE)")
        print("2. amazon.nova-pro-v1:0 (also FREE)")
    else:
        print("\nPlease check:")
        print("1. AWS credentials are configured")
        print("2. Bedrock service is available in your region")
        print("3. You have bedrock:InvokeModel permission")
