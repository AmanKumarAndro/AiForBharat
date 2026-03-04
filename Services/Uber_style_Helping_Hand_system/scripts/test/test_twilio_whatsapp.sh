#!/bin/bash

BASE_URL="https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod"

echo "📱 Testing Twilio WhatsApp Notifications"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: Before testing, ensure:"
echo "   1. You've run: ./setup_twilio.sh <SID> <TOKEN>"
echo "   2. Provider phone numbers have joined Twilio sandbox"
echo "   3. Farmer phone number has joined Twilio sandbox"
echo ""
echo "📝 To join sandbox:"
echo "   • Open WhatsApp"
echo "   • Send message to: +1 415 523 8886"
echo "   • Send the join code from Twilio Console"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "1️⃣  Creating service request (will trigger WhatsApp to providers)..."
RESPONSE=$(curl -s -X POST $BASE_URL/request \
  -H 'Content-Type: application/json' \
  -d '{
    "farmer_id": "+919999999999",
    "farmer_name": "Rajesh Sharma",
    "service_type": "TRACTOR",
    "farmer_pincode": "411001",
    "estimated_price": 500
  }')

echo "$RESPONSE" | jq '.'
REQUEST_ID=$(echo "$RESPONSE" | jq -r '.request_id')
echo "✓ Request ID: $REQUEST_ID"

echo ""
echo "⏳ Waiting 8 seconds for WhatsApp messages to be sent..."
sleep 8

echo ""
echo "2️⃣  Checking Lambda logs for WhatsApp confirmation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws logs tail /aws/lambda/HH_MatchProviders --since 2m --format short | grep -E "WhatsApp sent|Failed to send|Twilio" | tail -10
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "3️⃣  Provider accepting request (will trigger WhatsApp to farmer)..."
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
echo "4️⃣  Checking Lambda logs for farmer WhatsApp confirmation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
aws logs tail /aws/lambda/HH_AcceptRequest --since 2m --format short | grep -E "WhatsApp sent|Failed to send|Twilio" | tail -10
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "✅ WhatsApp Notification Test Complete!"
echo ""
echo "📋 Expected WhatsApp Messages:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "To Providers (Top 3):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚜 Helping Hand - New Request"
echo ""
echo "Service: TRACTOR"
echo "Farmer: Rajesh Sharma"
echo "Location: 411001"
echo "Price: ₹500"
echo ""
echo "Accept now in the app!"
echo "Request ID: ${REQUEST_ID:0:8}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "To Farmer (After Acceptance):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚜 Helping Hand - Provider Matched!"
echo ""
echo "Provider: Ramesh Kumar"
echo "Rating: 4.8⭐"
echo "Phone: +919876543210"
echo ""
echo "You can call them now!"
echo "Request ID: ${REQUEST_ID:0:8}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Check WhatsApp on the registered phone numbers"
echo ""
echo "🔍 Troubleshooting:"
echo "   • If no messages received, check if numbers joined sandbox"
echo "   • Check CloudWatch logs for errors"
echo "   • Verify Twilio credentials in Lambda environment variables"
echo "   • Check Twilio Console for message delivery status"
