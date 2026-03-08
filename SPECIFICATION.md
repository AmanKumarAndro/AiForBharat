# 🌾 KisanVoice AI — Technical Specification

> Complete technical specification for the AI For Bharat platform.

---

## 1. System Overview

**KisanVoice AI** is a distributed, serverless platform comprising a React Native mobile app, a React web application (landing page + admin dashboard), and 7 independent backend microservices, all deployed on AWS. The platform provides voice-first agricultural intelligence in Hindi for Indian farmers.

### Design Principles
- **Voice-First**: All features accessible through Hindi voice interaction
- **Serverless**: Zero server management, auto-scaling, pay-per-use
- **Microservices**: Each service independently deployable and scalable
- **SMS Fallback**: Critical alerts work on feature phones via SMS
- **Cost-Efficient**: Optimized for AWS free tier and minimal per-query costs

---

## 2. Mobile Application

### Tech Stack
| Component | Technology |
|-----------|-----------|
| Framework | React Native 0.73+ (TypeScript) |
| Navigation | React Navigation 6 (Stack + Bottom Tabs) |
| Voice STT | `@react-native-voice/voice` (Hindi `hi-IN`) |
| AI Backend | AWS SDK v3 (`@aws-sdk/client-bedrock-runtime`) |
| TTS | AWS Polly SDK (`@aws-sdk/client-polly`, Neural Kajal voice) |
| Storage | `@react-native-async-storage/async-storage` |
| Audio | `react-native-sound-player` |
| HTTP | Native `fetch` API |
| Env Vars | `react-native-dotenv` (`@env`) |

### Architecture
```
App.tsx
  └── AppNavigator.js
        ├── AuthStack (Login, Signup, Onboarding, ProfileForm)
        └── MainStack
              └── BottomTabNavigator
                    ├── Home → [Weather, CropGuide, QueryAssistant, Market, Services, ...]
                    ├── My Farm
                    ├── Voice Query (center floating button)
                    ├── Queries
                    └── Tools
```

### Key Services (in `src/services/`)
| File | Purpose |
|------|---------|
| `awsService.js` | Bedrock AI queries + Polly TTS |
| `voiceService.js` | Hindi speech recognition management |
| `api.js` | REST API calls to backend services |
| `aws-config.js` | AWS region and model configuration |

### Screen Count: 27
See [FEATURES.md](FEATURES.md) for complete screen listing.

---

## 2.5 Web Application (`Web/`)

> **🔑 Admin Access (for judges/instructors):** URL: `<deployed-url>/admin` · Admin ID: `admin` · Password: `kisanvoice2026`

### Tech Stack
| Component | Technology |
|-----------|-----------|
| Framework | React 19 + Vite 7 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite` plugin) |
| Routing | React Router v7 (`react-router-dom`) |
| Fonts | Inter (400–900), Noto Sans Devanagari (400–700) via Google Fonts |
| Build Tool | Vite with `@vitejs/plugin-react` |
| Linting | ESLint 9 with React hooks + refresh plugins |

### Architecture
```
main.jsx
  └── BrowserRouter
        ├── Route "/"      → App.jsx (Landing Page)
        └── Route "/admin" → AdminGuard → AdminDashboard
```

### Landing Page (`App.jsx`) — Static Showcase
| Section | Description |
|---------|-------------|
| **Navbar** | Responsive navigation with scroll toggle |
| **Hero** | Headline, description, CTA buttons |
| **VoiceBanner** | Hindi voice interaction CTA card |
| **FeaturesGrid** | Platform feature cards (Weather, Market, Irrigation, etc.) |
| **ServicesSection** | Backend services architecture showcase |
| **TechStack** | AWS, AI, mobile technology stack display |
| **Impact** | Impact metrics (water savings, yield increase, ROI) |
| **HowItWorks** | Step-by-step user flow explanation |
| **CTAFooter** | Call-to-action footer |
| **Footer** | Site footer with links |

### Admin Dashboard (`src/admin/`)
| Component | Purpose |
|-----------|---------|
| `AdminGuard.jsx` | Session-based authentication gate (sessionStorage) |
| `AdminDashboard.jsx` | 6-tab analytics dashboard consuming Master Dashboard API |

### Admin Dashboard Tabs
| Tab | API Endpoint | Data Displayed |
|-----|-------------|----------------|
| Overview | `/dashboard/overview` | Total farmers, voice queries, alerts, services |
| Voice AI | `/dashboard/features/voice-ai` | Session count, top questions, latency |
| Helping Hand | `/dashboard/features/helping-hand` | Service requests, providers, treatments |
| Irrigation | `/dashboard/features/irrigation` | Enrolled farmers, crop data, SMS logs, savings |
| Users | `/dashboard/users` | Cross-system user aggregation with deduplication |
| Activity | `/dashboard/activity` | Recent activity feed |

### API Integration
- **Base URL**: `https://[api-id].execute-api.ap-south-1.amazonaws.com`
- **Method**: All GET requests
- **Error Handling**: Graceful fallback with loading states
- **Refresh**: Manual refresh button per tab

