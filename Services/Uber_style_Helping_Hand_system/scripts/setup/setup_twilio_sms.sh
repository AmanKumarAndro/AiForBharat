#!/bin/bash

echo "📱 Twilio SMS Setup for Helping Hand"
echo "======================================"
echo ""

# Check if Twilio credentials are provided
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Usage: ./setup_twilio_sms.sh <ACCOUNT_SID> <AUTH_TOKEN> <TWILIO_PHONE_NUMBER>"
    echo ""
    echo "📝 How to get Twilio credentials:"
    echo "   1. Sign up at https://www.twilio.com/try-twilio"
    echo "   2. Go to Console Dashboard"
    echo "   3. Copy Account SID and Auth Token"
    echo "   4. Get a phone number:"
    echo "      - Go to Phone Numbers → Manage → Buy a number"
    echo "      - Or use trial number (limited to verified numbers)"
    echo ""
    echo "⚠️  IMPORTANT FOR INDIA:"
    echo "   • SMS to Indian numbers requires DLT registration"
    echo "   • For testing, use international numbers (+1, +44, etc.)"
    echo "   • Or complete DLT registration (2-3 days)"
    echo ""
    echo "Example:"
    echo "   ./setup_twilio_sms.sh AC1234567890abcdef your_auth_token +15551234567"
    echo ""
    exit 1
fi

ACCOUNT_SID=$1
AUTH_TOKEN=$2
PHONE_NUMBER=$3

echo "✓ Account SID: ${ACCOUNT_SID:0:10}..."
echo "✓ Auth Token: ${AUTH_TOKEN:0:10}..."
echo "✓ Phone Number: $PHONE_NUMBER"
echo ""

# Validate phone number format
if [[ ! $PHONE_NUMBER =~ ^\+[0-9]{10,15}$ ]]; then
    echo "❌ Error: Phone number must be in E.164 format (e.g., +15551234567)"
    exit 1
fi

# Create Lambda layer with Twilio
echo "📦 Creating Lambda layer with Twilio SDK..."
mkdir -p lambda_layer/python
pip install twilio -t lambda_layer/python/ -q
cd lambda_layer
zip -r ../twilio_layer.zip python > /dev/null
cd ..
rm -rf lambda_layer

echo "✓ Twilio layer created"

# Upload layer to AWS
echo ""
echo "📤 Uploading Twilio layer to AWS Lambda..."
LAYER_ARN=$(aws lambda publish-layer-version \
    --layer-name TwilioSDK \
    --description "Twilio SDK for SMS notifications" \
    --zip-file fileb://twilio_layer.zip \
    --compatible-runtimes python3.12 \
    --region ap-south-1 \
    --query 'LayerVersionArn' \
    --output text)

echo "✓ Layer ARN: $LAYER_ARN"

# Package and deploy match_providers Lambda
echo ""
echo "📦 Deploying HH_MatchProviders with Twilio SMS..."
zip -j lambda/match_providers_sms.zip lambda/match_providers_twilio_sms.py > /dev/null

aws lambda update-function-code \
    --region ap-south-1 \
    --function-name HH_MatchProviders \
    --zip-file fileb://lambda/match_providers_sms.zip > /dev/null

# Add layer to function
aws lambda update-function-configuration \
    --region ap-south-1 \
    --function-name HH_MatchProviders \
    --layers $LAYER_ARN > /dev/null

# Set environment variables
aws lambda update-function-configuration \
    --region ap-south-1 \
    --function-name HH_MatchProviders \
    --environment "Variables={TWILIO_ACCOUNT_SID=$ACCOUNT_SID,TWILIO_AUTH_TOKEN=$AUTH_TOKEN,TWILIO_PHONE_NUMBER=$PHONE_NUMBER}" > /dev/null

echo "✓ HH_MatchProviders deployed with Twilio SMS"

# Package and deploy accept_request Lambda
echo ""
echo "📦 Deploying HH_AcceptRequest with Twilio SMS..."
zip -j lambda/accept_request_sms.zip lambda/accept_request_twilio_sms.py > /dev/null

aws lambda update-function-code \
    --region ap-south-1 \
    --function-name HH_AcceptRequest \
    --zip-file fileb://lambda/accept_request_sms.zip > /dev/null

# Add layer to function
aws lambda update-function-configuration \
    --region ap-south-1 \
    --function-name HH_AcceptRequest \
    --layers $LAYER_ARN > /dev/null

# Set environment variables
aws lambda update-function-configuration \
    --region ap-south-1 \
    --function-name HH_AcceptRequest \
    --environment "Variables={TWILIO_ACCOUNT_SID=$ACCOUNT_SID,TWILIO_AUTH_TOKEN=$AUTH_TOKEN,TWILIO_PHONE_NUMBER=$PHONE_NUMBER}" > /dev/null

echo "✓ HH_AcceptRequest deployed with Twilio SMS"

# Cleanup
rm -f twilio_layer.zip lambda/match_providers_sms.zip lambda/accept_request_sms.zip

echo ""
echo "✅ Twilio SMS Setup Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Configuration:"
echo "   Account SID: ${ACCOUNT_SID:0:10}..."
echo "   Phone Number: $PHONE_NUMBER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT - DLT Registration for India:"
echo ""
echo "   SMS to Indian mobile numbers (+91...) requires DLT registration."
echo "   Without DLT, messages will be blocked by Indian telecom operators."
echo ""
echo "   Options:"
echo "   1. Test with international numbers (US: +1, UK: +44)"
echo "   2. Complete DLT registration:"
echo "      • Register at https://www.vilpower.in or https://smartping.live"
echo "      • Get Entity ID and Template ID"
echo "      • Submit to Twilio (2-3 days approval)"
echo ""
echo "   For hackathon/demo: Use international test numbers"
echo "   For production: Complete DLT registration"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 Next Steps:"
echo "   1. Test with international numbers:"
echo "      ./test_twilio_sms.sh"
echo ""
echo "   2. Or update provider numbers to international format:"
echo "      aws dynamodb update-item --table-name HH_Providers \\"
echo "        --key '{\"provider_id\":{\"S\":\"PRV_9876543210\"}}' \\"
echo "        --update-expression 'SET phone = :phone' \\"
echo "        --expression-attribute-values '{\":phone\":{\"S\":\"+15551234567\"}}'"
echo ""
echo "📚 Documentation: TWILIO_SMS_GUIDE.md"
