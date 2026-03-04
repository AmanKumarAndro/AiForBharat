# Farmer Voice AI - Technical Specification

**Project:** Farmer Voice AI Backend System  
**Version:** 1.0  
**Date:** March 4, 2026  
**Status:** Implemented & Deployed

---

## 1. System Architecture

### 1.1 High-Level Architecture
```
┌─────────────────┐
│  React Native   │
│   Mobile App    │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│  API Gateway    │
│   (us-east-1)   │
└────────┬────────┘
         │
    ┌────┴────┬────────┬──────────┬──────────┐
    ↓         ↓        ↓          ↓          ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Query  │ │Synthe- │ │Trans-  │ │Voice   │ │History │
│Lambda  │ │size    │ │cribe   │ │Query   │ │Lambda  │
└───┬────┘ └────────┘ └────────┘ └────────┘ └────────┘
    │
    ├──→ Bedrock (Llama 3)
    ├──→ Tool Manager
    │    ├──→ YouTube Search
    │    └──→ Web Search
    └──→ DynamoDB (History)
```

### 1.2 Component Overview

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Gateway | AWS API Gateway | REST API endpoints |
| Lambda Functions | Node.js 20.x | Serverless compute |
| AI Model | Meta Llama 3 8B | Text generation |
| TTS | AWS Polly (Kajal) | Text-to-speech |
| STT | AWS Transcribe | Speech-to-text |
| Database | DynamoDB | Conversation history |
| Storage | S3 | Documents & audio |

---

## 2. API Specification

### 2.1 Base URL
```
https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev
```

### 2.2 Endpoints

#### 2.2.1 POST /query
**Purpose:** AI-powered text queries with automatic tool selection

**Request:**
```json
{
  "question": "string (required)",
  "sessionId": "string (required)",
  "useAgent": "boolean (optional, default: false)",
  "includeHistory": "boolean (optional, default: true)"
}
```

**Response:**
```json
{
  "answer": "string",
  "source": "string",
  "isLiveAnswer": "boolean",
  "sessionId": "string",
  "isFollowUp": "boolean",
  "conversationTurns": "number",
  "latency": "number",
  "toolsUsed": ["string"],
  "videos": [
    {
      "title": "string",
      "url": "string",
      "channel": "string",
      "thumbnail": "string",
      "videoId": "string"
    }
  ],
  "webLinks": [
    {
      "title": "string",
      "url": "string",
      "description": "string"
    }
  ]
}
```

#### 2.2.2 POST /synthesize
**Purpose:** Convert Hindi text to speech

**Request:**
```json
{
  "text": "string (required)",
  "sessionId": "string (required)"
}
```

**Response:**
```json
{
  "audioBase64": "string (base64 MP3)",
  "sessionId": "string"
}
```

#### 2.2.3 POST /transcribe
**Purpose:** Convert speech to Hindi text

**Request:**
```json
{
  "audioBase64": "string (required, base64 audio)",
  "sessionId": "string (required)"
}
```

**Response:**
```json
{
  "transcript": "string",
  "sessionId": "string",
  "confidence": "number"
}
```

#### 2.2.4 POST /voice-query
**Purpose:** Complete voice pipeline (STT → AI → TTS)

**Request:**
```json
{
  "audioBase64": "string (required)",
  "sessionId": "string (required)"
}
```

**Response:**
```json
{
  "transcript": "string",
  "answer": "string",
  "audioBase64": "string",
  "source": "string",
  "sessionId": "string",
  "latency": {
    "transcribe": "number",
    "query": "number",
    "synthesize": "number",
    "total": "number"
  }
}
```

#### 2.2.5 POST /history
**Purpose:** Retrieve conversation history

**Request:**
```json
{
  "sessionId": "string (required)",
  "limit": "number (optional, default: 10)"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "history": [
    {
      "question": "string",
      "answer": "string",
      "timestamp": "number",
      "source": "string",
      "latency": "number"
    }
  ],
  "count": "number"
}
```

---

## 3. Tool Manager Specification

### 3.1 Tool Detection Logic

#### YouTube Tool
**Triggers when query contains:**
```javascript
['video', 'वीडियो', 'देखना', 'tutorial', 'ट्यूटोरियल',
 'कैसे', 'how to', 'सीखना', 'learn', 'youtube', 'यूट्यूब',
 'दिखाओ', 'show me', 'guide', 'गाइड']
```

#### Web Search Tool
**Triggers when query contains:**
```javascript
['price', 'कीमत', 'mandi', 'मंडी', 'rate', 'रेट',
 'latest', 'ताज़ा', 'current', 'वर्तमान', 'today', 'आज',
 'scheme', 'योजना', 'subsidy', 'सब्सिडी', 'pm-kisan', 'किस्त',
 'news', 'समाचार', 'update', 'अपडेट']
```

### 3.2 Tool Response Format

#### YouTube Response
```javascript
{
  success: true,
  source: 'YouTube',
  videos: [
    {
      title: 'string',
      description: 'string',
      channel: 'string',
      url: 'string',
      thumbnail: 'string'
    }
  ],
  count: number
}
```

#### Web Search Response
```javascript
{
  success: true,
  source: 'Web Search',
  message: 'string',
  suggestions: [
    {
      title: 'string',
      url: 'string',
      description: 'string'
    }
  ]
}
```

---

## 4. AI Model Configuration

### 4.1 Model Details
- **Model:** meta.llama3-8b-instruct-v1:0
- **Provider:** AWS Bedrock
- **Region:** us-east-1
- **Cost:** Free tier eligible

