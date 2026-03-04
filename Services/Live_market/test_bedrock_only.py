#!/usr/bin/env python3
"""Test Bedrock integration directly without API calls"""

import json
import boto3
import os

# Test with Amazon Titan Premier
MODEL_ID = "amazon.titan-text-premier-v1:0"

print(f"Testing Bedrock Model: {MODEL_ID}\n")

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
    # Amazon Titan format
    request_body = {
        "inputText": prompt,
        "textGenerationConfig": {
            "maxTokenCount": 1000,
            "temperature": 0.7,
            "topP": 0.9
        }
    }
    
    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        body=json.dumps(request_body)
    )
    
    response_body = json.loads(response['body'].read())
    analysis = response_body['results'][0]['outputText']
    
    print("\n" + "="*80)
    print("✅ SUCCESS - Bedrock Response:")
    print("="*80)
    print(analysis)
    print("="*80)
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    print("\nTrying alternative model: ai21.jamba-1-5-mini-v1:0")
    
    try:
        # AI21 Jamba format
        request_body = {
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        response = bedrock.invoke_model(
            modelId="ai21.jamba-1-5-mini-v1:0",
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        analysis = response_body['choices'][0]['message']['content']
        
        print("\n" + "="*80)
        print("✅ SUCCESS - Bedrock Response (AI21 Jamba):")
        print("="*80)
        print(analysis)
        print("="*80)
        
        print("\n💡 Update config.py to use: ai21.jamba-1-5-mini-v1:0")
        
    except Exception as e2:
        print(f"\n❌ Also failed: {str(e2)}")
        print("\nPlease enable Bedrock model access in AWS Console")