---

## 3. Backend Services Specification

### 3.1 Login System (`Services/Login_system/`)

| Attribute | Value |
|-----------|-------|
| Runtime | Node.js 18.x |
| Framework | Serverless Framework |
| Database | DynamoDB (on-demand) |
| Auth | Twilio Verify API → JWT (7-day expiry) |
| Deployment | `npx serverless deploy` |
| Region | `ap-south-1` (Mumbai) |

#### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/send-otp` | No | Send OTP to phone number |
| POST | `/auth/verify-otp` | No | Verify OTP, return JWT token |
| POST | `/farmer/onboard` | JWT | Complete farmer profile |
| GET | `/farmer/profile` | JWT | Get farmer profile |

#### Database Schema — `KisanVoice-Users`
```json
{
  "phone": "+919876543210",    // Partition Key
  "name": "Ramesh Kumar",
  "userType": "farmer",
  "state": "Haryana",
  "city": "Karnal",
  "totalLandArea": 5,
  "language": "hi",
  "latitude": 29.6857,
  "longitude": 76.9905,
  "createdAt": "2026-03-01T..."
}
```

#### Source Structure
```
src/
├── handlers/
│   ├── auth.js          # send-otp, verify-otp
│   └── farmer.js        # onboard, profile
├── middleware/
│   └── auth.js          # JWT verification middleware
└── utils/
    ├── dynamodb.js      # DynamoDB CRUD operations
    ├── jwt.js           # JWT sign/verify
    ├── response.js      # HTTP response helper
    └── twilio.js        # Twilio Verify integration
```

---

### 3.2 AI Voice Agent (`Services/bedrock_agent_rag/`)

| Attribute | Value |
|-----------|-------|
| Runtime | Node.js 20.x |
| Framework | Serverless Framework |
| AI Model | Meta Llama 3 8B Instruct (`meta.llama3-8b-instruct-v1:0`) |
| Agent | AWS Bedrock Agent with action groups |
| Database | DynamoDB (session history, 7-day TTL) |
| TTS | AWS Polly |
| STT | AWS Transcribe |
| Region | `us-east-1` |

#### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/query` | AI text query with auto tool selection |
| POST | `/synthesize` | Hindi text → speech (Polly) |
| POST | `/transcribe` | Speech → Hindi text (Transcribe) |
| POST | `/voice-query` | Full voice pipeline (STT → AI → TTS) |
| POST | `/history` | Get conversation history |

#### AI Tool System
```
Query → Tool Manager
          ├── YouTube Tool (keywords: वीडियो, tutorial, कैसे)
          ├── Web Search Tool (keywords: कीमत, मंडी, योजना)
          └── RAG Knowledge Base (default for farming queries)
```

#### Model Configuration
```json
{
  "model": "meta.llama3-8b-instruct-v1:0",
  "max_gen_len": 600,
  "temperature": 0.7,
  "top_p": 0.9
}
```

#### Source Structure
```
backend/
├── src/
│   ├── handlers/
│   │   ├── agentQuery.js        # Bedrock Agent queries
│   │   ├── query.js             # Direct AI queries
│   │   ├── synthesize.js        # Polly TTS
│   │   ├── transcribe.js        # Transcribe STT
│   │   ├── voiceQuery.js        # Full voice pipeline
│   │   ├── getHistory.js        # Conversation history
│   │   ├── dynamoToolLambda.js  # DynamoDB RAG tool
│   │   └── youtubeToolLambda.js # YouTube search tool
│   └── utils/
│       ├── contextManager.js    # Conversation context
│       ├── dynamoRag.js         # DynamoDB RAG queries
│       ├── smartChunker.js      # Document chunking
│       └── toolManager.js       # Tool selection logic
├── scripts/
│   ├── setup-agent.py           # Bedrock Agent setup
│   ├── fix-agent.sh             # Agent configuration fix
│   ├── knowledge-scraper.py     # Agricultural data scraper
│   └── kb-ready-documents/      # Pre-processed knowledge base
└── serverless.yml               # Deployment configuration
```

