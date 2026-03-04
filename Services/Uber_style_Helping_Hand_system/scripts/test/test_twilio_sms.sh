#!/bin/bash

BASE_URL="https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod"

echo "📱 Testing Twilio SMS Notifications"
echo "===================================="
echo ""
echo "⚠️  IMPORTANT: SMS to Indian numbers requires DLT registration!"
echo ""
echo "   For testing without DLT:"
echo "   • Use international phone numbers (+1, +44, etc.)"
echo "   • Update provider/farmer numbers in DynamoDB"
echo ""
echo "   Current provider numbers:"
aws dynamodb scan --table-name HH_Providers \
  --projection-expression "provider_id,phone" \
  --region ap-south-1 \
  --output table 2>/dev/null | grep -E "provider_id|phone" | head -10
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "1️⃣  Creating service request (will trigger SMS to providers)..."
RESPONSE=$(curl -s -X POST $BASE_URL/request \
  -H 'Content-Type: application/json' \
  -d '{
    "farmer_id": "+15551234567",
    "farmer_name": "Test Farmer",
    "service_type": "TRACTOR",
    "farmer_pincode": "411001",
    "estimated_price": 500
  }')

echo "$RESPONSE" | jq '.'
REQUEST_ID=$(echo "$RESPONSE" | jq -r '.request_id')
echo "✓ Request ID: $REQUEST_ID"

echo ""
echo "⏳ Waiting 8 seconds for SMS to be sent..."
sleep 8

echo ""
echo "2️⃣  Checking Lambda logs for SMS confirmation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws logs tail /aws/lambda/HH_MatchProviders --since 2m --format short | grep -E "SMS sent|Failed to send|Twilio|Error" | tail -15
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "3️⃣  Provider accepting request (will trigger SMS to farmer)..."
curl -s -X POST $BASE_URL/accept \
  -H 'Content-Type: application/json' \
  -d "{
    \"request_id\": \"$REQUEST_ID\",
    \"provider_id\": \"PRV_9876543210\"
  }" | jq '.'

echo ""
echo "⏳ Waiting 3 seconds..."
sleep 3

echo ""
echo "4️⃣  Checking Lambda logs for farmer SMS confirmation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws logs tail /aws/lambda/HH_AcceptRequest --since 2m --format short | grep -E "SMS sent|Failed to send|Twilio|Error" | tail -15
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "5️⃣  Checking Twilio message delivery..."
echo ""
echo "   Go to Twilio Console → Monitor → Logs → Messaging"
echo "   to see delivery status of sent messages"
echo ""

echo "✅ SMS Notification Test Complete!"
echo ""
echo "📋 Expected SMS Messages:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "To Providers:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Helping Hand: New TRACTOR request from Test Farmer in 411001."
echo "Price: Rs500. Accept in app! ID: ${REQUEST_ID:0:8}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "To Farmer:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Helping Hand: Ramesh Kumar accepted your request!"
echo "Rating: 4.8 stars. Call: +919876543210. ID: ${REQUEST_ID:0:8}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 Troubleshooting:"
echo ""
echo "   If SMS not received:"
echo "   • Check if numbers are in E.164 format (+15551234567)"
echo "   • For Indian numbers (+91...), DLT registration required"
echo "   • Check Twilio Console for delivery errors"
echo "   • Verify Twilio credentials in Lambda environment"
echo "   • Check CloudWatch logs for error messages"
echo ""
echo "   Common errors:"
echo "   • 'Message blocked by carrier' → DLT required for Indian numbers"
echo "   • 'Invalid To number' → Check phone number format"
echo "   • 'Trial account' → Verify recipient numbers in Twilio Console"
echo ""
echo "📚 Full guide: TWILIO_SMS_GUIDE.md"
