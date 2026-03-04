# 🔌 Farmer Voice AI - API Guide

> Complete API documentation with examples, use cases, and integration guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Base URL & Headers](#base-url--headers)
4. [API Endpoints](#api-endpoints)
5. [Response Formats](#response-formats)
6. [Error Handling](#error-handling)
7. [Rate Limits](#rate-limits)
8. [Code Examples](#code-examples)
9. [Testing](#testing)
10. [Best Practices](#best-practices)

---

## 1. Getting Started

### Overview

The Farmer Voice AI API provides 5 main endpoints for voice and text-based agricultural assistance in Hindi:

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `/query` | Text-based AI queries | Ask farming questions via text |
| `/synthesize` | Text-to-speech | Convert Hindi text to audio |
| `/transcribe` | Speech-to-text | Convert audio to Hindi text |
| `/voice-query` | Complete voice pipeline | End-to-end voice interaction |
| `/history` | Conversation history | Retrieve past conversations |

### Quick Example

```bash
curl -X POST https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "गेहूं की बुवाई कब करें?",
    "sessionId": "user-123"
  }'
```

---

## 2. Authentication

### Current Status (Hackathon Mode)

**No authentication required** - The API is open for demo purposes.

### Production Recommendations

For production deployment, implement:
- API Key authentication via `X-API-Key` header
- JWT tokens for user sessions
- Rate limiting per API key
- AWS Cognito for user management

**Example with API Key:**
```bash
curl -X POST https://api.farmervoiceai.com/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"question": "...", "sessionId": "..."}'
```

---

## 3. Base URL & Headers

### Base URL

```
Production: https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev
```

### Required Headers

```http
Content-Type: application/json
```

### Optional Headers

```http
X-Session-Id: user-session-id
X-Request-Id: unique-request-id
Accept-Language: hi-IN
```

### CORS Support

All endpoints support CORS with the following headers:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## 4. API Endpoints

### 4.1 POST /query

**Purpose:** Ask farming questions in Hindi and get AI-powered answers with automatic tool selection.

**Endpoint:**
```
POST /query
```

**Request Body:**
```json
{
  "question": "string (required) - Question in Hindi",
  "sessionId": "string (required) - Unique session identifier",
  "useAgent": "boolean (optional) - Use Bedrock Agent (default: false)",
  "includeHistory": "boolean (optional) - Include conversation history (default: true)"
}
```

**Response:**
```json
{
  "answer": "string - Hindi text answer",
  "source": "string - Data source (RAG/Agent/Live)",
  "isLiveAnswer": "boolean - Whether answer uses live data",
  "sessionId": "string - Session identifier",
  "isFollowUp": "boolean - Whether question is follow-up",
  "conversationTurns": "number - Number of conversation turns",
  "latency": "number - Response time in milliseconds",
  "toolsUsed": ["string"] - Array of tools triggered,
  "videos": [
    {
      "title": "string - Video title",
      "description": "string - Video description",
      "channel": "string - Channel name",
      "url": "string - YouTube URL",
      "thumbnail": "string - Thumbnail URL",
      "videoId": "string - Video ID"
    }
  ],
  "webLinks": [
    {
      "title": "string - Link title",
      "url": "string - Website URL",
      "description": "string - Link description"
    }
  ]
}
```

**Example Request:**
```bash
curl -X POST https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "गेहूं की बुवाई कब करें?",
    "sessionId": "farmer-001"
  }'
```

**Example Response:**
```json
{
  "answer": "गेहूं की बुवाई नवंबर के पहले हफ्ते में करें। मिट्टी का तापमान 20-25 डिग्री होना चाहिए। बीज की दूरी 20 सेमी रखें और 5-6 सेमी गहराई में बोएं।",
  "source": "RAG",
  "isLiveAnswer": false,
  "sessionId": "farmer-001",
  "isFollowUp": false,
  "conversationTurns": 1,
  "latency": 3245,
  "toolsUsed": [],
  "videos": [],
  "webLinks": []
}
```

**Use Cases:**

1. **General Farming Question:**
```json
{
  "question": "धान की फसल में खाद कितनी डालें?",
  "sessionId": "farmer-001"
}
```

2. **Video Request:**
```json
{
  "question": "टमाटर की खेती का वीडियो दिखाओ",
  "sessionId": "farmer-001"
}
```
Response includes `videos` array with YouTube links.

3. **Government Scheme Query:**
```json
{
  "question": "PM-KISAN की अगली किस्त कब आएगी?",
  "sessionId": "farmer-001"
}
```
Response includes `webLinks` array with government portals.

4. **Follow-up Question:**
```json
{
  "question": "और सिंचाई कब करें?",
  "sessionId": "farmer-001"
}
```
System remembers previous context (wheat farming).

**Tool Triggers:**

| Tool | Keywords | Response Includes |
|------|----------|-------------------|
| YouTube | वीडियो, tutorial, कैसे, दिखाओ, सीखना | `videos` array |
| Web Search | कीमत, मंडी, योजना, आज, latest, scheme | `webLinks` array |
| RAG Only | General farming questions | `answer` only |



---

### 4.2 POST /synthesize

**Purpose:** Convert Hindi text to natural-sounding speech audio.

**Endpoint:**
```
POST /synthesize
```

**Request Body:**
```json
{
  "text": "string (required) - Hindi text to convert to speech",
  "sessionId": "string (required) - Unique session identifier"
}
```

**Response:**
```json
{
  "audioBase64": "string - Base64-encoded MP3 audio",
  "sessionId": "string - Session identifier"
}
```

**Example Request:**
```bash
curl -X POST https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "नमस्ते किसान भाई, गेहूं की बुवाई नवंबर में करें।",
    "sessionId": "farmer-001"
  }'
```

**Example Response:**
```json
{
  "audioBase64": "//uQxAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAADhAC...",
  "sessionId": "farmer-001"
}
```

**Audio Specifications:**
- Format: MP3
- Voice: Kajal (Neural)
- Language: Hindi (hi-IN)
- Sample Rate: 24000 Hz
- Bitrate: 48 kbps
- Encoding: Base64

**Playing Audio:**

**JavaScript (Browser):**
```javascript
const response = await fetch('https://api.../synthesize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'नमस्ते किसान भाई',
    sessionId: 'farmer-001'
  })
});

const data = await response.json();
const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
audio.play();
```

**React Native:**
```javascript
import { Audio } from 'expo-av';

const playAudio = async (audioBase64) => {
  const sound = new Audio.Sound();
  await sound.loadAsync({
    uri: `data:audio/mp3;base64,${audioBase64}`
  });
  await sound.playAsync();
};
```

**Use Cases:**

1. **Read Answer Aloud:**
```json
{
  "text": "गेहूं की बुवाई नवंबर में करें। मिट्टी का तापमान 20-25 डिग्री होना चाहिए।",
  "sessionId": "farmer-001"
}
```

2. **Greeting Message:**
```json
{
  "text": "नमस्ते! मैं आपकी खेती में मदद करने के लिए यहाँ हूँ।",
  "sessionId": "farmer-001"
}
```

3. **Instructions:**
```json
{
  "text": "पहले मिट्टी की जांच करें। फिर खाद डालें। अंत में बीज बोएं।",
  "sessionId": "farmer-001"
}
```

**Limitations:**
- Max text length: 3000 characters
- Processing time: 1-2 seconds
- Audio size: ~50KB per 100 characters

---

### 4.3 POST /transcribe

**Purpose:** Convert speech audio to Hindi text.

**Endpoint:**
```
POST /transcribe
```

**Request Body:**
```json
{
  "audioBase64": "string (required) - Base64-encoded audio file",
  "sessionId": "string (required) - Unique session identifier"
}
```

**Response:**
```json
{
  "transcript": "string - Transcribed Hindi text",
  "sessionId": "string - Session identifier",
  "confidence": "number - Confidence score (0-1)"
}
```

**Example Request:**
```bash
curl -X POST https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "audioBase64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
    "sessionId": "farmer-001"
  }'
```

**Example Response:**
```json
{
  "transcript": "गेहूं की बुवाई कब करें",
  "sessionId": "farmer-001",
  "confidence": 0.95
}
```

**Audio Requirements:**
- Format: WAV, MP3, FLAC, or OGG
- Sample Rate: 8000-48000 Hz
- Channels: Mono or Stereo
- Duration: 1-60 seconds
- Max Size: 10 MB
- Language: Hindi (hi-IN)

**Recording Audio:**

**JavaScript (Browser):**
```javascript
const recordAudio = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks = [];

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  
  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'audio/wav' });
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      
      const response = await fetch('https://api.../transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          sessionId: 'farmer-001'
        })
      });
      
      const data = await response.json();
      console.log('Transcript:', data.transcript);
    };
    
    reader.readAsDataURL(blob);
  };

  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), 5000); // Record for 5 seconds
};
```

**React Native:**
```javascript
import Voice from '@react-native-voice/voice';

Voice.onSpeechResults = async (e) => {
  const audioBase64 = e.value[0]; // Get recorded audio
  
  const response = await fetch('https://api.../transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64: audioBase64,
      sessionId: 'farmer-001'
    })
  });
  
  const data = await response.json();
  console.log('Transcript:', data.transcript);
};

await Voice.start('hi-IN');
```

**Use Cases:**

1. **Voice Question:**
   - User speaks: "गेहूं की बुवाई कब करें?"
   - API returns: `{"transcript": "गेहूं की बुवाई कब करें", "confidence": 0.95}`

2. **Voice Command:**
   - User speaks: "वीडियो दिखाओ"
   - API returns: `{"transcript": "वीडियो दिखाओ", "confidence": 0.92}`

**Confidence Scores:**
- 0.9-1.0: Excellent (use directly)
- 0.7-0.9: Good (use with confirmation)
- 0.5-0.7: Fair (ask user to repeat)
- 0.0-0.5: Poor (request re-recording)

---

### 4.4 POST /voice-query

**Purpose:** Complete voice pipeline - converts speech to text, processes question, generates answer, and converts answer to speech.

**Endpoint:**
```
POST /voice-query
```

**Request Body:**
```json
{
  "audioBase64": "string (required) - Base64-encoded audio file",
  "sessionId": "string (required) - Unique session identifier"
}
```

**Response:**
```json
{
  "transcript": "string - Transcribed question",
  "answer": "string - Hindi text answer",
  "audioBase64": "string - Base64-encoded answer audio",
  "source": "string - Data source",
  "sessionId": "string - Session identifier",
  "latency": {
    "transcribe": "number - Transcription time (ms)",
    "query": "number - Query processing time (ms)",
    "synthesize": "number - TTS time (ms)",
    "total": "number - Total time (ms)"
  },
  "toolsUsed": ["string"] - Tools triggered,
  "videos": [...] - Video recommendations (if any),
  "webLinks": [...] - Web links (if any)
}
```

**Example Request:**
```bash
curl -X POST https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev/voice-query \
  -H "Content-Type: application/json" \
  -d '{
    "audioBase64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
    "sessionId": "farmer-001"
  }'
```

**Example Response:**
```json
{
  "transcript": "गेहूं की बुवाई कब करें",
  "answer": "गेहूं की बुवाई नवंबर के पहले हफ्ते में करें। मिट्टी का तापमान 20-25 डिग्री होना चाहिए।",
  "audioBase64": "//uQxAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAADhAC...",
  "source": "RAG",
  "sessionId": "farmer-001",
  "latency": {
    "transcribe": 2145,
    "query": 3456,
    "synthesize": 1678,
    "total": 7279
  },
  "toolsUsed": [],
  "videos": [],
  "webLinks": []
}
```

**Complete Voice Flow:**

```
User Speaks → /voice-query → Returns:
1. transcript (what user said)
2. answer (AI response text)
3. audioBase64 (spoken answer)
4. videos/links (if applicable)
```

**Implementation Example:**

```javascript
const handleVoiceQuery = async (audioBlob) => {
  // Convert audio to base64
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  
  reader.onloadend = async () => {
    const base64Audio = reader.result.split(',')[1];
    
    // Call voice-query endpoint
    const response = await fetch('https://api.../voice-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: base64Audio,
        sessionId: 'farmer-001'
      })
    });
    
    const data = await response.json();
    
    // Display transcript
    console.log('You said:', data.transcript);
    
    // Display answer
    console.log('Answer:', data.answer);
    
    // Play audio response
    const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
    await audio.play();
    
    // Show videos if available
    if (data.videos.length > 0) {
      console.log('Videos:', data.videos);
    }
    
    // Show web links if available
    if (data.webLinks.length > 0) {
      console.log('Links:', data.webLinks);
    }
  };
};
```

**Use Cases:**

1. **Hands-Free Farming Advice:**
   - Farmer speaks question while working
   - Gets spoken answer without looking at screen

2. **Low-Literacy Users:**
   - Users who can't read/write
   - Complete voice interaction

3. **Driving/Working:**
   - Farmers on tractors or in fields
   - Voice-only interaction

**Performance:**
- Average latency: 7-15 seconds
- Transcribe: ~2 seconds
- Query: ~3-5 seconds
- Synthesize: ~1-2 seconds



---

### 4.5 POST /history

**Purpose:** Retrieve conversation history for a session.

**Endpoint:**
```
POST /history
```

**Request Body:**
```json
{
  "sessionId": "string (required) - Session identifier",
  "limit": "number (optional) - Max records to return (default: 10)"
}
```

**Response:**
```json
{
  "sessionId": "string - Session identifier",
  "history": [
    {
      "question": "string - User question",
      "answer": "string - AI answer",
      "timestamp": "number - Unix timestamp",
      "source": "string - Data source",
      "latency": "number - Response time (ms)",
      "toolsUsed": ["string"] - Tools used
    }
  ],
  "count": "number - Number of records returned"
}
```

**Example Request:**
```bash
curl -X POST https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev/history \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "farmer-001",
    "limit": 5
  }'
```

**Example Response:**
```json
{
  "sessionId": "farmer-001",
  "history": [
    {
      "question": "गेहूं की बुवाई कब करें?",
      "answer": "गेहूं की बुवाई नवंबर के पहले हफ्ते में करें...",
      "timestamp": 1709539200000,
      "source": "RAG",
      "latency": 3245,
      "toolsUsed": []
    },
    {
      "question": "और खाद कितनी डालें?",
      "answer": "गेहूं के लिए 120 किलो यूरिया प्रति हेक्टेयर...",
      "timestamp": 1709539260000,
      "source": "RAG",
      "latency": 2890,
      "toolsUsed": []
    }
  ],
  "count": 2
}
```

**Use Cases:**

1. **Show Conversation History:**
```javascript
const loadHistory = async (sessionId) => {
  const response = await fetch('https://api.../history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, limit: 10 })
  });
  
  const data = await response.json();
  
  data.history.forEach(item => {
    console.log(`Q: ${item.question}`);
    console.log(`A: ${item.answer}`);
    console.log(`Time: ${new Date(item.timestamp).toLocaleString()}`);
    console.log('---');
  });
};
```

2. **Resume Conversation:**
```javascript
// Load last conversation
const { history } = await getHistory('farmer-001');

// Show last question/answer
if (history.length > 0) {
  const last = history[0];
  console.log('Last conversation:');
  console.log(`You asked: ${last.question}`);
  console.log(`Answer: ${last.answer}`);
}
```

3. **Analytics:**
```javascript
// Analyze conversation patterns
const { history } = await getHistory('farmer-001');

const avgLatency = history.reduce((sum, h) => sum + h.latency, 0) / history.length;
const toolUsage = history.flatMap(h => h.toolsUsed);

console.log(`Average response time: ${avgLatency}ms`);
console.log(`Tools used: ${toolUsage.join(', ')}`);
```

**Data Retention:**
- History stored for 7 days
- Automatic deletion after TTL expires
- No PII stored

---

## 5. Response Formats

### 5.1 Success Response

All successful responses follow this structure:

```json
{
  "statusCode": 200,
  "body": {
    // Endpoint-specific data
  }
}
```

### 5.2 Error Response

All error responses follow this structure:

```json
{
  "statusCode": 400 | 500,
  "error": "string - Error type",
  "message": "string - Human-readable error message",
  "details": "string (optional) - Additional error details"
}
```

### 5.3 Tool Response Objects

**YouTube Video Object:**
```json
{
  "title": "टमाटर की खेती - संपूर्ण गाइड",
  "description": "Learn complete tomato farming techniques",
  "channel": "Krishi Gyan",
  "url": "https://www.youtube.com/results?search_query=टमाटर+की+खेती",
  "thumbnail": "https://i.ytimg.com/vi/default.jpg",
  "videoId": "search"
}
```

**Web Link Object:**
```json
{
  "title": "PM-KISAN Official Portal",
  "url": "https://pmkisan.gov.in",
  "description": "Check payment status and register for PM-KISAN scheme"
}
```

---

## 6. Error Handling

### 6.1 HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required (future) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Temporary service outage |

### 6.2 Common Errors

**Missing Required Field:**
```json
{
  "statusCode": 400,
  "error": "ValidationError",
  "message": "Missing required field: question"
}
```

**Invalid Audio Format:**
```json
{
  "statusCode": 400,
  "error": "InvalidAudioFormat",
  "message": "Audio must be base64-encoded WAV, MP3, or FLAC"
}
```

**Transcription Failed:**
```json
{
  "statusCode": 500,
  "error": "TranscriptionError",
  "message": "Could not transcribe audio. Please try again."
}
```

**AI Model Error:**
```json
{
  "statusCode": 500,
  "error": "ModelError",
  "message": "AI model temporarily unavailable"
}
```

### 6.3 Error Handling Best Practices

**JavaScript Example:**
```javascript
const queryAPI = async (question, sessionId) => {
  try {
    const response = await fetch('https://api.../query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, sessionId })
    });

    if (!response.ok) {
      const error = await response.json();
      
      switch (error.statusCode) {
        case 400:
          console.error('Invalid request:', error.message);
          break;
        case 429:
          console.error('Rate limit exceeded. Please wait.');
          break;
        case 500:
          console.error('Server error. Retrying...');
          // Implement retry logic
          break;
        default:
          console.error('Unknown error:', error.message);
      }
      
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};
```

**Retry Logic:**
```javascript
const queryWithRetry = async (question, sessionId, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await queryAPI(question, sessionId);
      if (response) return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

---

## 7. Rate Limits

### Current Limits (Hackathon Mode)

- **Requests per second:** 10,000
- **Burst capacity:** 5,000
- **No per-user limits**

### Production Recommendations

| Tier | Requests/min | Requests/day |
|------|--------------|--------------|
| Free | 60 | 1,000 |
| Basic | 300 | 10,000 |
| Pro | 1,000 | 100,000 |

### Rate Limit Headers (Future)

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1709539200
```

### Handling Rate Limits

```javascript
const checkRateLimit = (response) => {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (remaining < 10) {
    console.warn(`Only ${remaining} requests remaining`);
    console.warn(`Resets at ${new Date(reset * 1000).toLocaleString()}`);
  }
};
```

---

## 8. Code Examples

### 8.1 JavaScript/Node.js

**Complete Integration:**
```javascript
class FarmerVoiceAI {
  constructor(baseURL, sessionId) {
    this.baseURL = baseURL;
    this.sessionId = sessionId;
  }

  async query(question) {
    const response = await fetch(`${this.baseURL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        sessionId: this.sessionId
      })
    });
    return await response.json();
  }

  async synthesize(text) {
    const response = await fetch(`${this.baseURL}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sessionId: this.sessionId
      })
    });
    return await response.json();
  }

  async transcribe(audioBase64) {
    const response = await fetch(`${this.baseURL}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        sessionId: this.sessionId
      })
    });
    return await response.json();
  }

  async voiceQuery(audioBase64) {
    const response = await fetch(`${this.baseURL}/voice-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        sessionId: this.sessionId
      })
    });
    return await response.json();
  }

  async getHistory(limit = 10) {
    const response = await fetch(`${this.baseURL}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        limit
      })
    });
    return await response.json();
  }
}

