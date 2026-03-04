# Technical Specification

## AI Agri Weather Intelligence Module

**Version:** 1.0.0  
**Date:** March 2026  
**Status:** Production

---

## 1. Project Overview

### 1.1 Purpose

Build a weather intelligence engine that provides real-time weather data and agriculture-specific safety recommendations for pesticide spraying decisions in India.

### 1.2 Scope

**In Scope:**
- Real-time weather data retrieval
- Agriculture safety rule engine
- AI-powered advisory message generation
- REST API for mobile/web integration
- AWS serverless deployment

**Out of Scope:**
- Historical weather data storage
- Multi-language support (future)
- Push notifications (future)
- User authentication (future)

### 1.3 Target Users

- Indian farmers
- Agricultural mobile applications
- Farm management systems
- Agricultural extension services

---

## 2. Functional Requirements

### 2.1 Weather Data Retrieval

**FR-001: Fetch Current Weather**
- System SHALL fetch current weather data from OpenWeather API
- System SHALL retrieve temperature, humidity, wind speed, UV index
- System SHALL handle API failures gracefully
- Response time SHALL be < 500ms

**FR-002: Fetch Weather Forecast**
- System SHALL fetch 6-hour weather forecast
- System SHALL calculate rain probability for next 6 hours
- System SHALL use hourly forecast data
- Forecast SHALL include precipitation probability

### 2.2 Safety Rule Engine

**FR-003: Rain Probability Check**
- System SHALL check if rain probability > 60% in next 6 hours
- IF rain probability > 60%, THEN spray_safe = false
- System SHALL include "Rain expected in next 6 hours" message

**FR-004: Wind Speed Check**
- System SHALL check if wind speed > 15 km/h
- IF wind speed > 15 km/h, THEN spray_safe = false
- System SHALL include "High wind speed - spray drift risk" message

**FR-005: Humidity Check**
- System SHALL check if humidity > 80%
- IF humidity > 80%, THEN add warning message
- System SHALL include "High humidity - increased fungus risk" message
- Humidity check SHALL NOT set spray_safe to false

**FR-006: UV Index Check**
- System SHALL check if UV index > 8
- IF UV index > 8, THEN add warning message
- System SHALL include "High UV - avoid mid-day spraying" message
- UV check SHALL NOT set spray_safe to false

**FR-007: Overall Safety Decision**
- System SHALL set spray_safe = true IF all critical checks pass
- System SHALL set spray_safe = false IF any critical check fails
- Critical checks: rain probability, wind speed
- Non-critical checks: humidity, UV index

### 2.3 AI Advisory Generation

**FR-008: Generate Friendly Message**
- System SHALL use AWS Bedrock to generate farmer-friendly messages
- System SHALL use Amazon Nova Lite model
- Message SHALL be in simple, natural language
- Message SHALL explain weather conditions and recommendations
- Message SHALL be 2-4 sentences long

**FR-009: Fallback Messages**
- System SHALL provide fallback messages if Bedrock fails
- Fallback for safe conditions: "Weather conditions are good for spraying. You can proceed with your farm work safely."
- Fallback for unsafe conditions: "Not recommended to spray right now. [reasons]. Please wait for better conditions."

### 2.4 API Interface

**FR-010: REST API Endpoint**
- System SHALL expose POST /weather/advisory endpoint
- System SHALL accept JSON request body
- System SHALL return JSON response
- System SHALL support CORS for web/mobile apps

**FR-011: Request Validation**
- System SHALL validate latitude (-90 to 90)
- System SHALL validate longitude (-180 to 180)
- System SHALL return 400 error for invalid parameters
- System SHALL return 400 error for missing required fields

**FR-012: Response Format**
- System SHALL return standardized JSON response
- Response SHALL include all weather parameters
- Response SHALL include advisory object
- Response SHALL include friendly_message
- Response SHALL include timestamp

---

## 3. Non-Functional Requirements

### 3.1 Performance

**NFR-001: Response Time**
- API response time SHALL be < 2 seconds (95th percentile)
- Weather API call SHALL timeout after 5 seconds
- Bedrock call SHALL timeout after 10 seconds
- Total Lambda execution SHALL be < 15 seconds

**NFR-002: Throughput**
- System SHALL handle 100 requests per second
- System SHALL auto-scale based on demand
- System SHALL support concurrent executions

