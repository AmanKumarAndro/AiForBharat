#!/bin/bash

# Deploy Lambda functions for Helping Hand

# Load environment variables from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../.env" ]; then
    source "$SCRIPT_DIR/../.env"
fi

ACCOUNT_ID=${AWS_ACCOUNT_ID:-"YOUR_AWS_ACCOUNT_ID"}
REGION="ap-south-1"

echo "Deploying Lambda functions to $REGION..."

# Create deployment packages
cd lambda

for func in create_request accept_request complete_and_rate get_status match_providers register_provider; do
    echo "Packaging ${func}..."
    zip -q ${func}.zip ${func}.py
done

# Deploy each function
aws lambda create-function \
    --region $REGION \
    --function-name HH_CreateRequest \
    --runtime python3.12 \
    --role arn:aws:iam::$ACCOUNT_ID:role/HelpingHandLambdaRole \
    --handler create_request.lambda_handler \
    --zip-file fileb://create_request.zip \
    --timeout 10 \
    --memory-size 256 \
    2>/dev/null || aws lambda update-function-code \
    --region $REGION \
    --function-name HH_CreateRequest \
    --zip-file fileb://create_request.zip

aws lambda create-function \
    --region $REGION \
    --function-name HH_AcceptRequest \
    --runtime python3.12 \
    --role arn:aws:iam::$ACCOUNT_ID:role/HelpingHandLambdaRole \
    --handler accept_request.lambda_handler \
    --zip-file fileb://accept_request.zip \
    --timeout 10 \
    --memory-size 256 \
    2>/dev/null || aws lambda update-function-code \
    --region $REGION \
    --function-name HH_AcceptRequest \
    --zip-file fileb://accept_request.zip

aws lambda create-function \
    --region $REGION \
    --function-name HH_CompleteAndRate \
    --runtime python3.12 \
    --role arn:aws:iam::$ACCOUNT_ID:role/HelpingHandLambdaRole \
    --handler complete_and_rate.lambda_handler \
    --zip-file fileb://complete_and_rate.zip \
    --timeout 10 \
    --memory-size 256 \
    2>/dev/null || aws lambda update-function-code \
    --region $REGION \
    --function-name HH_CompleteAndRate \
    --zip-file fileb://complete_and_rate.zip

aws lambda create-function \
    --region $REGION \
    --function-name HH_GetStatus \
    --runtime python3.12 \
    --role arn:aws:iam::$ACCOUNT_ID:role/HelpingHandLambdaRole \
    --handler get_status.lambda_handler \
    --zip-file fileb://get_status.zip \
    --timeout 10 \
    --memory-size 256 \
    2>/dev/null || aws lambda update-function-code \
    --region $REGION \
    --function-name HH_GetStatus \
    --zip-file fileb://get_status.zip

aws lambda create-function \
    --region $REGION \
    --function-name HH_MatchProviders \
    --runtime python3.12 \
    --role arn:aws:iam::$ACCOUNT_ID:role/HelpingHandLambdaRole \
    --handler match_providers.lambda_handler \
    --zip-file fileb://match_providers.zip \
    --timeout 30 \
    --memory-size 256 \
    2>/dev/null || aws lambda update-function-code \
    --region $REGION \
    --function-name HH_MatchProviders \
    --zip-file fileb://match_providers.zip

aws lambda create-function \
    --region $REGION \
    --function-name HH_RegisterProvider \
    --runtime python3.12 \
    --role arn:aws:iam::$ACCOUNT_ID:role/HelpingHandLambdaRole \
    --handler register_provider.lambda_handler \
    --zip-file fileb://register_provider.zip \
    --timeout 10 \
    --memory-size 256 \
    2>/dev/null || aws lambda update-function-code \
    --region $REGION \
    --function-name HH_RegisterProvider \
    --zip-file fileb://register_provider.zip

# Cleanup
rm *.zip

cd ..
echo "✓ Lambda functions deployed"