// Usage
const api = new FarmerVoiceAI(
  'https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev',
  'farmer-001'
);

// Ask a question
const result = await api.query('गेहूं की बुवाई कब करें?');
console.log(result.answer);

// Get history
const history = await api.getHistory(5);
console.log(history);
```



### 8.2 Python

**Complete Integration:**
```python
import requests
import base64
import json

class FarmerVoiceAI:
    def __init__(self, base_url, session_id):
        self.base_url = base_url
        self.session_id = session_id
        self.headers = {'Content-Type': 'application/json'}
    
    def query(self, question):
        """Ask a farming question"""
        response = requests.post(
            f'{self.base_url}/query',
            headers=self.headers,
            json={
                'question': question,
                'sessionId': self.session_id
            }
        )
        return response.json()
    
    def synthesize(self, text):
        """Convert text to speech"""
        response = requests.post(
            f'{self.base_url}/synthesize',
            headers=self.headers,
            json={
                'text': text,
                'sessionId': self.session_id
            }
        )
        return response.json()
    
    def transcribe(self, audio_file_path):
        """Convert speech to text"""
        with open(audio_file_path, 'rb') as f:
            audio_base64 = base64.b64encode(f.read()).decode('utf-8')
        
        response = requests.post(
            f'{self.base_url}/transcribe',
            headers=self.headers,
            json={
                'audioBase64': audio_base64,
                'sessionId': self.session_id
            }
        )
        return response.json()
    
    def voice_query(self, audio_file_path):
        """Complete voice pipeline"""
        with open(audio_file_path, 'rb') as f:
            audio_base64 = base64.b64encode(f.read()).decode('utf-8')
        
        response = requests.post(
            f'{self.base_url}/voice-query',
            headers=self.headers,
            json={
                'audioBase64': audio_base64,
                'sessionId': self.session_id
            }
        )
        return response.json()
    
    def get_history(self, limit=10):
        """Get conversation history"""
        response = requests.post(
            f'{self.base_url}/history',
            headers=self.headers,
            json={
                'sessionId': self.session_id,
                'limit': limit
            }
        )
        return response.json()
    
    def save_audio(self, audio_base64, output_path):
        """Save base64 audio to file"""
        audio_bytes = base64.b64decode(audio_base64)
        with open(output_path, 'wb') as f:
            f.write(audio_bytes)