**NFR-003: Caching**
- Weather data SHOULD be cached for 10-15 minutes
- Cache key SHALL be based on location (lat/lon)
- Stale cache SHALL be discarded

### 3.2 Reliability

**NFR-004: Availability**
- System SHALL have 99.9% uptime
- System SHALL handle partial failures gracefully
- System SHALL provide meaningful error messages

**NFR-005: Error Handling**
- System SHALL catch all exceptions
- System SHALL log errors to CloudWatch
- System SHALL return appropriate HTTP status codes
- System SHALL not expose internal errors to users

**NFR-006: Fault Tolerance**
- System SHALL continue with fallback if Bedrock fails
- System SHALL retry weather API calls once
- System SHALL handle network timeouts

### 3.3 Security

**NFR-007: Data Security**
- API SHALL use HTTPS only
- API keys SHALL be stored in environment variables
- API keys SHALL NOT be exposed in responses
- System SHALL not store user data

**NFR-008: API Security**
- API Gateway SHALL enforce HTTPS
- System SHALL validate all inputs
- System SHALL sanitize error messages
- System SHALL prevent injection attacks

### 3.4 Scalability

**NFR-009: Auto-Scaling**
- Lambda SHALL auto-scale to 1000 concurrent executions
- API Gateway SHALL handle 10,000 requests/second
- System SHALL scale without manual intervention

**NFR-010: Cost Efficiency**
- System SHALL use serverless architecture
- System SHALL minimize API calls through caching
- System SHALL use cost-effective AI model

### 3.5 Maintainability

**NFR-011: Code Quality**
- Code SHALL follow PEP 8 style guide
- Functions SHALL have docstrings
- Code SHALL be modular and reusable
- Code SHALL have error handling

**NFR-012: Logging**
- System SHALL log all API calls
- System SHALL log errors with stack traces
- Logs SHALL include request/response details
- Logs SHALL be searchable in CloudWatch

**NFR-013: Monitoring**
- System SHALL expose CloudWatch metrics
- System SHALL track invocations, errors, duration
- System SHALL support custom metrics
- Alarms SHOULD be configured for errors

---

## 4. System Architecture

### 4.1 Components

**Component 1: API Gateway**
- Type: AWS API Gateway (HTTP API)
- Purpose: REST API endpoint
- Configuration: CORS enabled, Lambda proxy integration

**Component 2: Lambda Function**
- Runtime: Python 3.11
- Memory: 256 MB
- Timeout: 15 seconds
- Handler: lambda_function.lambda_handler

**Component 3: OpenWeather API**
- Endpoints: /data/2.5/weather, /data/2.5/forecast
- Authentication: API key
- Rate limit: 1000 calls/day (free tier)

**Component 4: AWS Bedrock**
- Model: Amazon Nova Lite (apac.amazon.nova-lite-v1:0)
- Purpose: Generate friendly messages
- Configuration: max_tokens=200, temperature=0.7

**Component 5: CloudWatch**
- Purpose: Logging and monitoring
- Log group: /aws/lambda/weather-advisory
- Retention: 7 days

### 4.2 Data Flow

```
1. Client → API Gateway (HTTPS POST)
2. API Gateway → Lambda (Invoke)
3. Lambda → OpenWeather API (HTTP GET × 2)
4. Lambda → Safety Rule Engine (Process)
5. Lambda → Bedrock (HTTP POST)
6. Lambda → API Gateway (Response)
7. API Gateway → Client (JSON)
```

### 4.3 Deployment

**Infrastructure:**
- CloudFormation template
- IAM roles and policies
- Lambda function
- API Gateway configuration

**Deployment Process:**
1. Package Lambda code (zip)
2. Deploy CloudFormation stack
3. Update Lambda code
4. Test API endpoint

---

## 5. Data Models

### 5.1 Request Schema

```json
{
  "lat": number,      // Required, -90 to 90
  "lon": number,      // Required, -180 to 180
  "activity": string  // Optional, default: "spraying"
}
```

### 5.2 Response Schema

```json
{
  "location": string,                    // "Lat: X, Lon: Y"
  "timestamp": string,                   // ISO 8601 UTC
  "rain_probability_next_6h": number,    // 0-100
  "wind_speed": number,                  // km/h
  "humidity": number,                    // 0-100
  "temperature": number,                 // Celsius
  "uv_index": number,                    // 0-11+
  "advisory": {
    "spray_safe": boolean,               // true/false
    "messages": [string]                 // Array of messages
  },
  "friendly_message": string             // AI-generated text
}
```

