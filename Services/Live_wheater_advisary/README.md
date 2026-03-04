# AI Agri Weather Intelligence Module

Agriculture-focused weather advisory system for pesticide spray safety decisions in India.

## Overview

This system provides real-time weather intelligence with AI-powered recommendations to help farmers make safe pesticide spraying decisions. It integrates OpenWeather API for weather data and AWS Bedrock (Amazon Nova Lite) for generating farmer-friendly advisory messages.

## Features

- ✅ Real-time weather data from OpenWeather API
- ✅ Agriculture-specific safety rules for pesticide spraying
- ✅ AI-generated farmer-friendly advisory messages
- ✅ REST API with JSON responses
- ✅ Sub-2 second response time
- ✅ Deployed on AWS Lambda + API Gateway
- ✅ Support for Indian locations

## Quick Start

### Test the API

```bash
curl -X POST https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory \
  -H 'Content-Type: application/json' \
  -d '{"lat": 28.4595, "lon": 77.0266, "activity": "spraying"}'
```

### Local Testing

```bash
# Test basic functionality
python3 test_local.py

# Test with mock Bedrock
python3 test_with_bedrock.py
```

## Project Structure

```
.
├── README.md                          # This file
├── ARCHITECTURE.md                    # System architecture documentation
├── USER_GUIDE.md                      # End-user guide
├── API_DOCUMENTATION.md               # API reference
├── SPECIFICATION.md                   # Technical specification
├── lambda_function.py                 # Main Lambda handler
├── cloudformation_template.yaml       # AWS infrastructure
├── iam_policy.json                   # IAM permissions
├── deploy_aws.sh                     # Deployment script
├── test_local.py                     # Local test script
└── test_with_bedrock.py              # Bedrock test script
```

## Deployment

### Automated Deployment

```bash
./deploy_aws.sh
```

This will:
1. Package the Lambda function
2. Deploy CloudFormation stack
3. Upload function code
4. Display the API endpoint

### Manual Deployment

See `ARCHITECTURE.md` for detailed deployment instructions.

## API Endpoint

**Production:** `https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory`

**Method:** POST

**Request:**
```json
{
  "lat": 28.4595,
  "lon": 77.0266,
  "activity": "spraying"
}
```

**Response:**
```json
{
  "location": "Lat: 28.4595, Lon: 77.0266",
  "rain_probability_next_6h": 0,
  "wind_speed": 6.6,
  "humidity": 22,
  "temperature": 19.2,
  "uv_index": 0,
  "advisory": {
    "spray_safe": true,
    "messages": ["Conditions favorable for spraying"]
  },
  "friendly_message": "Dear Farmer, Great news! Weather conditions are perfect for spraying..."
}
```

## Safety Rules

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Rain Probability | > 60% | ❌ Don't spray |
| Wind Speed | > 15 km/h | ❌ Don't spray |
| Humidity | > 80% | ⚠️ Warning |
| UV Index | > 8 | ⚠️ Warning |

## Documentation

- **Architecture:** See `ARCHITECTURE.md`
- **User Guide:** See `USER_GUIDE.md`
- **API Reference:** See `API_DOCUMENTATION.md`
- **Technical Spec:** See `SPECIFICATION.md`

## Technology Stack

- **Runtime:** Python 3.11
- **Cloud:** AWS Lambda + API Gateway
- **Weather API:** OpenWeather
- **AI Model:** AWS Bedrock (Amazon Nova Lite)
- **Region:** ap-south-1 (Mumbai)
- **Infrastructure:** CloudFormation

## Requirements

- AWS Account with Bedrock access
- OpenWeather API Key
- Python 3.9+
- AWS CLI configured

## Support

For issues or questions:
- Check CloudWatch logs: `/aws/lambda/weather-advisory`
- Region: ap-south-1 (Mumbai)
- Lambda Function: `weather-advisory`

## License

Proprietary - AI Pest Scan + Farm Decision Engine

## Version

1.0.0 (March 2026)
