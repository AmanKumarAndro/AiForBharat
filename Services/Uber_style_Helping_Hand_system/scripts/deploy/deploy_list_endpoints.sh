#!/bin/bash

# Load environment variables from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../../.env" ]; then
    source "$SCRIPT_DIR/../../.env"
fi

API_ID="nhl6zxlp70"
REGION="ap-south-1"
ACCOUNT_ID=${AWS_ACCOUNT_ID:-"YOUR_AWS_ACCOUNT_ID"}

echo "=========================================="
echo "Deploying List Endpoints"
echo "=========================================="
echo ""

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION | jq -r '.items[] | select(.path == "/") | .id')
echo "Root resource ID: $ROOT_ID"

# Create /farmer-requests/{farmer_id} endpoint
echo ""
echo "Creating /farmer-requests/{farmer_id} endpoint..."

FARMER_REQUESTS_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "farmer-requests" \
  --region $REGION 2>/dev/null | jq -r '.id')

if [ -z "$FARMER_REQUESTS_RESOURCE" ]; then
  FARMER_REQUESTS_RESOURCE=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION | jq -r '.items[] | select(.path == "/farmer-requests") | .id')
fi

echo "  /farmer-requests resource: $FARMER_REQUESTS_RESOURCE"

FARMER_ID_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $FARMER_REQUESTS_RESOURCE \
  --path-part "{farmer_id}" \
  --region $REGION 2>/dev/null | jq -r '.id')

if [ -z "$FARMER_ID_RESOURCE" ]; then
  FARMER_ID_RESOURCE=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION | jq -r '.items[] | select(.path == "/farmer-requests/{farmer_id}") | .id')
fi

echo "  /{farmer_id} resource: $FARMER_ID_RESOURCE"

# Create GET method for farmer requests
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $FARMER_ID_RESOURCE \
  --http-method GET \
  --authorization-type NONE \
  --no-api-key-required \
  --region $REGION >/dev/null 2>&1

# Create integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $FARMER_ID_RESOURCE \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:HH_GetFarmerRequests/invocations" \
  --region $REGION >/dev/null 2>&1

echo "  ✓ GET method and integration created"

# Create /provider-jobs/{provider_id} endpoint
echo ""
echo "Creating /provider-jobs/{provider_id} endpoint..."

PROVIDER_JOBS_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "provider-jobs" \
  --region $REGION 2>/dev/null | jq -r '.id')

if [ -z "$PROVIDER_JOBS_RESOURCE" ]; then
  PROVIDER_JOBS_RESOURCE=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION | jq -r '.items[] | select(.path == "/provider-jobs") | .id')
fi

echo "  /provider-jobs resource: $PROVIDER_JOBS_RESOURCE"

PROVIDER_ID_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $PROVIDER_JOBS_RESOURCE \
  --path-part "{provider_id}" \
  --region $REGION 2>/dev/null | jq -r '.id')

if [ -z "$PROVIDER_ID_RESOURCE" ]; then
  PROVIDER_ID_RESOURCE=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION | jq -r '.items[] | select(.path == "/provider-jobs/{provider_id}") | .id')
fi

echo "  /{provider_id} resource: $PROVIDER_ID_RESOURCE"

# Create GET method for provider jobs
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $PROVIDER_ID_RESOURCE \
  --http-method GET \
  --authorization-type NONE \
  --no-api-key-required \
  --region $REGION >/dev/null 2>&1

# Create integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $PROVIDER_ID_RESOURCE \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:HH_GetProviderJobs/invocations" \
  --region $REGION >/dev/null 2>&1

echo "  ✓ GET method and integration created"

# Add Lambda permissions
echo ""
echo "Adding Lambda permissions..."

aws lambda add-permission \
  --function-name HH_GetFarmerRequests \
  --statement-id apigateway-farmer-requests-$(date +%s) \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*/farmer-requests/*" \
  --region $REGION >/dev/null 2>&1 || echo "  (Permission may already exist)"

aws lambda add-permission \
  --function-name HH_GetProviderJobs \
  --statement-id apigateway-provider-jobs-$(date +%s) \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*/provider-jobs/*" \
  --region $REGION >/dev/null 2>&1 || echo "  (Permission may already exist)"

echo "  ✓ Permissions added"

# Deploy API
echo ""
echo "Deploying API to prod stage..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION 2>&1 | jq -r '.id')

if [ "$DEPLOYMENT_ID" != "null" ] && [ -n "$DEPLOYMENT_ID" ]; then
  echo "  ✓ Deployment successful: $DEPLOYMENT_ID"
else
  echo "  ✗ Deployment failed - checking for issues..."
  # Try to identify the problem
  aws apigateway get-resources --rest-api-id $API_ID --region $REGION | jq -r '.items[] | select(.resourceMethods != null) | {path: .path, methods: (.resourceMethods | keys)}'
fi

echo ""
echo "=========================================="
echo "Endpoints Ready"
echo "=========================================="
echo ""
echo "Farmer Requests:"
echo "  GET https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/farmer-requests/{farmer_id}"
echo ""
echo "Provider Jobs:"
echo "  GET https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/provider-jobs/{provider_id}"
echo ""