---

### 3.3 Weather Advisory (`Services/Live_wheater_advisary/`)

| Attribute | Value |
|-----------|-------|
| Runtime | Python 3.11 |
| Deployment | AWS Lambda (standalone or CloudFormation) |
| Weather API | OpenWeather API (current + forecast) |
| AI Model | Amazon Nova Lite (`apac.amazon.nova-lite-v1:0`) |
| Region | `ap-south-1` |

#### API Endpoint
| Method | Path | Description |
|--------|------|-------------|
| POST | `/weather/advisory` | Get spray safety advisory for GPS coordinates |

#### Request/Response
```json
// Request
{ "lat": 28.4595, "lon": 77.0266, "activity": "spraying" }

// Response
{
  "rain_probability_next_6h": 30.0,
  "wind_speed": 12.5,
  "humidity": 65,
  "temperature": 28.3,
  "uv_index": 6.0,
  "advisory": {
    "spray_safe": true,
    "messages": ["छिड़काव के लिए अनुकूल मौसम"]
  },
  "friendly_message": "AI-generated Hindi advisory..."
}
```

#### Safety Rules Engine
| Parameter | Unsafe Threshold | Message |
|-----------|-----------------|---------|
| Rain Probability | >60% | बारिश की संभावना |
| Wind Speed | >15 km/h | तेज हवा - दवा बह सकती है |
| Humidity | >80% | फफूंद का खतरा |
| UV Index | >8 | दोपहर में छिड़काव से बचें |

---

### 3.4 Irrigation Alert System (`Services/Water-Irrigation_alert_system/`)

| Attribute | Value |
|-----------|-------|
| Runtime | Node.js 18.x |
| Framework | Serverless Framework |
| Database | DynamoDB (6 tables) |
| SMS | Twilio Messaging Service |
| Weather | OpenWeatherMap API |
| Scheduling | AWS EventBridge (per-farmer rules) |
| Region | `ap-south-1` |

#### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/irrigation/register` | Register farmer with GPS + crop |
| GET | `/irrigation/dashboard/{id}` | Farmer dashboard metrics |
| GET | `/irrigation/alerts/phone/{phone}` | Get alerts by phone |
| DELETE | `/irrigation/alerts/delete/{id}/{alertId}` | Delete alert |
| DELETE | `/irrigation/unregister/{id}` | Unregister farmer |
| GET | `/irrigation/crop-calendar/{crop}` | Get crop calendar |

#### Lambda Functions (12)
| Function | Trigger | Purpose |
|----------|---------|---------|
| register-farmer | API Gateway | Farmer registration |
| dashboard | API Gateway | Dashboard data |
| daily-intelligence | EventBridge (5:45 PM IST) | Daily irrigation SMS |
| weather-monitor | EventBridge (every 3h) | Critical weather alerts |
| weekly-report | EventBridge (Sunday) | Weekly progress SMS |
| send-alert | Internal | SMS delivery |

#### DynamoDB Tables (6)
| Table | Partition Key | Purpose |
|-------|-------------|---------|
| Farmers | farmerId | Farmer profiles |
| Alerts | farmerId | Alert history |
| CropCalendar | crop | Crop growth data |
| MonsoonData | region | Regional monsoon data |
| WaterSavings | farmerId | Savings metrics |
| AlertRules | farmerId | Per-farmer schedules |

#### Source Structure
```
src/
├── handlers/
│   ├── register.js              # Farmer registration + EventBridge setup
│   ├── dashboard.js             # Dashboard metrics
│   ├── dailyIntelligence.js     # FAO-56 irrigation calculation
│   ├── weatherMonitor.js        # 3-hourly weather check
│   ├── weeklyReport.js          # Weekly progress SMS
│   ├── sendAlert.js             # Twilio SMS delivery
│   ├── cropCalendar.js          # Crop data API
│   └── unregister.js            # Farmer removal
├── utils/
│   ├── weatherService.js        # OpenWeather API integration
│   ├── irrigationCalculator.js  # FAO-56 soil moisture model
│   ├── smsService.js            # Twilio SMS formatting
│   └── dynamodb.js              # Database operations
└── data/
    ├── cropData.js              # Crop coefficients and stages
    └── monsoonData.js           # Regional monsoon patterns
```

