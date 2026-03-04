# Farmer Voice AI - Requirements Document

**Project:** Farmer Voice AI Backend System  
**Version:** 1.0  
**Date:** March 4, 2026  
**Status:** Production Ready

---

## 1. Project Overview

### 1.1 Purpose
Build a voice-enabled AI assistant for Indian farmers that provides farming advice, video tutorials, and government scheme information in Hindi through natural conversation.

### 1.2 Target Users
- Indian farmers (primary)
- Agricultural workers
- Rural communities
- Hindi-speaking users

### 1.3 Key Goals
- Provide instant farming advice in Hindi
- Enable voice-based interaction (hands-free)
- Recommend relevant video tutorials
- Share government scheme information
- Maintain conversation context
- Deliver natural, human-like responses

---

## 2. Functional Requirements

### 2.1 Voice Interaction
**FR-1.1:** System shall accept voice input in Hindi  
**FR-1.2:** System shall convert speech to text using AWS Transcribe  
**FR-1.3:** System shall convert text responses to speech using AWS Polly (Kajal voice)  
**FR-1.4:** System shall support complete voice pipeline (STT → AI → TTS)

### 2.2 AI Query Processing
**FR-2.1:** System shall answer farming questions in natural Hindi  
**FR-2.2:** System shall use Meta Llama 3 8B model for responses  
**FR-2.3:** System shall provide conversational, human-like answers  
**FR-2.4:** System shall avoid formal/technical language  
**FR-2.5:** System shall keep responses concise (1-3 paragraphs)

### 2.3 Automatic Tool Selection
**FR-3.1:** System shall automatically detect when YouTube videos are needed  
**FR-3.2:** System shall automatically detect when web search is needed  
**FR-3.3:** System shall use RAG for general farming questions  
**FR-3.4:** System shall not require manual tool routing

**YouTube Triggers:**
- Keywords: वीडियो, tutorial, कैसे, दिखाओ, सीखना, learn

**Web Search Triggers:**
- Keywords: कीमत, मंडी, योजना, आज, latest, scheme, subsidy

### 2.4 YouTube Integration
**FR-4.1:** System shall return YouTube search links for video queries  
**FR-4.2:** System shall provide video title, channel, and URL  
**FR-4.3:** System shall return up to 3 video recommendations  
**FR-4.4:** System shall support YouTube API (optional) for direct video links

### 2.5 Web Search Integration
**FR-5.1:** System shall provide government portal links for schemes/prices  
**FR-5.2:** System shall include PM-KISAN, eNAM, Kisan Call Centre links  
**FR-5.3:** System shall mark responses as "live" when using web data

### 2.6 Conversation History
**FR-6.1:** System shall track conversation history per session  
**FR-6.2:** System shall remember last 3 conversation turns  
**FR-6.3:** System shall detect follow-up questions  
**FR-6.4:** System shall maintain context across turns  
**FR-6.5:** System shall store history in DynamoDB with 7-day TTL

### 2.7 Response Quality
**FR-7.1:** System shall return only Hindi text (no English explanations)  
**FR-7.2:** System shall remove code artifacts and print statements  
**FR-7.3:** System shall filter out translation sections  
**FR-7.4:** System shall provide clean, professional responses

---

## 3. Non-Functional Requirements

### 3.1 Performance
**NFR-1.1:** Text query response time: 2-5 seconds  
**NFR-1.2:** Voice query response time: 7-15 seconds  
**NFR-1.3:** TTS conversion time: 1-2 seconds  
**NFR-1.4:** History retrieval time: <1 second

### 3.2 Scalability
**NFR-2.1:** System shall handle concurrent requests via AWS Lambda  
**NFR-2.2:** System shall auto-scale based on demand  
**NFR-2.3:** System shall support 1000+ requests per day

### 3.3 Availability
**NFR-3.1:** System shall maintain 99.9% uptime  
**NFR-3.2:** System shall be deployed in us-east-1 region  
**NFR-3.3:** System shall have automatic failover

### 3.4 Cost Efficiency
**NFR-4.1:** Cost per query: ~$0.0005  
**NFR-4.2:** Use free-tier eligible services where possible  
**NFR-4.3:** Optimize token usage (600 tokens max per response)

### 3.5 Security
**NFR-5.1:** All endpoints shall have CORS enabled  
**NFR-5.2:** Session IDs shall be unique per user  
**NFR-5.3:** No PII shall be stored permanently  
**NFR-5.4:** Conversation history shall expire after 7 days

