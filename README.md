<p align="center">
  <h1 align="center">🌾 AI For Bharat — KisanVoice AI</h1>
  <p align="center"><strong>Voice-first AI platform empowering Indian farmers with real-time intelligence in Hindi</strong></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AWS-Serverless-orange?logo=amazonaws" />
  <img src="https://img.shields.io/badge/React_Native-Mobile-blue?logo=react" />
  <img src="https://img.shields.io/badge/AI-Bedrock%20%7C%20Llama3%20%7C%20Claude-purple" />
  <img src="https://img.shields.io/badge/Language-Hindi-green" />
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen" />
</p>

---

## 🎯 Problem Statement

**70% of India's population** depends on agriculture, yet farmers face critical challenges: limited access to expert advice, unpredictable weather, water wastage, unfair market prices, and lack of farm services. Most solutions are in English and require smartphone literacy — excluding millions of farmers.

## 💡 Our Solution

**KisanVoice AI** is a complete, voice-first agricultural intelligence platform that works in **Hindi**. Farmers speak their question, and the platform responds with AI-powered answers, weather advisories, market insights, irrigation alerts, and on-demand farm services — all through natural voice conversation.

---

## 🏗️ System Architecture

```
                        ┌──────────────────────────┐
                        │    📱 React Native App    │
                        │   (KisanVoiceAiHack2Skill)│
                        └──────────┬───────────────┘
                                   │ HTTPS
                    ┌──────────────┼──────────────┐
                    ↓              ↓              ↓
            ┌──────────┐   ┌──────────┐   ┌──────────┐
            │  Login    │   │ Bedrock  │   │ Weather  │
            │  System   │   │ Agent    │   │ Advisory │
            │ (Auth)    │   │ (RAG+AI) │   │ (Polly)  │
            └──────────┘   └──────────┘   └──────────┘
                    ↓              ↓              ↓
            ┌──────────┐   ┌──────────┐   ┌──────────┐
            │Irrigation│   │  Market  │   │ Helping  │
            │ Alerts   │   │ Analyzer │   │  Hand    │
            │  (SMS)   │   │(Bedrock) │   │(Twilio)  │
            └──────────┘   └──────────┘   └──────────┘
                    ↓              ↓              ↓
         ┌─────────────────────────────────────────────┐
         │        AWS Cloud (Lambda + DynamoDB +        │
         │        API Gateway + Bedrock + Polly)        │
         └─────────────────────────────────────────────┘
```

---

## 📦 Project Structure

```
AiForBharat/
├── KisanVoiceAiHack2Skill/          # 📱 React Native Mobile Application
│   ├── src/
│   │   ├── screens/                 # 27 screens (Home, Login, Weather, Market, etc.)
│   │   ├── services/                # AWS Bedrock, Polly, Voice, API services
│   │   ├── navigation/              # Stack + Bottom Tab navigators
│   │   ├── components/              # Reusable UI components
│   │   └── config/                  # App configuration
│   ├── android/                     # Android native code
│   ├── ios/                         # iOS native code
│   └── assets/                      # Icons, images, fonts
│
├── Services/
│   ├── Login_system/                # 🔐 OTP-based authentication (Twilio + JWT)
│   ├── bedrock_agent_rag/           # 🤖 Hindi AI Agent (Llama 3 + RAG + Tools)
│   ├── Live_wheater_advisary/       # 🌦️ Weather-based spray advisory (Lambda)
│   ├── Water-Irrigation_alert_system/ # 💧 Smart irrigation alerts (SMS)
│   ├── Live_market/                 # 📊 Commodity price analyzer (Bedrock)
│   └── Uber_style_Helping_Hand_system/ # 🚜 Farm services marketplace (Twilio SMS)
│
├── README.md                        # ← You are here
├── FEATURES.md                      # Detailed feature documentation
└── SPECIFICATION.md                 # Technical specifications
```

---

## 🧩 Components

### 1. 📱 Mobile App — `KisanVoiceAiHack2Skill/`

| Feature | Details |
|---------|---------|
| **Framework** | React Native (TypeScript) |
| **Voice AI** | Real-time Hindi speech-to-text + text-to-speech |
| **AI Backend** | AWS Bedrock (Claude 3.5 Sonnet, Nova) + Polly |
| **Screens** | 27 screens — Onboarding, Login, Home, Weather, Market, Irrigation, Services, Pest Scan, Crop Guide, Query Assistant, Provider Dashboard |
| **Auth** | OTP-based phone authentication |
| **Offline** | Offline indicators and caching |

### 2. 🔐 Login System — `Services/Login_system/`

| Feature | Details |
|---------|---------|
| **Auth** | OTP via Twilio Verify + JWT sessions (7-day expiry) |
| **Stack** | Node.js 18 + Serverless Framework + DynamoDB |
| **Endpoints** | `send-otp`, `verify-otp`, `onboard`, `profile` |
| **Security** | Secrets stored in AWS SSM Parameter Store |

### 3. 🤖 AI Voice Agent — `Services/bedrock_agent_rag/`