# Usage
api = FarmerVoiceAI(
    'https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev',
    'farmer-001'
)

# Ask a question
result = api.query('गेहूं की बुवाई कब करें?')
print(f"Answer: {result['answer']}")

# Convert answer to speech
audio = api.synthesize(result['answer'])
api.save_audio(audio['audioBase64'], 'answer.mp3')

# Get history
history = api.get_history(5)
for item in history['history']:
    print(f"Q: {item['question']}")
    print(f"A: {item['answer']}")
    print('---')
```

### 8.3 React Native

**Complete Mobile Integration:**
```javascript
import React, { useState } from 'react';
import { View, Button, Text, ScrollView } from 'react-native';
import Voice from '@react-native-voice/voice';
import { Audio } from 'expo-av';

const API_BASE_URL = 'https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev';

const FarmerVoiceApp = () => {
  const [sessionId] = useState(`farmer-${Date.now()}`);
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [videos, setVideos] = useState([]);
  const [webLinks, setWebLinks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  // Text query
  const askQuestion = async (question) => {
    try {
      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sessionId })
      });

      const data = await response.json();
      setAnswer(data.answer);
      setVideos(data.videos || []);
      setWebLinks(data.webLinks || []);

      // Play audio response
      if (data.answer) {
        await speakAnswer(data.answer);
      }
    } catch (error) {
      console.error('Query error:', error);
    }
  };

  // Text-to-speech
  const speakAnswer = async (text) => {
    try {
      const response = await fetch(`${API_BASE_URL}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sessionId })
      });

      const data = await response.json();
      
      // Play audio
      const sound = new Audio.Sound();
      await sound.loadAsync({
        uri: `data:audio/mp3;base64,${data.audioBase64}`
      });
      await sound.playAsync();
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      setIsRecording(true);
      await Voice.start('hi-IN');
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  };

  // Voice recognition result
  Voice.onSpeechResults = async (e) => {
    const spokenText = e.value[0];
    setTranscript(spokenText);
    await askQuestion(spokenText);
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        🌾 Farmer Voice AI
      </Text>

      {/* Voice Button */}
      <Button
        title={isRecording ? '🔴 Recording...' : '🎤 Speak'}
        onPress={isRecording ? stopRecording : startRecording}
      />

      {/* Transcript */}
      {transcript && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>You said:</Text>
          <Text>{transcript}</Text>
        </View>
      )}

      {/* Answer */}
      {answer && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Answer:</Text>
          <Text>{answer}</Text>
        </View>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>📹 Videos:</Text>
          {videos.map((video, index) => (
            <View key={index} style={{ marginTop: 10 }}>
              <Text>{video.title}</Text>
              <Text style={{ color: 'blue' }}>{video.url}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Web Links */}
      {webLinks.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>🌐 Links:</Text>
          {webLinks.map((link, index) => (
            <View key={index} style={{ marginTop: 10 }}>
              <Text>{link.title}</Text>
              <Text style={{ color: 'blue' }}>{link.url}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default FarmerVoiceApp;
```

### 8.4 cURL Examples

**Query Endpoint:**
```bash
curl -X POST https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "गेहूं की बुवाई कब करें?",
    "sessionId": "test-123"
  }'
```

**Synthesize Endpoint:**
```bash
curl -X POST https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "नमस्ते किसान भाई",
    "sessionId": "test-123"
  }' | jq -r '.audioBase64' | base64 -d > output.mp3
```

**History Endpoint:**
```bash
curl -X POST https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev/history \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "limit": 5
  }' | jq '.'
```

---

## 9. Testing

### 9.1 Test Queries

**General Farming Questions:**
```json
{"question": "गेहूं की बुवाई कब करें?", "sessionId": "test-1"}
{"question": "धान की फसल में खाद कितनी डालें?", "sessionId": "test-1"}
{"question": "टमाटर में कीड़े लगे हैं क्या करें?", "sessionId": "test-1"}
```

**Video Requests:**
```json
{"question": "टमाटर की खेती का वीडियो दिखाओ", "sessionId": "test-2"}
{"question": "ड्रिप सिंचाई कैसे करें वीडियो", "sessionId": "test-2"}
{"question": "जैविक खेती सीखना है", "sessionId": "test-2"}
```

**Government Scheme Queries:**
```json
{"question": "PM-KISAN की अगली किस्त कब आएगी?", "sessionId": "test-3"}
{"question": "सोलर पंप पर सब्सिडी कैसे मिलेगी?", "sessionId": "test-3"}
{"question": "आज मंडी में गेहूं की कीमत?", "sessionId": "test-3"}
```

**Follow-up Questions:**
```json
{"question": "गेहूं की बुवाई कब करें?", "sessionId": "test-4"}
{"question": "और खाद कितनी डालें?", "sessionId": "test-4"}
{"question": "सिंचाई कब करें?", "sessionId": "test-4"}
```

### 9.2 Test Script

**Node.js Test Script:**
```javascript
const testAPI = async () => {
  const baseURL = 'https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev';
  const sessionId = `test-${Date.now()}`;

  const tests = [
    {
      name: 'General Question',
      question: 'गेहूं की बुवाई कब करें?',
      expectedTools: []
    },
    {
      name: 'Video Request',
      question: 'टमाटर की खेती का वीडियो दिखाओ',
      expectedTools: ['YouTube']
    },
    {
      name: 'Scheme Query',
      question: 'PM-KISAN की अगली किस्त कब आएगी?',
      expectedTools: ['Web Search']
    }
  ];

  for (const test of tests) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`Question: ${test.question}`);

    const response = await fetch(`${baseURL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: test.question,
        sessionId
      })
    });

    const data = await response.json();

    console.log(`✓ Answer: ${data.answer.substring(0, 100)}...`);
    console.log(`✓ Tools Used: ${data.toolsUsed.join(', ') || 'None'}`);
    console.log(`✓ Latency: ${data.latency}ms`);
    console.log(`✓ Videos: ${data.videos?.length || 0}`);
    console.log(`✓ Links: ${data.webLinks?.length || 0}`);

    // Verify expected tools
    const toolsMatch = test.expectedTools.every(tool => 
      data.toolsUsed.includes(tool)
    );
    console.log(toolsMatch ? '✅ PASS' : '❌ FAIL');
  }
};