### 5.3 Error Schema

```json
{
  "error": string  // Error description
}
```

---

## 6. API Specifications

### 6.1 Endpoint

**URL:** `POST /weather/advisory`

**Base URL:** `https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod`

**Content-Type:** `application/json`

**Authentication:** None

### 6.2 Status Codes

| Code | Description | Scenario |
|------|-------------|----------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Missing/invalid parameters |
| 500 | Internal Server Error | Server error, API failure |

### 6.3 Rate Limiting

- No rate limiting currently enforced
- Recommended: 1 request per 10 minutes per location
- Future: May implement rate limiting

---

## 7. Safety Rules Specification

### 7.1 Rule Priority

1. **Critical Rules** (Block spraying)
   - Rain probability > 60%
   - Wind speed > 15 km/h

2. **Warning Rules** (Advise caution)
   - Humidity > 80%
   - UV index > 8

### 7.2 Rule Logic

```python
spray_safe = True

# Critical checks
if rain_probability > 60:
    spray_safe = False
    messages.append("Rain expected in next 6 hours")

if wind_speed > 15:
    spray_safe = False
    messages.append("High wind speed - spray drift risk")

# Warning checks (don't block)
if humidity > 80:
    messages.append("High humidity - increased fungus risk")

if uv_index > 8:
    messages.append("High UV - avoid mid-day spraying")

# Default message
if spray_safe and not messages:
    messages.append("Conditions favorable for spraying")
```

### 7.3 Rule Justification

**Rain > 60%:**
- Rain washes away pesticides
- Reduces effectiveness
- Wastes money and chemicals

**Wind > 15 km/h:**
- Causes spray drift
- Affects neighboring crops
- Reduces coverage

**Humidity > 80%:**
- Promotes fungal growth
- Affects drying time
- May cause crop disease

**UV > 8:**
- Degrades some pesticides
- Health risk for farmer
- Reduces effectiveness

---

## 8. AI Integration Specification

### 8.1 Bedrock Configuration

**Model:** Amazon Nova Lite  
**Model ID:** `apac.amazon.nova-lite-v1:0`  
**Region:** ap-south-1

**Request Format:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": [{"text": "prompt"}]
    }
  ],
  "inferenceConfig": {
    "max_new_tokens": 200,
    "temperature": 0.7
  }
}
```

**Response Format:**
```json
{
  "output": {
    "message": {
      "content": [
        {"text": "generated message"}
      ]
    }
  }
}
```

### 8.2 Prompt Template

```
You are an agricultural advisor helping Indian farmers. Based on the weather conditions, provide a friendly, simple advisory message in 2-3 sentences.

Weather Conditions:
- Rain probability (next 6 hours): {rain_probability}%
- Wind speed: {wind_speed} km/h
- Humidity: {humidity}%
- Temperature: {temperature}°C
- UV Index: {uv_index}

Spray Safety: {safe/not safe}
Technical Messages: {messages}

Write a friendly message for the farmer in simple language. If spraying is not safe, explain why and suggest when to spray. If safe, encourage them and mention any precautions.
```

### 8.3 Fallback Strategy

**Trigger:** Bedrock API failure, timeout, or error

**Fallback Logic:**
```python
if spray_safe:
    return "Weather conditions are good for spraying. You can proceed with your farm work safely."
else:
    return f"Not recommended to spray right now. {' '.join(messages)}. Please wait for better conditions."
```

---

## 9. Testing Requirements

### 9.1 Unit Tests

- Test weather data parsing
- Test safety rule logic
- Test error handling
- Test input validation

### 9.2 Integration Tests

- Test OpenWeather API integration
- Test Bedrock integration
- Test API Gateway integration
- Test end-to-end flow

### 9.3 Performance Tests

- Load test: 100 requests/second
- Stress test: 500 requests/second
- Response time: < 2 seconds
- Concurrent users: 1000

### 9.4 Test Cases

**TC-001: Valid Request**
- Input: Valid lat/lon
- Expected: 200 OK with advisory

**TC-002: Missing Parameters**
- Input: Missing lat or lon
- Expected: 400 Bad Request

**TC-003: Invalid Coordinates**
- Input: lat > 90 or lon > 180
- Expected: 400 Bad Request

**TC-004: Rain Condition**
- Input: Location with rain forecast
- Expected: spray_safe = false

**TC-005: High Wind**
- Input: Location with high wind
- Expected: spray_safe = false

**TC-006: Favorable Conditions**
- Input: Location with good weather
- Expected: spray_safe = true

---

## 10. Deployment Specification

### 10.1 Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| OPENWEATHER_API_KEY | YOUR_OPENWEATHER_API_KEY | OpenWeather authentication |
| AWS_REGION | Auto-provided | AWS region for Bedrock |

### 10.2 IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/*",
        "arn:aws:bedrock:*:*:inference-profile/*"
      ]
    }
  ]
}
```

