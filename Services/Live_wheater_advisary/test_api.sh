#!/bin/bash
# Test the deployed API

if [ -z "$1" ]; then
  echo "Usage: ./test_api.sh <API_ENDPOINT>"
  echo "Example: ./test_api.sh https://abc123.execute-api.us-east-1.amazonaws.com/prod/weather/advisory"
  exit 1
fi

API_ENDPOINT=$1

echo "🧪 Testing Weather Advisory API..."
echo "Endpoint: $API_ENDPOINT"
echo ""

# Test 1: Gurgaon (Delhi NCR)
echo "Test 1: Gurgaon, India"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST $API_ENDPOINT \
  -H 'Content-Type: application/json' \
  -d '{"lat": 28.4595, "lon": 77.0266, "activity": "spraying"}' \
  | python3 -m json.tool
echo ""
echo ""

# Test 2: Mumbai
echo "Test 2: Mumbai, India"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST $API_ENDPOINT \
  -H 'Content-Type: application/json' \
  -d '{"lat": 19.0760, "lon": 72.8777, "activity": "spraying"}' \
  | python3 -m json.tool
echo ""
echo ""

# Test 3: Bangalore
echo "Test 3: Bangalore, India"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST $API_ENDPOINT \
  -H 'Content-Type: application/json' \
  -d '{"lat": 12.9716, "lon": 77.5946, "activity": "spraying"}' \
  | python3 -m json.tool
echo ""

echo "✅ Tests completed"