### 4.2 Generation Parameters
```javascript
{
  prompt: fullPrompt,
  max_gen_len: 600,
  temperature: 0.7,
  top_p: 0.9,
  stop: [
    '\n\nसवाल:', 
    '\n\nकिसान:', 
    'Translation',
    'Example',
    'Script',
    'As a',
    'This script',
    '**'
  ]
}
```

### 4.3 System Prompt
```
तुम एक कृषि सलाहकार हो। सिर्फ हिंदी में जवाब दो।

नियम:
- केवल हिंदी में बोलो
- सरल, छोटे वाक्य
- कोई अंग्रेजी नहीं
- कोई नोट या टिप्पणी नहीं
- सिर्फ जवाब दो

फॉर्मेट:
1. सीधा जवाब (1-2 लाइन)
2. विस्तार से समझाओ
3. जरूरत हो तो स्टेप बताओ
4. एक टिप

बस इतना ही। कुछ और नहीं।
```

---

## 5. Smart Chunking Strategy

### 5.1 Chunker Configuration
```javascript
{
  chunkSize: 500,      // tokens per chunk
  chunkOverlap: 100,   // overlap for context
  minChunkSize: 100    // minimum chunk size
}
```

### 5.2 Chunking Methods
1. **Semantic Chunking** - Splits on paragraph boundaries
2. **Sentence-Aware** - Never breaks mid-sentence
3. **Topic-Based** - Keeps related content together
4. **Hybrid** - Automatically chooses best strategy

### 5.3 RAG Configuration
```javascript
{
  numberOfResults: 5,
  overrideSearchType: 'HYBRID',  // semantic + keyword
  maxTokens: 2000
}
```

---

## 6. Response Cleanup Pipeline

### 6.1 Cleanup Rules
```javascript
// Remove patterns
.replace(/^(जवाब|Answer):?\s*/i, '')
.replace(/\n\n(Note|Translation|Example|Script):.*/gs, '')
.replace(/As a seasoned.*/gs, '')
.replace(/#.*/g, '')
.replace(/print.*/gi, '')
.replace(/\*\*.*?\*\*/g, '')

// Filter lines
- Remove lines starting with #, //, print
- Remove English-only lines
- Keep Hindi lines
- Keep URLs
```

### 6.2 Quality Checks
- Verify Hindi content present
- Remove code artifacts
- Remove markdown headers
- Trim excessive whitespace

---

## 7. Database Schema

### 7.1 DynamoDB Table: Sessions
```javascript
{
  sessionId: 'string (partition key)',
  question: 'string',
  answer: 'string',
  timestamp: 'number',
  ttl: 'number (7 days)',
  source: 'string',
  isLiveAnswer: 'boolean',
  latency: 'number',
  toolsUsed: 'array'
}
```

### 7.2 Indexes
- Primary Key: sessionId
- TTL: 7 days (604800 seconds)

---

## 8. Deployment Configuration

### 8.1 Serverless Framework
```yaml
service: farmer-voice-ai
provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: dev
```

### 8.2 Lambda Configuration
- **Runtime:** Node.js 20.x
- **Memory:** 1024 MB
- **Timeout:** 30-60 seconds
- **Concurrency:** Auto-scaling

### 8.3 Environment Variables
```bash
DYNAMODB_TABLE=farmer-voice-ai-dev-sessions
AGENT_ID=WXNUIKEH7R
AGENT_ALIAS_ID=KSNVLZJ1KA
S3_BUCKET=farmer-voice-ai-dev-us-east-1-documents
YOUTUBE_API_KEY=(optional)
```

---

## 9. Performance Specifications

### 9.1 Latency Targets
| Operation | Target | Actual |
|-----------|--------|--------|
| Text Query | <5s | 2-5s ✅ |
| YouTube Query | <7s | 4-7s ✅ |
| Web Query | <8s | 5-8s ✅ |
| TTS | <2s | 1-2s ✅ |
| History | <1s | <1s ✅ |

### 9.2 Cost Targets
| Service | Cost/Request |
|---------|--------------|
| Lambda | $0.00001 |
| Bedrock | $0.0002 |
| Polly | $0.0001 |
| Transcribe | $0.0002 |
| DynamoDB | $0.000001 |
| **Total** | **$0.0005** |

---

## 10. Security Specifications

### 10.1 API Security
- CORS enabled for all endpoints
- No authentication (hackathon mode)
- Rate limiting via API Gateway

### 10.2 Data Security
- No PII storage
- 7-day TTL on all data
- Encrypted at rest (DynamoDB)
- Encrypted in transit (HTTPS)

---

## 11. Testing Specifications

### 11.1 Test Queries

**General Query:**
```
"गेहूं की बुवाई कब करें?"
Expected: Hindi answer, no tools
```

**YouTube Query:**
```
"टमाटर की खेती का वीडियो दिखाओ"
Expected: Hindi answer + YouTube search link
```

**Web Query:**
```
"आज मंडी में गेहूं की कीमत?"
Expected: Hindi answer + government portal links
```

### 11.2 Success Criteria
✅ Response in Hindi only  
✅ No English explanations  
✅ Tools trigger correctly  
✅ Videos/links populated  
✅ Latency within targets

---

## 12. Monitoring & Logging

### 12.1 CloudWatch Metrics
- Lambda invocations
- Error rates
- Latency (p50, p95, p99)
- DynamoDB read/write units

### 12.2 Logging
- Request/response logging
- Error logging with stack traces
- Tool usage tracking
- Performance metrics

---

**Document Status:** Complete  
**Implementation Status:** Deployed to Production  
**Last Updated:** March 4, 2026
