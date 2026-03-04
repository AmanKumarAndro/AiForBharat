#!/bin/bash
# Complete AWS deployment script

set -e

# Load environment variables from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi

STACK_NAME="weather-advisory-stack"
FUNCTION_NAME="weather-advisory"
REGION=$(aws configure get region || echo "ap-south-1")

echo "🚀 Starting AWS Deployment..."
echo ""

# Step 1: Package Lambda
echo "📦 Step 1: Packaging Lambda function..."
zip -q -r function.zip lambda_function.py
echo "✅ Package created"
echo ""

# Step 2: Deploy CloudFormation Stack
echo "☁️  Step 2: Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file cloudformation_template.yaml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $REGION \
  --parameter-overrides OpenWeatherAPIKey=${OPENWEATHER_API_KEY}

echo "✅ CloudFormation stack deployed"
echo ""

# Step 3: Update Lambda code
echo "📤 Step 3: Uploading Lambda function code..."
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://function.zip \
  --region $REGION > /dev/null

echo "✅ Lambda code updated"
echo ""

# Step 4: Get API endpoint
echo "🔗 Step 4: Retrieving API endpoint..."
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
  --output text)

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 API Endpoint: $API_ENDPOINT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test with:"
echo "curl -X POST $API_ENDPOINT \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"lat\": 28.4595, \"lon\": 77.0266, \"activity\": \"spraying\"}'"
echo ""
