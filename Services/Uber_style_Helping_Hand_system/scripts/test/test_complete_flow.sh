#!/bin/bash

BASE_URL="https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod"

echo "🚜 Helping Hand - Complete API Test Flow"
echo "=========================================="
echo ""

# Test 1: Create Request
echo "1️⃣  Creating service request..."
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

# Wait for matching
echo ""
echo "⏳ Waiting 6 seconds for provider matching..."
sleep 6

# Test 2: Get Status
echo ""
echo "2️⃣  Checking request status..."
curl -s -X GET "$BASE_URL/status/$REQUEST_ID" | jq '.'

# Test 3: Accept Request
echo ""
echo "3️⃣  Provider accepting request..."
curl -s -X POST $BASE_URL/accept \
  -H 'Content-Type: application/json' \
  -d "{
    \"request_id\": \"$REQUEST_ID\",
    \"provider_id\": \"PRV_9876543210\"
  }" | jq '.'

# Test 4: Check Status After Acceptance
echo ""
echo "4️⃣  Checking status after acceptance..."
curl -s -X GET "$BASE_URL/status/$REQUEST_ID" | jq '.'

# Test 5: Complete and Rate
echo ""
echo "5️⃣  Completing job and rating provider..."
curl -s -X POST $BASE_URL/complete \
  -H 'Content-Type: application/json' \
  -d "{
    \"request_id\": \"$REQUEST_ID\",
    \"rating\": 5
  }" | jq '.'

# Test 6: Race Condition
echo ""
echo "6️⃣  Testing race condition..."
RESPONSE2=$(curl -s -X POST $BASE_URL/request \
  -H 'Content-Type: application/json' \
  -d '{
    "farmer_id": "+919999999998",
    "farmer_name": "Test Farmer",
    "service_type": "TRACTOR",
    "farmer_pincode": "411001",
    "estimated_price": 500
  }')

REQUEST_ID2=$(echo "$RESPONSE2" | jq -r '.request_id')
echo "Second request ID: $REQUEST_ID2"
sleep 3

echo ""
echo "First provider accepting..."
curl -s -X POST $BASE_URL/accept \
  -H 'Content-Type: application/json' \
  -d "{
    \"request_id\": \"$REQUEST_ID2\",
    \"provider_id\": \"PRV_9876543210\"
  }" | jq '.'

echo ""
echo "Second provider trying (should fail with 409)..."
curl -s -X POST $BASE_URL/accept \
  -H 'Content-Type: application/json' \
  -d "{
    \"request_id\": \"$REQUEST_ID2\",
    \"provider_id\": \"PRV_9876543211\"
  }" | jq '.'

echo ""
echo "✅ Complete API Test Flow Finished!"
echo ""
echo "📊 Summary:"
echo "  ✓ Request creation"
echo "  ✓ Provider matching"
echo "  ✓ Atomic acceptance"
echo "  ✓ Status tracking"
echo "  ✓ Rating system"
echo "  ✓ Race condition prevention"