| Feature | Details |
|---------|---------|
| **AI Model** | Meta Llama 3 8B via AWS Bedrock |
| **Capabilities** | Text queries, voice-to-voice, YouTube video recommendations, web search, conversation history |
| **Tools** | RAG knowledge base, YouTube search, web search, DynamoDB history |
| **Performance** | 2-5s text queries, 7-15s voice queries, ~$0.0005/query |

### 4. 🌦️ Weather Advisory — `Services/Live_wheater_advisary/`

| Feature | Details |
|---------|---------|
| **Purpose** | AI-powered pesticide spray safety advisory |
| **Data** | OpenWeather API (current + 6h forecast) |
| **AI** | Amazon Nova Lite on Bedrock for friendly Hindi messages |
| **Rules** | Wind speed, rain probability, humidity, UV index analysis |

### 5. 💧 Irrigation Alert System — `Services/Water-Irrigation_alert_system/`

| Feature | Details |
|---------|---------|
| **Purpose** | Daily irrigation intelligence + 24/7 weather monitoring |
| **Methodology** | FAO-56 soil moisture calculation |
| **Crops** | Wheat, Rice, Cotton, Sugarcane, Maize, Potato (6 growth stages each) |
| **Alerts** | Heatwave, Frost, Thunderstorm, Heavy Rain, High Wind, Drought |
| **Delivery** | Bilingual SMS (Hindi + English) via Twilio |
| **Impact** | 30-40% water savings, 10-15% yield increase |

### 6. 📊 Live Market Analyzer — `Services/Live_market/`

| Feature | Details |
|---------|---------|
| **Data Source** | data.gov.in API (live commodity prices) |
| **AI Analysis** | AWS Bedrock (Amazon Nova Micro) for price trends |
| **Output** | Price trends, buy/sell recommendations, regional insights, risk assessment |
| **Deployment** | AWS SAM + Lambda + S3 frontend |

### 7. 🚜 Helping Hand — `Services/Uber_style_Helping_Hand_system/`

| Feature | Details |
|---------|---------|
| **Purpose** | On-demand farm services marketplace (Uber-style) |
| **Services** | Tractor, Labour, Transport matching |
| **Matching** | Top 3 nearest providers notified via SMS |
| **Accept** | Providers reply "YES" to SMS to accept jobs |
| **Features** | Map display, real-time status, rating system, race-condition-safe atomic operations |

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Mobile** | React Native, TypeScript, React Navigation |
| **AI/ML** | AWS Bedrock (Claude 3.5 Sonnet, Llama 3, Nova), AWS Polly (neural TTS), AWS Transcribe |
| **Backend** | Node.js 18/20, Python 3.12, Serverless Framework |
| **Cloud** | AWS Lambda, API Gateway, DynamoDB, S3, EventBridge, CloudWatch |
| **Auth** | Twilio Verify (OTP) + JWT |
| **Messaging** | Twilio SMS (bilingual alerts) |
| **Weather** | OpenWeather API |
| **Market Data** | data.gov.in API |
| **Voice** | @react-native-voice/voice (Hindi STT) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ | Python 3.12+
- AWS CLI configured (`ap-south-1` region)
- Twilio account
- React Native development environment

### Quick Setup

```bash
# Clone repository
git clone https://github.com/AmanKumarAndro/AiForBharat.git
cd AiForBharat

# Mobile App
cd KisanVoiceAiHack2Skill
npm install
npx react-native run-android

# Backend Services (each service has its own deployment)
cd Services/Login_system && npm install && npx serverless deploy
cd Services/bedrock_agent_rag/backend && npm install && npx serverless deploy
cd Services/Water-Irrigation_alert_system && npm install && npx serverless deploy
```

### Environment Variables

Each service has its own `.env` file (gitignored) for secrets. See individual service READMEs for configuration details.

---

## 📱 App Screenshots Flow

```
Onboarding → OTP Login → Home Dashboard
    ├── 🎤 Voice Query (center button) → AI Query Assistant
    ├── 🌦️ Weather → Spray Advisory + Forecast
    ├── 💧 Irrigation → Registration → Dashboard → Alerts → Schedule
    ├── 📊 Market → Live Commodity Prices + AI Analysis
    ├── 🚜 Services → Request Tractor/Labour → Track Status
    ├── 🌿 Crop Guide → ICAR Verified Steps + Videos
    ├── 🔍 Pest Scan → Camera-based Pest Identification
    └── 👤 Profile → Farm Details + Settings
```

---

## 🏆 Hackathon Highlights

- **100% Voice-First** — Farmers interact entirely through Hindi voice, making it accessible to illiterate users
- **6 Integrated AI Services** — Not just one feature, but a complete agricultural platform
- **Real AWS Production Deployment** — All services are live and deployed on AWS
- **SMS Fallback** — Critical alerts work on basic phones via Twilio SMS
- **FAO-56 Scientific Methodology** — Irrigation advice based on internationally recognized standards
- **$0.0005 per AI query** — Extremely cost-efficient using AWS Bedrock free tier models
- **27 Mobile Screens** — Full production-quality mobile app

---

## 👥 Team

**AI For Bharat** — Built with ❤️ for Indian farmers

---

## 📄 License

MIT License — See individual service directories for details.
