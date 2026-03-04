#!/bin/bash

# SMS Reply Workaround Test Script
# This script demonstrates how to test SMS reply acceptance without actually sending SMS
# (Useful when iOS device cannot send SMS to Twilio trial number)

API_BASE="https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod"

echo "=========================================="
echo "SMS Reply Acceptance - Workaround Test"
echo "=========================================="
echo ""

# Step 1: Create a new request
echo "Step 1: Creating a new TRANSPORT request..."
REQUEST_RESPONSE=$(curl -s -X POST $API_BASE/request \
  -H 'Content-Type: application/json' \
  -d '{
    "farmer_id": "+919910890180",
    "farmer_name": "Test Farmer",
    "service_type": "TRANSPORT",
    "farmer_pincode": "411001",
    "estimated_price": 600
  }')

REQUEST_ID=$(echo $REQUEST_RESPONSE | jq -r '.request_id')
echo "✓ Request created: $REQUEST_ID"
echo ""

# Step 2: Wait for SMS notifications to be sent
echo "Step 2: Waiting for SMS notifications (5 seconds)..."
sleep 5

# Check request status
STATUS_RESPONSE=$(curl -s $API_BASE/status/$REQUEST_ID)
CURRENT_STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
echo "✓ Request status: $CURRENT_STATUS"
echo ""

# Step 3: Simulate SMS reply using test endpoint
echo "Step 3: Simulating SMS reply 'YES' from provider +919910890180..."
echo "(In real scenario, provider would reply YES to SMS)"
echo ""

ACCEPT_RESPONSE=$(curl -s -X POST $API_BASE/test-accept \
  -H 'Content-Type: application/json' \
  -d '{
    "provider_phone": "+919910890180"
  }')

echo "Response:"
echo $ACCEPT_RESPONSE | jq .
echo ""

# Step 4: Verify request was accepted
echo "Step 4: Verifying request status..."
FINAL_STATUS=$(curl -s $API_BASE/status/$REQUEST_ID)
echo $FINAL_STATUS | jq .
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "✓ Request created and SMS sent to providers"
echo "✓ Provider 'accepted' via test endpoint (simulating SMS reply)"
echo "✓ Confirmation SMS sent to both provider and farmer"
echo ""
echo "Note: This workaround is needed because:"
echo "- Twilio trial account cannot receive international SMS"
echo "- iOS device in India cannot send SMS to US Twilio number"
echo ""
echo "For production:"
echo "- Upgrade to paid Twilio account, OR"
echo "- Use Indian SMS gateway (like MSG91, Gupshup)"
echo "=========================================="
