#!/bin/bash

# API Endpoints
CREATE_URL="https://bge5yhhpjhz5h25xctgthp6jga0knada.lambda-url.ap-south-1.on.aws/"
ACCEPT_URL="https://f3ic3o3t5nootutmkpw5bnelre0zxfeh.lambda-url.ap-south-1.on.aws/"
COMPLETE_URL="https://lex4uzzrsxfux5hwxaoukvs4ia0wujqx.lambda-url.ap-south-1.on.aws/"
STATUS_URL="https://mh4yfmuwjclqotzpgbgx2fvt5u0vjxbn.lambda-url.ap-south-1.on.aws/"
REGISTER_URL="https://73rfxs4cbpytpjt4uvw4i7ozyy0fishg.lambda-url.ap-south-1.on.aws/"

echo "🚜 Testing Helping Hand API"
echo "================================"

# Test 1: Create Request
echo -e "\n1️⃣ Creating service request..."
RESPONSE=$(curl -s -X POST $CREATE_URL \
  -H "Content-Type: application/json" \
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
echo -e "\n⏳ Waiting 5 seconds for provider matching..."
sleep 5

# Test 2: Get Status
echo -e "\n2️⃣ Checking request status..."
curl -s -X POST $STATUS_URL \
  -H "Content-Type: application/json" \
  -d "{\"pathParameters\": {\"request_id\": \"$REQUEST_ID\"}}" | jq '.'

# Test 3: Accept Request
echo -e "\n3️⃣ Provider accepting request..."
curl -s -X POST $ACCEPT_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"$REQUEST_ID\",
    \"provider_id\": \"PRV_9876543210\"
  }" | jq '.'

# Test 4: Check Status Again
echo -e "\n4️⃣ Checking status after acceptance..."
curl -s -X POST $STATUS_URL \
  -H "Content-Type: application/json" \
  -d "{\"pathParameters\": {\"request_id\": \"$REQUEST_ID\"}}" | jq '.'

# Test 5: Complete and Rate
echo -e "\n5️⃣ Completing job and rating provider..."
curl -s -X POST $COMPLETE_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"$REQUEST_ID\",
    \"rating\": 5
  }" | jq '.'

# Test 6: Race Condition Test
echo -e "\n6️⃣ Testing race condition (should fail with 409)..."
RESPONSE2=$(curl -s -X POST $CREATE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "farmer_id": "+919999999998",
    "farmer_name": "Test Farmer",
    "service_type": "TRACTOR",
    "farmer_pincode": "411001",
    "estimated_price": 500
  }')

REQUEST_ID2=$(echo "$RESPONSE2" | jq -r '.request_id')
sleep 2

# Try to accept with two providers simultaneously
curl -s -X POST $ACCEPT_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"$REQUEST_ID2\",
    \"provider_id\": \"PRV_9876543210\"
  }" | jq '.'

echo -e "\nAttempting second acceptance (should return 409)..."
curl -s -X POST $ACCEPT_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"request_id\": \"$REQUEST_ID2\",
    \"provider_id\": \"PRV_9876543211\"
  }" | jq '.'

echo -e "\n✅ API Testing Complete!"
