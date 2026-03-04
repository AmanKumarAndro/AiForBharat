#!/bin/bash

# Helping Hand - Complete Deployment Script
# This script deploys all Lambda functions and API Gateway endpoints

set -e  # Exit on error

# Configuration
API_ID="nhl6zxlp70"
REGION="ap-south-1"
ACCOUNT_ID=${AWS_ACCOUNT_ID:-"YOUR_AWS_ACCOUNT_ID"}
STAGE="prod"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Helping Hand - Complete Deployment"
echo "=========================================="
echo ""
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo "API ID: $API_ID"
echo "Stage: $STAGE"
echo ""

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if AWS CLI is configured
print_info "Checking AWS CLI configuration..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI not configured. Please run 'aws configure'"
    exit 1
fi
print_success "AWS CLI configured"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Please install jq"
    exit 1
fi
print_success "jq installed"

echo ""
echo "=========================================="
echo "Step 1: Package Lambda Functions"
echo "=========================================="
echo ""

cd lambda

LAMBDA_FUNCTIONS=(
    "create_request"
    "match_providers"
    "accept_request"
    "complete_and_rate"
    "get_status"
    "register_provider"
    "get_providers_map"
    "get_farmer_requests"
    "get_provider_jobs"
    "handle_sms_reply"
    "test_sms_accept"
)

for func in "${LAMBDA_FUNCTIONS[@]}"; do
    print_info "Packaging $func..."
    zip -q ${func}.zip ${func}.py
    print_success "$func packaged"
done

cd ..

echo ""
echo "=========================================="
echo "Step 2: Deploy Lambda Functions"
echo "=========================================="
echo ""

# Function to deploy or update Lambda
deploy_lambda() {
    local func_name=$1
    local handler=$2
    local memory=${3:-128}
    local timeout=${4:-30}
    local layer_arn=${5:-""}
    
    print_info "Deploying $func_name..."
    
    # Check if function exists
    if aws lambda get-function --function-name $func_name --region $REGION &> /dev/null; then
        # Update existing function
        aws lambda update-function-code \
            --function-name $func_name \
            --zip-file fileb://lambda/${handler}.zip \
            --region $REGION &> /dev/null
        
        # Update configuration if layer is specified
        if [ -n "$layer_arn" ]; then
            aws lambda update-function-configuration \
                --function-name $func_name \
                --layers $layer_arn \
                --region $REGION &> /dev/null
        fi
        
        print_success "$func_name updated"
    else
        # Create new function
        local create_cmd="aws lambda create-function \
            --function-name $func_name \
            --runtime python3.12 \
            --role arn:aws:iam::$ACCOUNT_ID:role/HelpingHandLambdaRole \
            --handler ${handler}.lambda_handler \
            --zip-file fileb://lambda/${handler}.zip \
            --timeout $timeout \
            --memory-size $memory \
            --region $REGION"
        
        if [ -n "$layer_arn" ]; then
            create_cmd="$create_cmd --layers $layer_arn"
        fi
        
        eval $create_cmd &> /dev/null
        print_success "$func_name created"
    fi
}

# Get Twilio layer ARN
TWILIO_LAYER="arn:aws:lambda:$REGION:$ACCOUNT_ID:layer:TwilioSDK:1"

# Deploy Lambda functions
deploy_lambda "HH_CreateRequest" "create_request" 128 30
deploy_lambda "HH_MatchProviders" "match_providers" 256 30 "$TWILIO_LAYER"
deploy_lambda "HH_AcceptRequest" "accept_request" 128 30 "$TWILIO_LAYER"
deploy_lambda "HH_CompleteAndRate" "complete_and_rate" 128 30
deploy_lambda "HH_GetStatus" "get_status" 128 30
deploy_lambda "HH_RegisterProvider" "register_provider" 128 30
deploy_lambda "HH_GetProvidersMap" "get_providers_map" 128 30
deploy_lambda "HH_GetFarmerRequests" "get_farmer_requests" 128 30
deploy_lambda "HH_GetProviderJobs" "get_provider_jobs" 128 30
deploy_lambda "HH_HandleSMSReply" "handle_sms_reply" 128 30 "$TWILIO_LAYER"
deploy_lambda "HH_TestSMSAccept" "test_sms_accept" 128 30 "$TWILIO_LAYER"