---

### 3.5 Live Market Analyzer (`Services/Live_market/`)

| Attribute | Value |
|-----------|-------|
| Runtime | Python 3.13 |
| Deployment | AWS SAM (CloudFormation) |
| Data API | data.gov.in (commodity prices) |
| AI Model | Amazon Nova Micro (`amazon.nova-micro-v1:0`) — FREE |
| Frontend | S3-hosted static site |
| Region | `us-east-1` |

#### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/analyze` | Fetch data + AI analysis |
| POST | `/fetch` | Raw commodity data only |

#### Source Structure
```
├── lambda_function.py       # AWS Lambda handler
├── commodity_analyzer.py    # Standalone analyzer class
├── config.py               # Configuration (loads from .env)
├── template.yaml           # SAM CloudFormation template
├── static/                 # Frontend assets
│   ├── index.html          # Web dashboard
│   └── script.js           # Frontend logic
└── templates/
    └── index.html           # Flask web template
```

---

### 3.6 Helping Hand Marketplace (`Services/Uber_style_Helping_Hand_system/`)

| Attribute | Value |
|-----------|-------|
| Runtime | Python 3.12 |
| Database | DynamoDB |
| API | API Gateway (REST) |
| SMS | Twilio (send + webhook receive) |
| Region | `ap-south-1` |

#### API Endpoints (10)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/provider` | Register provider |
| POST | `/request` | Create service request |
| GET | `/status/{id}` | Check request status |
| POST | `/accept` | Accept request (app) |
| POST | `/test-accept` | Accept request (SMS test) |
| POST | `/complete` | Complete and rate |
| GET | `/providers-map` | Providers for map display |
| GET | `/farmer-requests/{id}` | Farmer's requests |
| GET | `/provider-jobs/{id}` | Provider's jobs |
| POST | `/sms-reply` | Twilio SMS webhook |

#### Lambda Functions (11)
| Function | Handler | Purpose |
|----------|---------|---------|
| HH_CreateRequest | `create_request.py` | Create service request + trigger matching |
| HH_MatchProviders | `match_providers.py` | Find top 3 nearby providers, send SMS |
| HH_AcceptRequest | `accept_request.py` | DynamoDB atomic accept (race-safe) |
| HH_CompleteAndRate | `complete_and_rate.py` | Mark complete + store rating |
| HH_GetStatus | `get_status.py` | Status lookup |
| HH_RegisterProvider | `register_provider.py` | Provider registration |
| HH_GetProvidersMap | `get_providers_map.py` | Map data |
| HH_GetFarmerRequests | `get_farmer_requests.py` | Farmer request list |
| HH_GetProviderJobs | `get_provider_jobs.py` | Provider job list |
| HH_HandleSMSReply | `handle_sms_reply.py` | Process "YES" SMS replies |
| HH_TestSMSAccept | `test_sms_accept.py` | Test acceptance endpoint |

#### Matching Algorithm
```
1. Farmer creates request with pincode + service type
2. System queries providers matching:
   - Same service type (TRACTOR / LABOUR / TRANSPORT)
   - Same or nearby pincode
   - Currently available (not on another job)
3. Sorts by proximity (matching pincode first, then nearby)
4. Sends SMS to top 3 providers
5. First provider to reply "YES" wins (atomic DynamoDB update)
```

---

### 3.7 Master Dashboard API (`Services/master_dashboard/`)

| Attribute | Value |
|-----------|-------|
| Runtime | Node.js 18.x |
| Framework | Serverless Framework |
| Database | 15+ DynamoDB tables (read-only access) |
| Deployment | `npx serverless deploy` |
| Region | `ap-south-1` (Mumbai) |
| Memory | 512 MB |
| Timeout | 10 seconds |

#### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/overview` | Aggregated platform metrics |
| GET | `/dashboard/activity` | Recent activity feed (configurable limit) |
| GET | `/dashboard/farmers` | Farmer analytics by state, city, registration |
| GET | `/dashboard/ai-usage` | Voice AI query analytics |
| GET | `/dashboard/alerts` | Weather + irrigation alert counts |
| GET | `/dashboard/services` | Helping Hand service request metrics |
| GET | `/dashboard/features` | Complete feature aggregation (14 parallel DynamoDB scans) |
| GET | `/dashboard/features/voice-ai` | Voice AI session details |
| GET | `/dashboard/features/helping-hand` | Full Helping Hand data |
| GET | `/dashboard/features/irrigation` | Full irrigation system data |
| GET | `/dashboard/users` | Cross-system user aggregation with deduplication |

