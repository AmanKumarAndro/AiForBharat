#!/bin/bash

BASE_URL="https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod"

echo "🚜 Helping Hand - Complete End-to-End Test with SMS"
echo "====================================================="
echo ""
echo "This will test the complete flow with SMS notifications:"
echo "  1. Create request → SMS to providers"
echo "  2. Accept request → SMS to farmer"
echo ""
read -p "Press Enter to start test..."

echo ""
echo "1️⃣  Creating service request..."
RESPONSE=$(curl -s -X POST $BASE_URL/request \
  -H 'Content-Type: application/json' \
  -d '{
    "farmer_id": "+919910890180",
    "farmer_name": "Test User",
    "service_type": "TRACTOR",
    "farmer_pincode": "411001",
    "estimated_price": 500
  }')

echo "$RESPONSE" | jq '.'
REQUEST_ID=$(echo "$RESPONSE" | jq -r '.request_id')
echo ""
echo "✓ Request ID: $REQUEST_ID"
echo "📱 SMS should be sent to top 3 providers now..."

echo ""
echo "⏳ Waiting 10 seconds for SMS delivery and provider matching..."
sleep 10

echo ""
echo "2️⃣  Checking request status..."
curl -s -X GET "$BASE_URL/status/$REQUEST_ID" | jq '.'

echo ""
echo "3️⃣  Provider accepting request..."
curl -s -X POST $BASE_URL/accept \
  -H 'Content-Type: application/json' \
  -d "{
    \"request_id\": \"$REQUEST_ID\",
    \"provider_id\": \"PRV_9876543210\"
  }" | jq '.'

echo ""
echo "📱 SMS should be sent to farmer (+919910890180) now..."
echo ""
echo "⏳ Waiting 5 seconds..."
sleep 5

echo ""
echo "4️⃣  Checking final status..."
curl -s -X GET "$BASE_URL/status/$REQUEST_ID" | jq '.'

echo ""
echo "5️⃣  Checking CloudWatch logs for SMS confirmation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Provider notifications:"
aws logs tail /aws/lambda/HH_MatchProviders --since 2m --format short | grep -E "SMS sent|Failed" | tail -5
echo ""
echo "Farmer notification:"
aws logs tail /aws/lambda/HH_AcceptRequest --since 2m --format short | grep -E "SMS sent|Failed" | tail -5
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "✅ Complete End-to-End Test Finished!"
echo ""
echo "📱 Check your phone (+919910890180) for:"
echo "   1. Provider acceptance SMS"
echo ""
echo "📋 Expected SMS:"
echo "   'Helping Hand: Ramesh Kumar accepted your request!"
echo "    Rating: 4.8 stars. Call: +919876543210. ID: ${REQUEST_ID:0:8}'"