---

## 4. API Requirements

### 4.1 Endpoints
**API-1:** POST /query - Text AI queries  
**API-2:** POST /synthesize - Text-to-speech  
**API-3:** POST /transcribe - Speech-to-text  
**API-4:** POST /voice-query - Complete voice pipeline  
**API-5:** POST /history - Conversation history  
**API-6:** POST /agent-query - Bedrock Agent (optional)

### 4.2 Response Format
All responses shall include:
- `answer`: Hindi text response
- `source`: Data source identifier
- `sessionId`: Session identifier
- `latency`: Response time in ms
- `toolsUsed`: Array of tools triggered
- `videos`: Array of video objects (if applicable)
- `webLinks`: Array of link objects (if applicable)

---

## 5. Data Requirements

### 5.1 Knowledge Base
**DR-1.1:** System shall use ICAR farming knowledge  
**DR-1.2:** System shall support RAG with vector search  
**DR-1.3:** System shall use hybrid search (semantic + keyword)  
**DR-1.4:** System shall retrieve top 5 relevant documents

### 5.2 Conversation Storage
**DR-2.1:** Store in DynamoDB with sessionId as key  
**DR-2.2:** Include question, answer, timestamp, metadata  
**DR-2.3:** Set TTL to 7 days  
**DR-2.4:** Support query by sessionId with limit

---

## 6. Integration Requirements

### 6.1 AWS Services
**INT-1.1:** AWS Lambda for serverless compute  
**INT-1.2:** AWS Bedrock for AI models  
**INT-1.3:** AWS Polly for text-to-speech  
**INT-1.4:** AWS Transcribe for speech-to-text  
**INT-1.5:** AWS DynamoDB for conversation storage  
**INT-1.6:** AWS S3 for document storage  
**INT-1.7:** AWS API Gateway for REST API

### 6.2 External APIs
**INT-2.1:** YouTube Data API v3 (optional)  
**INT-2.2:** Support for web search APIs (future)

---

## 7. Mobile App Requirements

### 7.1 React Native Integration
**MOB-1.1:** Support voice recording via @react-native-voice/voice  
**MOB-1.2:** Support audio playback via expo-av  
**MOB-1.3:** Display video cards with thumbnails  
**MOB-1.4:** Display web link cards  
**MOB-1.5:** Open YouTube videos in browser/app  
**MOB-1.6:** Open web links in browser

---

## 8. Quality Requirements

### 8.1 Answer Quality
**QR-1.1:** Answers shall be factually accurate  
**QR-1.2:** Answers shall be in conversational Hindi  
**QR-1.3:** Answers shall include practical tips  
**QR-1.4:** Answers shall be 1-3 paragraphs long

### 8.2 User Experience
**QR-2.1:** Responses shall feel natural and human-like  
**QR-2.2:** System shall avoid robotic language  
**QR-2.3:** System shall provide step-by-step guidance when needed  
**QR-2.4:** System shall be easy to use for non-technical users

---

## 9. Constraints

### 9.1 Technical Constraints
- Must use AWS services only
- Must use free-tier eligible models
- Must support Hindi language
- Must work without payment method (for hackathon)

### 9.2 Business Constraints
- Target: Hackathon demo
- Timeline: Immediate deployment
- Budget: Minimal cost (<$1/day)

---

## 10. Success Criteria

### 10.1 Functional Success
✅ All 5 core endpoints working  
✅ Voice pipeline functional  
✅ YouTube tool triggering correctly  
✅ Web search tool triggering correctly  
✅ Clean Hindi responses  
✅ Conversation history working

### 10.2 Performance Success
✅ Response time <5s for text queries  
✅ Response time <15s for voice queries  
✅ 99%+ uptime  
✅ Cost <$0.001 per query

### 10.3 User Success
✅ Farmers can ask questions naturally  
✅ Farmers get helpful video recommendations  
✅ Farmers access government schemes easily  
✅ Farmers understand responses clearly

---

## 11. Future Enhancements

### 11.1 Phase 2 Features
- Real-time mandi price integration
- Weather forecast integration
- Crop disease image recognition
- Multi-language support (regional languages)
- Offline mode support

### 11.2 Phase 3 Features
- SMS-based queries
- WhatsApp integration
- Community forum
- Expert consultation booking

---

**Document Status:** Complete  
**Last Updated:** March 4, 2026  
**Approved By:** Development Team
