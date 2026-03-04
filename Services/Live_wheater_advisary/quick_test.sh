#!/bin/bash

# Quick Test Script for Weather Advisory API
# Run: chmod +x quick_test.sh && ./quick_test.sh

API_URL="https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory"

echo "🌾 Weather Advisory API - Quick Test"
echo "======================================"
echo ""

# Test 1: Gurgaon
echo "📍 Test 1: Gurgaon (Delhi NCR)"
echo "------------------------------"
curl -s -X POST $API_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "lat": 28.4595,
    "lon": 77.0266,
    "activity": "spraying"
  }' | python3 -m json.tool

echo ""
echo ""

# Test 2: Extract only friendly message
echo "📍 Test 2: Mumbai - Friendly Message Only"
echo "------------------------------------------"
curl -s -X POST $API_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "lat": 19.0760,
    "lon": 72.8777,
    "activity": "spraying"
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['friendly_message'])"

echo ""
echo ""

# Test 3: Safety status
echo "📍 Test 3: Bangalore - Safety Status"
echo "-------------------------------------"
curl -s -X POST $API_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "lat": 12.9716,
    "lon": 77.5946,
    "activity": "spraying"
  }' | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Safe to spray: {data['advisory']['spray_safe']}\"); print(f\"Temperature: {data['temperature']}°C\"); print(f\"Humidity: {data['humidity']}%\"); print(f\"Wind: {data['wind_speed']} km/h\")"

echo ""
echo ""
echo "✅ Tests completed!"