testAPI();
```

### 9.3 Performance Testing

**Load Test Script:**
```javascript
const loadTest = async (concurrency = 10, requests = 100) => {
  const baseURL = 'https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev';
  const questions = [
    'गेहूं की बुवाई कब करें?',
    'धान की फसल में खाद कितनी डालें?',
    'टमाटर में कीड़े लगे हैं क्या करें?'
  ];

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    latencies: []
  };

  const makeRequest = async () => {
    const question = questions[Math.floor(Math.random() * questions.length)];
    const start = Date.now();

    try {
      const response = await fetch(`${baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          sessionId: `load-test-${Date.now()}`
        })
      });

      if (response.ok) {
        results.success++;
        results.latencies.push(Date.now() - start);
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
    }

    results.total++;
  };

  // Run concurrent requests
  const batches = Math.ceil(requests / concurrency);
  for (let i = 0; i < batches; i++) {
    const batch = Array(Math.min(concurrency, requests - i * concurrency))
      .fill()
      .map(() => makeRequest());
    await Promise.all(batch);
  }

  // Calculate statistics
  const avgLatency = results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length;
  const p95Latency = results.latencies.sort((a, b) => a - b)[Math.floor(results.latencies.length * 0.95)];

  console.log('\n📊 Load Test Results:');
  console.log(`Total Requests: ${results.total}`);
  console.log(`Successful: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${(results.success / results.total * 100).toFixed(2)}%`);
  console.log(`Average Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`P95 Latency: ${p95Latency}ms`);
};

loadTest(10, 100);
```

---

## 10. Best Practices

### 10.1 Session Management

**Generate Unique Session IDs:**
```javascript
const generateSessionId = () => {
  return `farmer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
```

**Persist Session ID:**
```javascript
// Store in localStorage (web)
localStorage.setItem('sessionId', sessionId);

// Store in AsyncStorage (React Native)
await AsyncStorage.setItem('sessionId', sessionId);
```

**Reuse Session ID:**
```javascript
// Retrieve existing session
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
  sessionId = generateSessionId();
  localStorage.setItem('sessionId', sessionId);
}
```

### 10.2 Error Handling

**Implement Retry Logic:**
```javascript
const retryRequest = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};
```

**Handle Network Errors:**
```javascript
const safeQuery = async (question, sessionId) => {
  try {
    return await queryAPI(question, sessionId);
  } catch (error) {
    if (error.message.includes('network')) {
      return { error: 'No internet connection' };
    }
    return { error: 'Something went wrong' };
  }
};
```

### 10.3 Performance Optimization

**Cache Responses:**
```javascript
const cache = new Map();

const cachedQuery = async (question, sessionId) => {
  const cacheKey = `${question}-${sessionId}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const result = await queryAPI(question, sessionId);
  cache.set(cacheKey, result);
  
  return result;
};
```

**Debounce Requests:**
```javascript
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const debouncedQuery = debounce(queryAPI, 500);
```

### 10.4 User Experience

**Show Loading States:**
```javascript
const [isLoading, setIsLoading] = useState(false);

const askQuestion = async (question) => {
  setIsLoading(true);
  try {
    const result = await queryAPI(question, sessionId);
    setAnswer(result.answer);
  } finally {
    setIsLoading(false);
  }
};
```

**Progressive Response Display:**
```javascript
// Show transcript immediately
setTranscript(data.transcript);

// Show answer when ready
setAnswer(data.answer);

// Play audio asynchronously
playAudio(data.audioBase64);

// Load videos/links in background
setVideos(data.videos);
setWebLinks(data.webLinks);
```

### 10.5 Security

**Validate Input:**
```javascript
const validateQuestion = (question) => {
  if (!question || question.trim().length === 0) {
    throw new Error('Question cannot be empty');
  }
  if (question.length > 500) {
    throw new Error('Question too long (max 500 characters)');
  }
  return question.trim();
};
```

**Sanitize Output:**
```javascript
const sanitizeHTML = (text) => {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};
```

---

## 11. Troubleshooting

### Common Issues

**Issue: "CORS error"**
- Solution: Ensure `Content-Type: application/json` header is set
- Check that request method is POST

**Issue: "Audio not playing"**
- Solution: Verify base64 audio is properly decoded
- Check audio format is MP3
- Ensure audio player supports data URIs

**Issue: "Transcription failed"**
- Solution: Check audio format (WAV, MP3, FLAC)
- Verify audio is not corrupted
- Ensure audio duration is 1-60 seconds

**Issue: "Slow response times"**
- Solution: Check network connection
- Verify API region (use closest region)
- Consider caching frequent queries

---

## 12. Support

### Documentation
- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
- [USER_GUIDE.md](USER_GUIDE.md) - End-user guide
- [SPEC.md](SPEC.md) - Technical specifications

### Contact
- Email: support@farmervoiceai.com
- GitHub Issues: [repository-url]/issues

---

**API Version:** 1.0  
**Last Updated:** March 4, 2026  
**Status:** Production Ready
