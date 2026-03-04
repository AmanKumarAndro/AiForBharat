# System Architecture

## AI Agri Weather Intelligence Module

---

## Overview

The Weather Advisory system is a serverless application built on AWS that provides real-time weather intelligence for agricultural decision-making, specifically focused on pesticide spray safety.

---

## Architecture Diagram

```
┌─────────────┐
│   Farmer    │
│  Mobile App │
└──────┬──────┘
       │ HTTPS POST
       ▼
┌─────────────────────┐
│   API Gateway       │
│  (REST API)         │
└──────┬──────────────┘
       │ Invoke
       ▼
┌─────────────────────┐
│   Lambda Function   │
│  (Python 3.11)      │
│                     │
│  ┌───────────────┐  │
│  │ Weather Fetch │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼───────┐  │
│  │ Safety Rules  │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼───────┐  │
│  │ AI Advisory   │  │
│  └───────────────┘  │
└──────┬──────┬───────┘
       │      │
       │      └──────────────┐
       │                     │
       ▼                     ▼
┌──────────────┐      ┌─────────────┐
│ OpenWeather  │      │   Bedrock   │
│     API      │      │ Nova Lite   │
└──────────────┘      └─────────────┘
```

---

## Components

### 1. API Gateway

**Type:** HTTP API (API Gateway v2)

**Configuration:**
- Protocol: HTTPS
- CORS: Enabled for all origins
- Route: `POST /weather/advisory`
- Integration: Lambda Proxy

**Endpoint:**
```
https://uz6r2xavh5.execute-api.ap-south-1.amazonaws.com/prod/weather/advisory
```

**Features:**
- Automatic request/response transformation
- Built-in throttling and rate limiting
- CloudWatch logging
- Request validation

---

### 2. Lambda Function

**Name:** `weather-advisory`

**Runtime:** Python 3.11

**Configuration:**
- Memory: 256 MB
- Timeout: 15 seconds
- Handler: `lambda_function.lambda_handler`

**Environment Variables:**
- `OPENWEATHER_API_KEY`: OpenWeather API key
- `AWS_REGION`: Auto-provided by Lambda

**IAM Role Permissions:**
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`
- `bedrock:InvokeModel`

**Code Structure:**
```python
lambda_handler()           # Main entry point
├── fetch_weather()        # Get weather data from OpenWeather
├── generate_advisory()    # Apply safety rules
└── generate_friendly_advisory()  # AI message generation
```

---

### 3. OpenWeather API Integration

**API Used:** 
- Current Weather API: `/data/2.5/weather`
- Forecast API: `/data/2.5/forecast`

**Data Retrieved:**
- Temperature (°C)
- Humidity (%)
- Wind speed (m/s → km/h)
- Rain probability (%)
- UV index

**Caching:** 10-15 minutes (recommended)

**Error Handling:**
- HTTP 401: Invalid API key
- HTTP 404: Location not found
- Timeout: 5 seconds
- Fallback: Return error response

---

### 4. AWS Bedrock Integration

**Model:** Amazon Nova Lite (APAC inference profile)

**Model ID:** `apac.amazon.nova-lite-v1:0`

**Configuration:**
- Max tokens: 200
- Temperature: 0.7
- Timeout: 10 seconds

**Input:** Weather data + safety assessment

**Output:** Farmer-friendly advisory message in natural language

**Fallback:** If Bedrock fails, use predefined messages

---

## Data Flow

### Request Flow

1. **Client Request**
   ```
   POST /weather/advisory
   Body: {"lat": 28.4595, "lon": 77.0266, "activity": "spraying"}
   ```

2. **API Gateway**
   - Validates request format
   - Forwards to Lambda

3. **Lambda Processing**
   
   a. **Weather Fetch** (300-500ms)
   - Call OpenWeather current weather API
   - Call OpenWeather forecast API
   - Transform data to unified format
   
   b. **Safety Analysis** (<10ms)
   - Check rain probability (> 60%)
   - Check wind speed (> 15 km/h)
   - Check humidity (> 80%)
   - Check UV index (> 8)
   - Determine spray_safe status
   
   c. **AI Message Generation** (200-400ms)
   - Prepare prompt with weather context
   - Call Bedrock Nova Lite
   - Parse AI response
   - Apply fallback if needed

4. **Response**
   ```json
   {
     "location": "...",
     "rain_probability_next_6h": 0,
     "wind_speed": 6.6,
     "advisory": {...},
     "friendly_message": "..."
   }
   ```

**Total Response Time:** < 2 seconds

---

## Infrastructure as Code

### CloudFormation Stack

**Stack Name:** `weather-advisory-stack`

**Resources Created:**
1. IAM Role (`WeatherAdvisoryLambdaRole`)
2. Lambda Function (`WeatherAdvisoryFunction`)
3. API Gateway (`WeatherAdvisoryAPI`)
4. API Integration (`APIIntegration`)
5. API Route (`APIRoute`)
6. API Stage (`APIStage`)
7. Lambda Permission (`APIInvokePermission`)

**Deployment:**
```bash
aws cloudformation deploy \
  --template-file cloudformation_template.yaml \
  --stack-name weather-advisory-stack \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-south-1
