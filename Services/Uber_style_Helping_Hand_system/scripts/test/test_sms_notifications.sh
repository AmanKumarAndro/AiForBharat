#!/bin/bash

BASE_URL="https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod"

echo "📱 Testing SMS Notifications"
echo "=============================="
echo ""
echo "⚠️  NOTE: SMS will be sent to provider phone numbers in the database"
echo "    Make sure you have access to these numbers to verify:"
echo "    - Ramesh Kumar: +919876543210"
echo "    - Suresh Patil: +919876543211"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "1️⃣  Creating service request (will trigger SMS to providers)..."
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
echo "⏳ Waiting 8 seconds for SMS to be sent..."
sleep 8

echo ""
echo "2️⃣  Checking Lambda logs for SMS confirmation..."
aws logs tail /aws/lambda/HH_MatchProviders --since 1m --format short | grep -E "SMS sent|Failed to send"

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
aws logs tail /aws/lambda/HH_AcceptRequest --since 1m --format short | grep -E "SMS sent|Failed to send"

echo ""
echo "✅ SMS Notification Test Complete!"
echo ""
echo "📋 Expected SMS Messages:"
echo ""
echo "To Providers (Top 3 rated):"
echo "  '🚜 Helping Hand: New TRACTOR request from Rajesh Sharma in 411001."
echo "   Price: ₹500. Accept now in app! Request ID: ${REQUEST_ID:0:8}'"
echo ""
echo "To Farmer (after acceptance):"
echo "  '🚜 Helping Hand: Ramesh Kumar accepted your request!"
echo "   Rating: 4.8⭐ Call: +919876543210. Request ID: ${REQUEST_ID:0:8}'"
echo ""
echo "💡 Check the phone numbers to verify SMS delivery"