#### DynamoDB Tables Accessed (15+)
| System | Tables |
|--------|--------|
| Authentication | `kisanvoice-auth-api-dev-farmers` |
| Voice AI | `farmer-voice-ai-dev-sessions` |
| Helping Hand | `HH_Requests`, `HH_Providers`, `HH_TreatmentDB`, `HH_BannedPesticides`, `HH_KVKContacts`, `HH_PincodeMappings` |
| Irrigation | `kisanvoice-irrigation-dev-farmers`, `kisanvoice-irrigation-dev-crop-data`, `kisanvoice-irrigation-dev-monsoon-calendar`, `kisanvoice-irrigation-dev-savings`, `kisanvoice-irrigation-dev-sms-log`, `kisanvoice-irrigation-dev-soil-state` |

#### Source Structure
```
src/
├── index.js                     # Lambda handler, route management
├── services/
│   ├── aggregator.js            # High-level cross-feature aggregation
│   ├── features.js              # Feature-specific data (14 scan functions)
│   └── dynamodb.js              # Low-level DB operations (count, activity, groupBy)
└── utils/
    └── response.js              # Standardized HTTP response helpers
scripts/
├── discover-tables.js           # DynamoDB table discovery utility
├── inspect-tables.js            # Table data inspection tool
└── check-all-users.js           # User audit script
```

#### Design Patterns
- **Parallel Execution**: `Promise.all()` for multi-table aggregation (up to 14 parallel scans)
- **Graceful Degradation**: Each scan wrapped in try/catch returning safe defaults
- **User Deduplication**: Merges users across auth, irrigation, and service request systems by phone number
- **Read-Only**: IAM limited to `dynamodb:Scan`, `dynamodb:Query`, `dynamodb:GetItem`

---

## 4. Infrastructure

### AWS Services Used
| Service | Usage |
|---------|-------|
| Lambda | All compute (8 services, 30+ functions) |
| API Gateway | REST APIs for all services |
| DynamoDB | All databases (on-demand billing) |
| Bedrock | AI models (Claude, Llama 3, Nova) |
| Polly | Hindi text-to-speech (Neural) |
| Transcribe | Hindi speech-to-text |
| S3 | Knowledge base docs, frontend hosting |
| EventBridge | Scheduled irrigation checks |
| CloudWatch | Logging and monitoring |
| SSM | Secrets management |
| IAM | Least-privilege roles |

### Regions
| Service | Region | Reason |
|---------|--------|--------|
| Login, Irrigation, Helping Hand, Weather, Dashboard | `ap-south-1` | Low latency for Indian users |
| Bedrock Agent, Market | `us-east-1` | Full Bedrock model availability |

### Cost Estimate (1,000 farmers)
| Component | Monthly Cost |
|-----------|-------------|
| AWS Lambda | ~$5 |
| DynamoDB | ~$3 |
| Bedrock AI | ~$1 |
| Twilio SMS | ~$237 |
| **Total** | **~$248/month** |

---

## 5. Security

| Measure | Implementation |
|---------|---------------|
| Authentication | JWT tokens with 7-day expiry |
| Secret Storage | AWS SSM Parameter Store + `.env` files (gitignored) |
| Transport | HTTPS only (API Gateway enforced) |
| Data Encryption | DynamoDB default encryption at rest |
| Data Retention | 7-day TTL on conversation history |
| IAM | Least-privilege roles per Lambda function |
| CORS | Enabled on all API endpoints |
| No PII Storage | Minimal personal data retained |

---

## 6. Performance Targets

| Metric | Target | Achieved |
|--------|--------|----------|
| Text query response | <5s | 2-5s ✅ |
| Voice query response | <15s | 7-15s ✅ |
| TTS conversion | <2s | 1-2s ✅ |
| API response (non-AI) | <500ms | <500ms ✅ |
| SMS delivery | <10s | <5s ✅ |
| Cost per AI query | <$0.001 | $0.0005 ✅ |
| Lambda cold start | <3s | 1-2s ✅ |