```

---

## Security

### Authentication & Authorization

**API Gateway:**
- No authentication (public API)
- CORS enabled for web/mobile apps
- Rate limiting via AWS throttling

**Lambda IAM Role:**
- Least privilege principle
- Only required permissions granted
- No hardcoded credentials

### Data Security

**In Transit:**
- HTTPS only (TLS 1.2+)
- API Gateway enforces encryption

**At Rest:**
- No data storage (stateless)
- CloudWatch logs encrypted

**API Keys:**
- OpenWeather key in environment variables
- Not exposed in responses
- Rotatable without code changes

---

## Scalability

### Auto-Scaling

**Lambda:**
- Concurrent executions: 1000 (default)
- Auto-scales based on demand
- Cold start: ~400ms
- Warm execution: ~500ms

**API Gateway:**
- Handles 10,000 requests/second
- Automatic scaling
- No manual intervention needed

### Performance Optimization

**Caching Strategy:**
- Weather data: Cache for 10-15 minutes
- Same location requests: Serve from cache
- Reduces API calls to OpenWeather

**Connection Pooling:**
- Reuse HTTP connections
- Reduce latency

---

## Monitoring & Logging

### CloudWatch Logs

**Log Group:** `/aws/lambda/weather-advisory`

**Log Events:**
- Request/response details
- Weather API calls
- Bedrock invocations
- Error traces

**Retention:** 7 days (configurable)

### Metrics

**Lambda Metrics:**
- Invocations
- Duration
- Errors
- Throttles
- Concurrent executions

**API Gateway Metrics:**
- Request count
- Latency
- 4XX/5XX errors
- Integration latency

### Alarms (Recommended)

```yaml
- Lambda errors > 5% in 5 minutes
- API Gateway 5XX > 10 in 5 minutes
- Lambda duration > 10 seconds
- API Gateway latency > 3 seconds
```

---

## Disaster Recovery

### Backup Strategy

**Code:**
- Version controlled in Git
- Lambda versions enabled
- CloudFormation template in repository

**Configuration:**
- Infrastructure as Code (CloudFormation)
- Environment variables documented
- IAM policies in version control

### Recovery Procedures

**Lambda Failure:**
1. Check CloudWatch logs
2. Rollback to previous version
3. Redeploy if needed

**API Gateway Failure:**
1. Check API Gateway logs
2. Verify Lambda integration
3. Redeploy stack if needed

**External API Failure:**
- OpenWeather: Return cached data or error
- Bedrock: Use fallback messages

**RTO (Recovery Time Objective):** < 15 minutes

**RPO (Recovery Point Objective):** 0 (stateless)

---

## Cost Estimation

### Monthly Cost (1000 requests/day)

**Lambda:**
- Requests: 30,000 × $0.20/1M = $0.006
- Duration: 30,000 × 0.5s × $0.0000166667 = $0.25
- Total: ~$0.26/month

**API Gateway:**
- Requests: 30,000 × $1.00/1M = $0.03
- Total: ~$0.03/month

**Bedrock:**
- Input tokens: 30,000 × 300 × $0.0003/1K = $2.70
- Output tokens: 30,000 × 100 × $0.0012/1K = $3.60
- Total: ~$6.30/month

**OpenWeather:**
- Free tier: 1,000 calls/day
- Total: $0/month (within free tier)

**Total Monthly Cost:** ~$6.60

---

## Deployment Regions

**Primary:** ap-south-1 (Mumbai, India)

**Rationale:**
- Closest to target users (Indian farmers)
- Bedrock available
- Low latency

**Multi-Region (Future):**
- ap-southeast-1 (Singapore) - Backup
- us-east-1 (N. Virginia) - Global access

---

## Technology Choices

### Why Lambda?

- Serverless (no server management)
- Auto-scaling
- Pay per use
- Fast deployment

### Why API Gateway?

- Managed service
- Built-in CORS
- Request validation
- CloudWatch integration

### Why Bedrock Nova Lite?

- Fast inference (~200ms)
- Cost-effective
- Good quality for simple messages
- No model management

### Why OpenWeather?

- Reliable weather data
- Free tier available
- Good coverage in India
- Simple API

---

## Future Enhancements

1. **Caching Layer**
   - Add DynamoDB for weather cache
   - Reduce OpenWeather API calls
   - Improve response time

2. **Multi-Language Support**
   - Hindi, Tamil, Telugu messages
   - Language detection from request

3. **Historical Data**
   - Store past advisories
   - Trend analysis
   - Predictive recommendations

4. **Push Notifications**
   - SNS integration
   - Alert farmers of weather changes

5. **Advanced Analytics**
   - Track spray decisions
   - Measure impact
   - Optimize recommendations

---

## Version History

**v1.0.0** (March 2026)
- Initial release
- OpenWeather integration
- Bedrock Nova Lite integration
- Basic safety rules
- CloudFormation deployment
