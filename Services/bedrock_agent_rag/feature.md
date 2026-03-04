# Feature: Real-Time Voice AI in Hindi

## Overview

Farmers speak a question in Hindi and receive a spoken answer in under 5 seconds, backed by government-verified agricultural data (ICAR/FSSAI/CIBRC). The system works offline and falls back to live web search for time-sensitive queries like government scheme disbursement dates.

## Problem Statement

140 million+ Indian farmers are functionally illiterate or semi-literate and cannot use text-based apps. Existing agri-advisory tools require reading ability, stable internet, and English or formal Hindi literacy. This feature removes all three barriers.

## Goals

- Enable any farmer to get accurate, sourced farming advice by voice alone
- Respond in under 5 seconds end-to-end (STT → RAG → LLM → TTS)
- Work fully offline for the top 500 most common farming questions
- Surface live government data (PM-KISAN, mandi prices) when online
- Display numbered Hindi text steps alongside audio for semi-literate users

## Non-Goals

- Support for languages other than Hindi in v1
- Native Android/iOS app (PWA or web demo sufficient for hackathon)
- Real-time streaming TTS (batch synthesis acceptable for v1)
- Multi-turn conversation history (single Q&A turn per session in v1)

## User Stories

### US-001 — Voice Question (Online)
**As a** farmer with no reading ability,  
**I want to** speak my farming problem in Hindi into my phone,  
**So that** I get a spoken answer with step-by-step guidance without reading anything.

**Acceptance Criteria:**
- [ ] User taps mic button; recording starts within 200ms
- [ ] Hindi speech is transcribed using Amazon Transcribe (hi-IN)
- [ ] Transcribed text is sent to RAG pipeline backed by ICAR/FSSAI data
- [ ] Claude generates a Hindi answer grounded in retrieved documents
- [ ] Answer is synthesized to audio via Amazon Polly (Kajal neural voice)
- [ ] Total latency from end-of-speech to audio playback ≤ 5 seconds
- [ ] Numbered Hindi steps are displayed on screen alongside audio playback
- [ ] Source citation (e.g., "Source: ICAR Wheat Manual, 2023") shown below answer

---

### US-002 — Offline Mode
**As a** farmer in a low-connectivity village,  
**I want to** ask common farming questions even without internet,  
**So that** I'm not blocked by poor network conditions.

**Acceptance Criteria:**
- [ ] App detects offline state and shows "Offline Mode" indicator
- [ ] SQLite cache with top-500 pre-loaded Q&A pairs is queried locally
- [ ] Fuzzy text match on cached questions returns closest answer
- [ ] Polly audio for cached answers is pre-generated and bundled
- [ ] Offline answers are served in < 1 second
- [ ] Cache is refreshable when connectivity is restored

---

### US-003 — Live Web Fallback
**As a** farmer asking about time-sensitive government schemes,  
**I want** the AI to fetch the latest information from the web,  
**So that** I get accurate dates and amounts for PM-KISAN, subsidies, etc.

**Acceptance Criteria:**
- [ ] Bedrock Agent detects queries about live/current information
- [ ] Web search tool is invoked for scheme-related keywords (PM-KISAN, kist, subsidy)
- [ ] Live result is summarised in Hindi by Claude before Polly synthesis
- [ ] Response is labelled "Live Web Answer" to distinguish from RAG answers
- [ ] Fallback to RAG cache if web search fails or times out (> 3s)

---

### US-004 — Judge Demo Flow
**As a** hackathon judge evaluating the product,  
**I want to** speak a Hindi farming question and experience the full pipeline live,  
**So that** I can assess the technical depth and real-world impact.

**Acceptance Criteria:**
- [ ] Demo UI has a prominent mic button with Hindi label (बोलें)
- [ ] Waveform animation plays during recording to confirm input
- [ ] Processing states are shown: सुन रहे हैं → सोच रहे हैं → जवाब दे रहे हैं
- [ ] Airplane mode demo path works identically from cached data
- [ ] Source panel shows ICAR document title and page reference

## Technical Design

### Architecture

```
Browser / PWA
    │
    ▼
API Gateway (REST)
    │
    ├─► Lambda: STT         → Amazon Transcribe (hi-IN)
    │
    ├─► Lambda: RAG + LLM   → Bedrock Knowledge Base (OpenSearch Serverless)
    │                         → Bedrock Claude 3 Sonnet
    │                         → Bedrock Agent (web search tool)
    │
    └─► Lambda: TTS         → Amazon Polly (Kajal, neural engine)
```

