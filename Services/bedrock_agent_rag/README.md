# 🌾 Farmer Voice AI - Hindi Agricultural Assistant

> Voice-enabled AI assistant for Indian farmers providing farming advice, video tutorials, and government scheme information in Hindi through natural conversation.

[![AWS](https://img.shields.io/badge/AWS-Bedrock-orange)](https://aws.amazon.com/bedrock/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![Serverless](https://img.shields.io/badge/Serverless-Framework-red)](https://www.serverless.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🎯 Overview

Farmer Voice AI is a serverless voice assistant built specifically for Indian farmers who may have limited literacy or prefer voice interaction. The system accepts questions in Hindi (text or voice), provides intelligent answers using AI, and automatically recommends relevant YouTube videos or government resources.

### Key Features

- 🎤 **Voice Input/Output** - Speak questions in Hindi, get spoken answers
- 🤖 **AI-Powered Answers** - Uses Meta Llama 3 8B model via AWS Bedrock
- 📹 **Smart Video Recommendations** - Automatically suggests farming tutorial videos
- 🌐 **Web Search Integration** - Fetches live government scheme information
- 💬 **Context Awareness** - Remembers conversation history for follow-up questions
- ⚡ **Fast Response** - 2-5 seconds for text queries, 7-15 seconds for voice
- 💰 **Cost Efficient** - ~$0.0005 per query using AWS free tier

## 🏗️ Architecture

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

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed explanation.

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- AWS Account with Bedrock access
- Serverless Framework CLI
- AWS CLI configured

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd farmer-voice-ai
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your AWS credentials and settings
```

4. Deploy to AWS:
```bash
npm run deploy
```

5. Note your API Gateway URL from deployment output.

### Testing

Test the API endpoints:
```bash
# Test text query
curl -X POST https://your-api-url/dev/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "गेहूं की बुवाई कब करें?",
    "sessionId": "test-123"
  }'

# Test voice synthesis
curl -X POST https://your-api-url/dev/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "नमस्ते किसान भाई",
    "sessionId": "test-123"
  }'
```

## 📚 Documentation

- [REQUIREMENTS.md](REQUIREMENTS.md) - Functional and non-functional requirements
- [SPEC.md](SPEC.md) - Technical specifications
- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture explanation
- [USER_GUIDE.md](USER_GUIDE.md) - End-user documentation
- [feature.md](feature.md) - Feature overview and user stories

## 🔌 API Endpoints

### Base URL
```
https://mirqpiqsp9.execute-api.us-east-1.amazonaws.com/dev
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/query` | POST | AI-powered text queries with automatic tool selection |
| `/synthesize` | POST | Convert Hindi text to speech |
| `/transcribe` | POST | Convert speech to Hindi text |
| `/voice-query` | POST | Complete voice pipeline (STT → AI → TTS) |
| `/history` | POST | Retrieve conversation history |

See [SPEC.md](SPEC.md) for detailed API documentation.

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Serverless Framework
- **Cloud:** AWS (Lambda, API Gateway, Bedrock, Polly, Transcribe, DynamoDB, S3)
- **AI Model:** Meta Llama 3 8B Instruct

### Frontend (Mobile)
- **Framework:** React Native
- **Voice:** @react-native-voice/voice
- **Audio:** expo-av

## 📊 Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Text Query Response | <5s | 2-5s ✅ |
| Voice Query Response | <15s | 7-15s ✅ |
| TTS Conversion | <2s | 1-2s ✅ |
| History Retrieval | <1s | <1s ✅ |
| Cost per Query | <$0.001 | $0.0005 ✅ |

## 🎯 Use Cases

### 1. General Farming Questions
```
Question: "गेहूं की बुवाई कब करें?"
Response: Hindi answer with farming advice
Tools Used: RAG (Knowledge Base)
```

### 2. Video Tutorial Requests
```
Question: "टमाटर की खेती का वीडियो दिखाओ"
Response: Hindi answer + YouTube search link
Tools Used: RAG + YouTube Tool
```

### 3. Government Scheme Queries
```
Question: "PM-KISAN की अगली किस्त कब आएगी?"
Response: Hindi answer + Government portal links
Tools Used: RAG + Web Search Tool
```

## 🔧 Configuration

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
DYNAMODB_TABLE=farmer-voice-ai-dev-sessions

# Bedrock Configuration
AGENT_ID=WXNUIKEH7R
AGENT_ALIAS_ID=KSNVLZJ1KA

# S3 Configuration
S3_BUCKET=farmer-voice-ai-dev-us-east-1-documents

# Optional
YOUTUBE_API_KEY=your-youtube-api-key
```

### Model Configuration

```javascript
{
  model: "meta.llama3-8b-instruct-v1:0",
  max_gen_len: 600,
  temperature: 0.7,
  top_p: 0.9
}
```

## 🧪 Testing

Run the test suite:
```bash
cd backend
npm test
```

Test individual endpoints:
```bash
# Test query endpoint
npm run test:query

# Test voice pipeline
npm run test:voice

# Test all endpoints
npm run test:all
```

## 📈 Monitoring

### CloudWatch Metrics
- Lambda invocations and errors
- API Gateway requests and latency
- DynamoDB read/write capacity
- Bedrock model invocations

### Logging
All Lambda functions log to CloudWatch with:
- Request/response details
- Error stack traces
- Performance metrics
- Tool usage tracking

## 🔒 Security

- CORS enabled for all endpoints
- HTTPS only (enforced by API Gateway)
- No PII storage (7-day TTL on all data)
- Encrypted at rest (DynamoDB default encryption)
- IAM roles with least privilege access

## 💡 Smart Features

### Automatic Tool Selection
The system automatically decides which tools to use based on the question:

- **YouTube Tool** - Triggers on keywords: वीडियो, tutorial, कैसे, दिखाओ
- **Web Search Tool** - Triggers on keywords: कीमत, मंडी, योजना, आज, latest
- **RAG Only** - For general farming questions

### Context Awareness
- Remembers last 3 conversation turns
- Detects follow-up questions automatically
- Builds context for better answers

### Response Cleanup
- Removes English explanations
- Filters code artifacts
- Keeps only clean Hindi responses
- Removes markdown formatting

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

Built with ❤️ for Indian farmers

## 🙏 Acknowledgments

- ICAR for agricultural knowledge base
- AWS for cloud infrastructure
- Meta for Llama 3 model
- Indian farming community for inspiration

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@farmervoiceai.com
- Documentation: [USER_GUIDE.md](USER_GUIDE.md)

## 🗺️ Roadmap

### Phase 2
- [ ] Real-time mandi price integration
- [ ] Weather forecast integration
- [ ] Crop disease image recognition
- [ ] Multi-language support (regional languages)

### Phase 3
- [ ] SMS-based queries
- [ ] WhatsApp integration
- [ ] Community forum
- [ ] Expert consultation booking

---

**Status:** Production Ready  
**Version:** 1.0  
**Last Updated:** March 4, 2026