echo ""
echo "=========================================="
echo "Step 3: Configure Environment Variables"
echo "=========================================="
echo ""

# Check if Twilio credentials are set
if [ -z "$TWILIO_ACCOUNT_SID" ] || [ -z "$TWILIO_AUTH_TOKEN" ]; then
    print_info "Twilio credentials not found in environment"
    # Try to load from .env file
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    ENV_FILE="$SCRIPT_DIR/../../.env"
    if [ -f "$ENV_FILE" ]; then
        print_info "Loading credentials from .env file"
        source "$ENV_FILE"
    else
        print_error "No .env file found at $ENV_FILE. Please create it with TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER"
        exit 1
    fi
fi

# Update environment variables for SMS functions
SMS_FUNCTIONS=(
    "HH_MatchProviders"
    "HH_AcceptRequest"
    "HH_HandleSMSReply"
    "HH_TestSMSAccept"
)

for func in "${SMS_FUNCTIONS[@]}"; do
    print_info "Setting environment variables for $func..."
    aws lambda update-function-configuration \
        --function-name $func \
        --environment "Variables={TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN,TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER}" \
        --region $REGION &> /dev/null
    print_success "$func environment variables set"
done

echo ""
echo "=========================================="
echo "Step 4: Deploy API Gateway"
echo "=========================================="
echo ""

print_info "Deploying API to $STAGE stage..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --region $REGION 2>&1 | jq -r '.id')

if [ "$DEPLOYMENT_ID" != "null" ] && [ -n "$DEPLOYMENT_ID" ]; then
    print_success "API deployed: $DEPLOYMENT_ID"
else
    print_error "API deployment failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 5: Add Lambda Permissions"
echo "=========================================="
echo ""

# Function to add API Gateway permission to Lambda
add_permission() {
    local func_name=$1
    local path=$2
    
    print_info "Adding permission for $func_name..."
    aws lambda add-permission \
        --function-name $func_name \
        --statement-id apigateway-${func_name}-$(date +%s) \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*${path}" \
        --region $REGION &> /dev/null || true
    print_success "$func_name permission added"
}

add_permission "HH_RegisterProvider" "/provider"
add_permission "HH_CreateRequest" "/request"
add_permission "HH_GetStatus" "/status/*"
add_permission "HH_AcceptRequest" "/accept"
add_permission "HH_TestSMSAccept" "/test-accept"
add_permission "HH_CompleteAndRate" "/complete"
add_permission "HH_GetProvidersMap" "/providers-map"
add_permission "HH_GetFarmerRequests" "/farmer-requests/*"
add_permission "HH_GetProviderJobs" "/provider-jobs/*"
add_permission "HH_HandleSMSReply" "/sms-reply"

echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo ""

API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE"

echo "API Base URL:"
echo "  $API_URL"
echo ""

echo "Endpoints:"
echo "  POST   $API_URL/provider"
echo "  POST   $API_URL/request"
echo "  GET    $API_URL/status/{id}"
echo "  POST   $API_URL/accept"
echo "  POST   $API_URL/test-accept"
echo "  POST   $API_URL/complete"
echo "  GET    $API_URL/providers-map"
echo "  GET    $API_URL/farmer-requests/{farmer_id}"
echo "  GET    $API_URL/provider-jobs/{provider_id}"
echo "  POST   $API_URL/sms-reply"
echo ""

echo "Lambda Functions:"
for func in "${LAMBDA_FUNCTIONS[@]}"; do
    echo "  ✓ HH_${func^}"
done
echo ""

print_success "Deployment completed successfully!"
echo ""
echo "Next Steps:"
echo "  1. Test endpoints using: ./scripts/test/test_complete_flow.sh"
echo "  2. Configure Twilio webhook for SMS replies"
echo "  3. Seed test data: python infrastructure/seed_data.py"
echo ""