### AWS Services

| Service | Role |
|---|---|
| Amazon Transcribe | Hindi STT (hi-IN, streaming or batch) |
| Amazon Bedrock — Claude 3 Sonnet | Answer generation in Hindi |
| Amazon Bedrock Knowledge Base | RAG over ICAR/FSSAI/CIBRC PDFs |
| Amazon OpenSearch Serverless | Vector index for KB |
| Amazon S3 | PDF storage, pre-generated offline audio |
| Amazon Polly (Kajal neural) | Hindi TTS |
| AWS Lambda | All compute — STT, RAG, TTS orchestration |
| Amazon API Gateway | HTTP entry point |
| Amazon DynamoDB | Session state, query logs |

### Knowledge Base Sources (S3 → Bedrock KB)
- ICAR crop advisory PDFs (wheat, rice, cotton, soybean, maize)
- FSSAI pesticide usage guidelines
- CIBRC registered pesticide database
- State KVK (Krishi Vigyan Kendra) seasonal bulletins

### Offline Cache Schema (SQLite)
```sql
CREATE TABLE qa_cache (
  id INTEGER PRIMARY KEY,
  question_hi TEXT,           -- Hindi question text
  question_embedding BLOB,    -- For fuzzy match
  answer_hi TEXT,             -- Hindi answer text
  answer_audio_path TEXT,     -- Bundled .mp3 path
  source TEXT,                -- ICAR / FSSAI / CIBRC
  category TEXT               -- crop, pest, scheme, weather
);
```

## Implementation Tasks

### Phase 1 — Voice Pipeline (6 hrs)
- [ ] Set up API Gateway + Lambda skeleton
- [ ] Integrate Amazon Transcribe with hi-IN config
- [ ] Integrate Amazon Polly with Kajal neural voice
- [ ] Wire Claude 3 Sonnet with Hindi system prompt
- [ ] End-to-end smoke test: voice in → voice out

### Phase 2 — RAG Engine (4 hrs)
- [ ] Upload ICAR + FSSAI + CIBRC PDFs to S3
- [ ] Create and sync Bedrock Knowledge Base
- [ ] Replace static Claude call with KB-backed retrieval
- [ ] Add source citation extraction from KB response

### Phase 3 — Offline Cache (3 hrs)
- [ ] Curate top-500 Q&A pairs from ICAR FAQs
- [ ] Seed SQLite DB and bundle with frontend
- [ ] Pre-generate Polly audio for all 500 answers
- [ ] Implement offline detection + cache query logic

### Phase 4 — Web Search Fallback (3 hrs)
- [ ] Create Bedrock Agent with web search tool enabled
- [ ] Define intent classifier for live-data queries
- [ ] Route scheme/price queries through Agent
- [ ] Label live answers distinctly in UI

### Phase 5 — Frontend (4 hrs)
- [ ] Mic button with Hindi label + waveform animation
- [ ] Processing state labels in Hindi
- [ ] Numbered Hindi text steps display alongside audio
- [ ] Offline mode badge
- [ ] Source citation panel
- [ ] Airplane mode demo path verified

## Success Metrics (Hackathon)

| Metric | Target |
|---|---|
| End-to-end latency (online) | ≤ 5 seconds |
| End-to-end latency (offline cache) | ≤ 1 second |
| RAG answer accuracy (spot check 10 questions) | ≥ 8/10 grounded answers |
| Transcribe WER on farming vocabulary | < 20% |
| Offline cache coverage of demo questions | 100% |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Transcribe accuracy on noisy audio | Medium | Custom vocabulary with farming terms; test in quiet environment for demo |
| Bedrock KB indexing delay | Low | Pre-index PDFs before demo day; keep snapshot |
| Polly latency pushing past 5s | Medium | Stream audio playback; don't wait for full synthesis |
| OpenSearch Serverless cold start | Low | Warm Lambda with scheduled EventBridge ping every 5 min |
| Demo internet failure | Low | Offline cache covers all rehearsed demo questions |

## Open Questions

- [ ] Should Transcribe use streaming (WebSocket) or batch (upload audio file)? Streaming preferred for latency but adds frontend complexity.
- [ ] Which ICAR PDF set covers the broadest crop coverage in fewest files?
- [ ] Is Kajal neural available in ap-south-1 (Mumbai region)? Confirm before build.
- [ ] Should offline cache be bundled in the PWA or downloaded on first launch?
