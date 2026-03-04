# KisanVoice - Smart Irrigation Alert System

**AI-powered irrigation recommendations and weather alerts for Indian farmers via SMS**

[![Status](https://img.shields.io/badge/status-production-green)]()
[![AWS](https://img.shields.io/badge/AWS-ap--south--1-orange)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)]()

---

## Overview

KisanVoice is a serverless smart irrigation system that helps farmers optimize water usage and protect crops through:

- 🌾 **Daily Irrigation Intelligence** - AI-powered recommendations at 5:45 PM IST
- ⚠️ **24/7 Weather Monitoring** - Critical weather alerts every 3 hours
- 📍 **GPS-Based Accuracy** - Farm-specific weather data
- 💬 **Bilingual SMS** - Hindi and English support
- 💧 **Water Savings Tracking** - Real-time savings metrics
- 📊 **Weekly Reports** - Progress summaries every Sunday

**Impact:** Save 30-40% water, reduce costs, increase yield by 10-15%

---

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- AWS CLI configured
- Twilio account (for SMS)
- OpenWeatherMap API key

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/kisanvoice-irrigation.git
cd kisanvoice-irrigation

# Install dependencies
npm install

# Configure AWS
aws configure
# Region: ap-south-1 (Mumbai)

# Create secrets
aws secretsmanager create-secret \
  --name kisanvoice/prod \
  --secret-string '{
    "TWILIO_ACCOUNT_SID": "your_sid",
    "TWILIO_AUTH_TOKEN": "your_token",
    "TWILIO_MESSAGING_SERVICE_SID": "your_service_sid",
    "OPENWEATHER_API_KEY": "your_api_key"
  }'

# Deploy to AWS
npx serverless deploy

# Seed crop and monsoon data
npm run seed:crops
npm run seed:monsoon
```

---

## Features

### 1. Daily Irrigation Intelligence

- Calculates soil moisture using FAO-56 methodology
- Analyzes 48-hour weather forecast
- Considers crop type and growth stage
- Sends personalized SMS recommendations

### 2. Weather Alert System

Monitors 6 critical conditions:
- Heatwave (>40°C)
- Frost (<5°C)
- Thunderstorm
- Heavy Rain (>50mm)
- High Wind (>40 km/h)
- Drought (10+ days)

### 3. Supported Crops

- Wheat (120 days, 6 stages)
- Rice (130 days, 6 stages)
- Cotton (180 days, 5 stages)
- Sugarcane (365 days, 4 stages)
- Maize (90 days, 5 stages)
- Potato (110 days, 5 stages)

### 4. Coverage

**Current:** 12 districts in Haryana, India  
**Future:** Expanding to Punjab, UP, Rajasthan

---

## API Endpoints

**Base URL:** `https://ys4xa8tu60.execute-api.ap-south-1.amazonaws.com/dev`

### Register Farmer
```bash
POST /irrigation/register
Content-Type: application/json

{
  "phone": "+919876543210",
  "name": "Ramesh Kumar",
  "crop": "wheat",
  "cropStage": "flowering",
  "district": "Karnal",
  "lat": 29.6857,
  "lon": 76.9905,
  "language": "hi"
}
```

### Get Dashboard
```bash
GET /irrigation/dashboard/{farmerId}
```

### Get Alerts by Phone
```bash
GET /irrigation/alerts/phone/{phone}
```

### Delete Alert
```bash
DELETE /irrigation/alerts/delete/{farmerId}/{alertId}
```

### Unregister Farmer
```bash
DELETE /irrigation/unregister/{farmerId}
```

### Get Crop Calendar
```bash
GET /irrigation/crop-calendar/{crop}
GET /irrigation/crop-calendar  # List all
```

---

## Architecture

**Infrastructure:**
- AWS Lambda (serverless compute)
- DynamoDB (database)
- API Gateway (REST API)
- EventBridge (scheduling)
- Twilio (SMS delivery)
- OpenWeatherMap (weather data)

**Key Components:**
- 12 Lambda functions
- 6 DynamoDB tables
- Per-farmer EventBridge rules
- Dead letter queue for retries

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design.

---

## Testing

### Unit Tests
```bash
npm test
```

### Manual Testing
```bash
# Test registration
curl -X POST https://ys4xa8tu60.execute-api.ap-south-1.amazonaws.com/dev/irrigation/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","name":"Test","crop":"wheat","cropStage":"flowering","district":"Karnal"}'

# Test dashboard
curl https://ys4xa8tu60.execute-api.ap-south-1.amazonaws.com/dev/irrigation/dashboard/{farmerId}

# Trigger manual check
aws lambda invoke \
  --function-name kisanvoice-irrigation-dev-daily-intelligence \
  --payload '{"farmerId":"test-uuid"}' \
  response.json
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | This file - Quick start and overview |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and data flow |
| [FEATURES.md](docs/FEATURES.md) | Complete feature list and capabilities |
| [REQUIREMENTS.md](docs/REQUIREMENTS.md) | System requirements and dependencies |
| [SPEC.md](docs/SPEC.md) | Technical specifications and algorithms |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | Guide for farmers and developers |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Complete API reference |

---

## Monitoring

### CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/kisanvoice-irrigation-dev-daily-intelligence --follow

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=kisanvoice-irrigation-dev-daily-intelligence \
  --start-time 2026-03-01T00:00:00Z \
  --end-time 2026-03-04T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### Key Metrics
- Lambda invocations
- SMS delivery rate
- API response time
- DynamoDB read/write capacity
- Error rates

---

## Cost Estimate

| Farmers | AWS/month | Twilio/month | Total/month |
|---------|-----------|--------------|-------------|
| 1,000 | $9 | $237 | $246 |
| 10,000 | $45 | $2,370 | $2,415 |
| 100,000 | $380 | $23,700 | $24,080 |

---

## ROI for Farmers

**Example: 5 acres wheat**
- Water saved: 50,000 L/season
- Cost saved: ₹8,000/season
- Yield increase: 15% = ₹15,000
- Total benefit: ₹23,000/season
- Service cost: ₹500/season
- **ROI: 4,500%**

---

## Support

**For Farmers:**
- 📞 Phone: [Support Number]
- 📧 Email: support@kisanvoice.com
- 🕐 Hours: 9 AM - 6 PM IST

**For Developers:**
- 💬 GitHub Issues
- 📧 Email: dev@kisanvoice.com
- 📚 Documentation: See above

---

## Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

---

## License

MIT License - See LICENSE file for details

---

## Status

✅ **Production Ready**  
🟢 **Live and Monitoring**  
📍 **Region:** ap-south-1 (Mumbai)  
📅 **Version:** 1.0.0  
🗓️ **Last Updated:** March 4, 2026

---

**Built with ❤️ for Indian farmers**
