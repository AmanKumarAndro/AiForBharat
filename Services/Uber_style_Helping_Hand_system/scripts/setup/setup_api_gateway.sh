#!/bin/bash

# Load environment variables from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../../.env" ]; then
    source "$SCRIPT_DIR/../../.env"
fi

REGION="ap-south-1"
ACCOUNT_ID=${AWS_ACCOUNT_ID:-"YOUR_AWS_ACCOUNT_ID"}

echo "🚀 Setting up API Gateway for Helping Hand"
echo "==========================================="

# Get API ID (already created)
API_ID="nhl6zxlp70"
ROOT_ID=$(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`/`].id' --output text)

echo "API ID: $API_ID"
echo "Root Resource ID: $ROOT_ID"

# Create /request resource
echo -e "\n📍 Creating /request endpoint..."
REQUEST_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part request \
  --query 'id' --output text 2>/dev/null || \
  aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/request'].id" --output text)

aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $REQUEST_RESOURCE \
  --http-method POST \
  --authorization-type NONE 2>/dev/null || true

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $REQUEST_RESOURCE \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:HH_CreateRequest/invocations" 2>/dev/null || true

# Create /accept resource
echo "📍 Creating /accept endpoint..."
ACCEPT_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part accept \
  --query 'id' --output text 2>/dev/null || \
  aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/accept'].id" --output text)

aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $ACCEPT_RESOURCE \
  --http-method POST \
  --authorization-type NONE 2>/dev/null || true

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $ACCEPT_RESOURCE \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:HH_AcceptRequest/invocations" 2>/dev/null || true

# Create /complete resource
echo "📍 Creating /complete endpoint..."
COMPLETE_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part complete \
  --query 'id' --output text 2>/dev/null || \
  aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/complete'].id" --output text)

aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $COMPLETE_RESOURCE \
  --http-method POST \
  --authorization-type NONE 2>/dev/null || true

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $COMPLETE_RESOURCE \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:HH_CompleteAndRate/invocations" 2>/dev/null || true

# Create /status resource
echo "📍 Creating /status endpoint..."
STATUS_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part status \
  --query 'id' --output text 2>/dev/null || \
  aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/status'].id" --output text)

# Create /status/{request_id} resource
STATUS_ID_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $STATUS_RESOURCE \
  --path-part '{request_id}' \
  --query 'id' --output text 2>/dev/null || \
  aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/status/{request_id}'].id" --output text)

aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $STATUS_ID_RESOURCE \
  --http-method GET \
  --authorization-type NONE \
  --request-parameters method.request.path.request_id=true 2>/dev/null || true

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $STATUS_ID_RESOURCE \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:HH_GetStatus/invocations" 2>/dev/null || true

# Create /provider resource
echo "📍 Creating /provider endpoint..."
PROVIDER_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part provider \
  --query 'id' --output text 2>/dev/null || \
  aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/provider'].id" --output text)

# Create /provider/register resource
REGISTER_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $PROVIDER_RESOURCE \
  --path-part register \
  --query 'id' --output text 2>/dev/null || \
  aws apigateway get-resources --rest-api-id $API_ID --query "items[?path=='/provider/register'].id" --output text)

aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $REGISTER_RESOURCE \
  --http-method POST \
  --authorization-type NONE 2>/dev/null || true

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $REGISTER_RESOURCE \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:HH_RegisterProvider/invocations" 2>/dev/null || true

# Add Lambda permissions
echo -e "\n🔐 Adding Lambda permissions..."
for func in HH_CreateRequest HH_AcceptRequest HH_CompleteAndRate HH_GetStatus HH_RegisterProvider; do
  aws lambda add-permission \
    --function-name $func \
    --statement-id apigateway-invoke-$API_ID \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*" 2>/dev/null || true
done

# Deploy API
echo -e "\n🚀 Deploying API to prod stage..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --description "Helping Hand API Production Deployment" > /dev/null

# Get API URL
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo -e "\n✅ API Gateway Setup Complete!"
echo -e "\n📋 API Details:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "API URL: $API_URL"
echo "Region: $REGION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "\n📍 Endpoints:"
echo "  POST   $API_URL/request"
echo "  POST   $API_URL/accept"
echo "  POST   $API_URL/complete"
echo "  GET    $API_URL/status/{request_id}"
echo "  POST   $API_URL/provider/register"
echo -e "\n💡 Use this URL as {{base_url}} in Postman"
echo -e "\n🧪 Test with:"
echo "  curl -X POST $API_URL/request \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"farmer_id\":\"+919999999999\",\"farmer_name\":\"Test\",\"service_type\":\"TRACTOR\",\"farmer_pincode\":\"411001\",\"estimated_price\":500}'"
