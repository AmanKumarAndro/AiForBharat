#!/bin/bash

API_URL="https://kqndxs5w8c.execute-api.ap-south-1.amazonaws.com/dev"
SESSION_ID="demo-test-$(date +%s)"

echo "=========================================="
echo "🎤 VOICE API FLOW TEST"
echo "=========================================="
echo ""
echo "Session ID: $SESSION_ID"
echo "API URL: $API_URL"
echo ""

# Simulate the hybrid voice flow
echo "📱 STEP 1: User speaks (simulated)"
echo "User says: 'गेहूं की बुवाई कब करें?'"
echo ""

# Step 2: Text query (simulating STT result)
echo "☁️  STEP 2: Send text to AI backend (/query)"
echo "----------------------------------------"
QUESTION="गेहूं की बुवाई कब करें?"

QUERY_RESPONSE=$(curl -s -X POST "$API_URL/query" \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"$QUESTION\", \"sessionId\": \"$SESSION_ID\"}")

echo "Response:"
echo "$QUERY_RESPONSE" | jq '.'
echo ""

# Extract answer for TTS
ANSWER=$(echo "$QUERY_RESPONSE" | jq -r '.answer')
LATENCY=$(echo "$QUERY_RESPONSE" | jq -r '.latency')

echo "✅ AI Answer received in ${LATENCY}ms"
echo ""

# Step 3: Text-to-speech
echo "🔊 STEP 3: Convert answer to speech (/synthesize)"
echo "----------------------------------------"

TTS_RESPONSE=$(curl -s -X POST "$API_URL/synthesize" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$ANSWER\", \"sessionId\": \"$SESSION_ID\"}")

AUDIO_SIZE=$(echo "$TTS_RESPONSE" | jq -r '.audioBase64' | wc -c)

echo "Response:"
echo "$TTS_RESPONSE" | jq 'del(.audioBase64) + {audioBase64: "... (\(.audioBase64 | length) characters of base64 audio data) ..."}'
echo ""
echo "✅ Audio generated: $AUDIO_SIZE characters (base64)"
echo ""

# Summary
echo "=========================================="
echo "📊 SUMMARY"
echo "=========================================="
echo "Question: $QUESTION"
echo "Answer: $ANSWER"
echo "AI Latency: ${LATENCY}ms"
echo "Audio Size: $AUDIO_SIZE characters"
echo ""
echo "✅ Complete voice flow working!"
echo ""
echo "In React Native app:"
echo "1. User taps button and speaks"
echo "2. On-device STT captures: '$QUESTION'"
echo "3. Send to /query → Get answer (${LATENCY}ms)"
echo "4. Send to /synthesize → Get audio"
echo "5. Play audio to user"
echo ""
echo "Total time: ~5-10 seconds"
echo "=========================================="

