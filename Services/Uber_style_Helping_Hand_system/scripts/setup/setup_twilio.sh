#!/bin/bash

echo "🔧 Twilio WhatsApp Setup for Helping Hand"
echo "=========================================="
echo ""

# Check if Twilio credentials are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./setup_twilio.sh <ACCOUNT_SID> <AUTH_TOKEN>"
    echo ""
    echo "📝 How to get Twilio credentials:"
    echo "   1. Sign up at https://www.twilio.com/try-twilio"
    echo "   2. Go to Console Dashboard"
    echo "   3. Copy Account SID and Auth Token"
    echo ""
    echo "📱 WhatsApp Sandbox Setup:"
    echo "   1. Go to Console → Messaging → Try it out → Send a WhatsApp message"
    echo "   2. Send the join code to the WhatsApp number shown"
    echo "   3. Use sandbox number: whatsapp:+14155238886"
    echo ""
    exit 1
fi

ACCOUNT_SID=$1
AUTH_TOKEN=$2
WHATSAPP_NUMBER="whatsapp:+14155238886"  # Twilio sandbox number

echo "✓ Account SID: ${ACCOUNT_SID:0:10}..."
echo "✓ Auth Token: ${AUTH_TOKEN:0:10}..."
echo "✓ WhatsApp Number: $WHATSAPP_NUMBER"
echo ""

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
    --description "Twilio SDK for WhatsApp notifications" \
    --zip-file fileb://twilio_layer.zip \
    --compatible-runtimes python3.12 \
    --region ap-south-1 \
    --query 'LayerVersionArn' \
    --output text)

echo "✓ Layer ARN: $LAYER_ARN"

# Package and deploy match_providers Lambda
echo ""
echo "📦 Deploying HH_MatchProviders with Twilio..."
zip -j lambda/match_providers_twilio.zip lambda/match_providers_twilio.py > /dev/null

aws lambda update-function-code \
    --region ap-south-1 \
    --function-name HH_MatchProviders \
    --zip-file fileb://lambda/match_providers_twilio.zip > /dev/null

# Add layer to function
aws lambda update-function-configuration \
    --region ap-south-1 \
    --function-name HH_MatchProviders \
    --layers $LAYER_ARN > /dev/null

# Set environment variables
aws lambda update-function-configuration \
    --region ap-south-1 \
    --function-name HH_MatchProviders \
    --environment "Variables={TWILIO_ACCOUNT_SID=$ACCOUNT_SID,TWILIO_AUTH_TOKEN=$AUTH_TOKEN,TWILIO_WHATSAPP_NUMBER=$WHATSAPP_NUMBER}" > /dev/null

echo "✓ HH_MatchProviders deployed with Twilio"

# Package and deploy accept_request Lambda
echo ""
echo "📦 Deploying HH_AcceptRequest with Twilio..."
zip -j lambda/accept_request_twilio.zip lambda/accept_request_twilio.py > /dev/null

aws lambda update-function-code \
    --region ap-south-1 \
    --function-name HH_AcceptRequest \
    --zip-file fileb://lambda/accept_request_twilio.zip > /dev/null

# Add layer to function
aws lambda update-function-configuration \
    --region ap-south-1 \
    --function-name HH_AcceptRequest \
    --layers $LAYER_ARN > /dev/null

# Set environment variables
aws lambda update-function-configuration \
    --region ap-south-1 \
    --function-name HH_AcceptRequest \
    --environment "Variables={TWILIO_ACCOUNT_SID=$ACCOUNT_SID,TWILIO_AUTH_TOKEN=$AUTH_TOKEN,TWILIO_WHATSAPP_NUMBER=$WHATSAPP_NUMBER}" > /dev/null

echo "✓ HH_AcceptRequest deployed with Twilio"

# Cleanup
rm -f twilio_layer.zip lambda/match_providers_twilio.zip lambda/accept_request_twilio.zip

echo ""
echo "✅ Twilio WhatsApp Setup Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Next Steps:"
echo ""
echo "1. Join Twilio WhatsApp Sandbox:"
echo "   • Open WhatsApp"
echo "   • Send message to: +1 415 523 8886"
echo "   • Send the join code shown in Twilio Console"
echo ""
echo "2. Update provider phone numbers to WhatsApp format:"
echo "   • Format: +919876543210 (E.164 format)"
echo "   • Must join sandbox to receive messages"
echo ""
echo "3. Test WhatsApp notifications:"
echo "   ./test_twilio_whatsapp.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Twilio Sandbox Limitations:"
echo "   • Users must join sandbox first"
echo "   • Good for testing/demo"
echo "   • For production, upgrade to Twilio WhatsApp Business"
echo ""
echo "📚 Documentation: WHATSAPP_ALTERNATIVE.md"