### 10.3 CloudFormation Resources

1. IAM Role: `WeatherAdvisoryLambdaRole`
2. Lambda Function: `WeatherAdvisoryFunction`
3. API Gateway: `WeatherAdvisoryAPI`
4. API Integration: `APIIntegration`
5. API Route: `APIRoute`
6. API Stage: `APIStage`
7. Lambda Permission: `APIInvokePermission`

---

## 11. Monitoring & Alerting

### 11.1 Metrics

**Lambda Metrics:**
- Invocations
- Errors
- Duration
- Throttles
- Concurrent executions

**API Gateway Metrics:**
- Request count
- 4XX errors
- 5XX errors
- Latency
- Integration latency

### 11.2 Alarms (Recommended)

```yaml
- Name: HighErrorRate
  Metric: Lambda Errors
  Threshold: > 5% in 5 minutes
  Action: SNS notification

- Name: HighLatency
  Metric: Lambda Duration
  Threshold: > 10 seconds
  Action: SNS notification

- Name: APIErrors
  Metric: API Gateway 5XX
  Threshold: > 10 in 5 minutes
  Action: SNS notification
```

### 11.3 Logging

**Log Level:** INFO

**Log Format:**
```
[TIMESTAMP] [LEVEL] [MESSAGE]
```

**Log Events:**
- Request received
- Weather API call
- Bedrock call
- Response sent
- Errors with stack trace

---

## 12. Constraints & Assumptions

### 12.1 Constraints

- OpenWeather free tier: 1000 calls/day
- Lambda timeout: 15 seconds max
- API Gateway payload: 10 MB max
- Bedrock token limit: 200 tokens output

### 12.2 Assumptions

- Users have internet connectivity
- GPS coordinates are accurate
- Weather data is updated every 10 minutes
- Farmers understand basic weather terms
- Mobile apps handle errors gracefully

---

## 13. Future Enhancements

### 13.1 Phase 2 (Q2 2026)

- Multi-language support (Hindi, Tamil, Telugu)
- Historical weather data storage
- Trend analysis and predictions
- Push notifications for weather changes

### 13.2 Phase 3 (Q3 2026)

- User authentication
- Personalized recommendations
- Crop-specific advice
- Integration with IoT sensors

### 13.3 Phase 4 (Q4 2026)

- Machine learning for predictions
- Satellite imagery integration
- Pest outbreak predictions
- Yield optimization recommendations

---

## 14. Compliance & Standards

### 14.1 Data Privacy

- No personal data collected
- No user tracking
- No data storage
- GDPR compliant (no EU data)

### 14.2 API Standards

- RESTful API design
- JSON format
- HTTP status codes
- CORS support

### 14.3 Code Standards

- PEP 8 (Python)
- Docstrings for all functions
- Error handling
- Logging

---

## 15. Glossary

| Term | Definition |
|------|------------|
| Spray Safe | Conditions are favorable for pesticide spraying |
| Rain Probability | Chance of rain in percentage (0-100%) |
| Wind Speed | Speed of wind in kilometers per hour |
| UV Index | Measure of ultraviolet radiation (0-11+) |
| Spray Drift | Movement of pesticide spray away from target area |
| Fungus Risk | Likelihood of fungal growth on crops |

---

## 16. References

- OpenWeather API: https://openweathermap.org/api
- AWS Bedrock: https://aws.amazon.com/bedrock/
- AWS Lambda: https://aws.amazon.com/lambda/
- API Gateway: https://aws.amazon.com/api-gateway/

---

## 17. Approval

**Prepared By:** Development Team  
**Date:** March 2026  
**Version:** 1.0.0  
**Status:** Approved for Production

---

## 18. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | March 2026 | Dev Team | Initial release |
