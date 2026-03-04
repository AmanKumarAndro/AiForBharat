# Architecture - Smart Irrigation Alert System

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FARMER REGISTRATION                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  API Gateway     │
                    │  POST /register  │
                    └────────┬─────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Lambda: register-farmer     │
              │  • Validate input            │
              │  • Resolve coordinates       │
              │  • Initialize soil state     │
              │  • Create EventBridge rule   │
              │  • Send confirmation SMS     │
              └──────────────┬───────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
            ┌──────────────┐   ┌──────────────┐
            │  DynamoDB    │   │ EventBridge  │
            │  • farmers   │   │  Scheduler   │
            │  • soil-state│   │  (per farmer)│
            └──────────────┘   └──────┬───────┘
                                      │
                                      │ Daily at 17:00 IST
                                      │
┌─────────────────────────────────────────────────────────────────┐
│                   DAILY INTELLIGENCE LOOP                        │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────┐
                    │  Lambda: daily-intelligence  │
                    │  Timeout: 15s | Memory: 256MB│
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌──────────┐   ┌──────────┐   ┌──────────┐
            │DynamoDB  │   │OpenWeather│   │DynamoDB  │
            │Read:     │   │Map API    │   │Read:     │
            │• farmer  │   │• /weather │   │• monsoon │
            │• soil    │   │• /forecast│   │• crop    │
            └────┬─────┘   └─────┬────┘   └────┬─────┘
                 │               │              │
                 └───────────────┼──────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │  Calculation Engine     │
                    │  • ET₀ (Hargreaves)     │
                    │  • ETc = ET₀ × Kc       │
                    │  • Soil moisture update │
                    │  • Deficit calculation  │
                    │  • Monsoon phase check  │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │  Decision Tree          │
                    │  • Recovery?            │
                    │  • Deficit > threshold? │
                    │  • Rain coming?         │
                    │  • Monsoon suppression? │
                    │  • Weekly reassurance?  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │  Twilio  │  │DynamoDB  │  │DynamoDB  │
            │  Send    │  │Write:    │  │Write:    │
            │  SMS     │  │• soil    │  │• sms-log │
            └────┬─────┘  │• savings │  └──────────┘
                 │        └──────────┘
                 │
                 ▼
         ┌──────────────┐
         │ Farmer Phone │
         │  (Any phone) │
         └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INBOUND SMS HANDLING                          │
└─────────────────────────────────────────────────────────────────┘

    Farmer replies "STOP" or "START"
                 │
                 ▼
         ┌──────────────┐
         │    Twilio    │
         │   Webhook    │
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ API Gateway  │
         │ POST /inbound│
         └──────┬───────┘
                │
                ▼
    ┌────────────────────────┐
    │ Lambda: twilio-webhook │
    │ • Parse message        │
    │ • Update farmer status │
    │ • Enable/disable rule  │
    └────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                              │
└─────────────────────────────────────────────────────────────────┘

    Lambda failure (Twilio timeout, etc.)
                 │
                 ▼
         ┌──────────────┐
         │   SQS DLQ    │
         │  (Dead Letter│
         │    Queue)    │
         └──────┬───────┘
                │
                ▼
    ┌────────────────────────┐
    │ Lambda: retry-alert    │
    │ • Retry SMS once       │
    │ • Mark failed if retry │
    │   fails                │
    └────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WEEKLY SUMMARY                                │
└─────────────────────────────────────────────────────────────────┘

    EventBridge: Every Sunday 08:00 IST
                 │
                 ▼
    ┌────────────────────────┐
    │ Lambda: weekly-summary │
    │ • Scan active farmers  │
    │ • Aggregate savings    │
    │ • Send summary SMS     │
    └────────────────────────┘
```

## Data Flow

### 1. Registration Flow
```
User Input → API Gateway → Lambda → DynamoDB (farmers, soil-state)
                                  → EventBridge (create rule)
                                  → Twilio (confirmation SMS)
```

### 2. Daily Intelligence Flow
```
EventBridge Timer → Lambda → [Fetch Data]
                           → [Calculate ET₀/ETc]
                           → [Update Soil Moisture]
                           → [Decision Tree]
                           → [Send SMS if needed]
                           → [Write Results]
```

### 3. SMS Delivery Flow
```
Lambda → Twilio API → SMS Network → Farmer Phone
      ↓
   DynamoDB (sms-log)
      ↓
   Twilio Status Callback → API Gateway → Lambda → Update sms-log
```

## Key Components

### Lambda Functions

| Function | Trigger | Timeout | Memory | Purpose |
|----------|---------|---------|--------|---------|
| register-farmer-irrigation | API Gateway | 30s | 128MB | Farmer onboarding |
| daily-intelligence | EventBridge | 15s | 256MB | Core intelligence loop |
| twilio-webhook | API Gateway | 10s | 128MB | STOP/START handling |
| twilio-status | API Gateway | 10s | 128MB | Delivery status updates |
| retry-alert | SQS | 30s | 128MB | Failed SMS retry |
| weekly-summary | EventBridge | 300s | 256MB | Weekly savings report |

### DynamoDB Tables

| Table | Partition Key | Sort Key | Purpose |
|-------|---------------|----------|---------|
| farmers | pk (farmer#uuid) | sk (profile) | Farmer profiles |
| soil-state | pk (farmer#uuid) | sk (state) | Current soil moisture |
| sms-log | pk (farmer#uuid) | sk (sms#timestamp) | SMS history |
| savings | pk (farmer#uuid) | sk (saving#date) | Water savings log |
| monsoon-calendar | pk (district#name) | sk (monsoon) | Monsoon dates |
| crop-data | pk (crop#name) | sk (stage#name) | Crop coefficients |

### External APIs

| Service | Endpoint | Rate Limit | Cost |
|---------|----------|------------|------|
| OpenWeatherMap | /weather | 1000/day (free) | Free |
| OpenWeatherMap | /forecast | 1000/day (free) | Free |
| Twilio | /Messages | 1000/sec | $0.0079/SMS |

## Calculation Engine

### Soil Water Balance

```
1. Calculate ET₀ (Reference Evapotranspiration)
   ET₀ = 0.0023 × (T_mean + 17.8) × (T_max - T_min)^0.5 × Ra
   
   Where:
   - T_mean = (T_max + T_min) / 2
   - Ra = Extraterrestrial radiation (function of lat, day of year)

2. Calculate ETc (Crop Evapotranspiration)
   ETc = ET₀ × Kc[crop][stage]
   
   Where:
   - Kc = Crop coefficient from FAO-56 (stored in DynamoDB)

3. Update Soil Moisture
   soil_moisture = soil_moisture_yesterday + rainfall - ETc
   soil_moisture = clamp(soil_moisture, 0, field_capacity)
   
   Where:
   - field_capacity = 80mm (default)

4. Calculate Deficit
   deficit = field_capacity - soil_moisture
```

### Decision Tree

```
IF last_decision == 'skip' AND actual_rain < 2mm:
    → RECOVERY alert

ELSE IF deficit > stress_threshold:
    IF rain_48hr >= 5mm OR rain_probability >= 0.70:
        → SKIP alert (save water)
    ELSE:
        → IRRIGATE alert
        
ELSE IF monsoon_active AND dry_days >= 5 AND critical_stage:
    → CRITICAL MONSOON alert
    
ELSE IF days_since_last_sms >= 7:
    → REASSURANCE alert
    
ELSE:
    → NO SMS (soil moisture adequate)
```

## Scalability

### Current Capacity
- **Farmers**: 10,000 per region
- **Lambda concurrency**: 1000 (default)
- **DynamoDB**: Auto-scaling (on-demand)
- **EventBridge**: 300 rules per second
- **Twilio**: 1000 SMS per second

### Scaling Strategy
1. **10K farmers**: Single region, default limits
2. **100K farmers**: Multi-region deployment, increased Lambda concurrency
3. **1M farmers**: Sharded DynamoDB, multiple Twilio accounts, CloudFront for API

### Cost Scaling

| Farmers | AWS/month | Twilio/month | Total/month |
|---------|-----------|--------------|-------------|
| 1,000 | $9 | $237 | $246 |
| 10,000 | $45 | $2,370 | $2,415 |
| 100,000 | $380 | $23,700 | $24,080 |

## Security

### Data Protection
- Secrets in AWS Secrets Manager (encrypted at rest)
- DynamoDB encryption enabled
- API Gateway with API keys
- Lambda IAM roles (least privilege)

### SMS Security
- Phone number validation (E.164 format)
- STOP/START compliance (TRAI regulations)
- Rate limiting on registration endpoint
- Twilio webhook signature verification

## Monitoring

### CloudWatch Metrics
- Lambda invocation count
- Lambda error rate
- Lambda duration
- DynamoDB read/write capacity
- API Gateway 4xx/5xx errors

### CloudWatch Alarms
- Lambda error rate > 5%
- DynamoDB throttling
- SQS DLQ message count > 0
- Twilio API failures

### Logging
- All Lambda functions log to CloudWatch
- Structured JSON logs
- Correlation IDs for tracing
- 7-day retention (dev), 30-day (prod)

## Disaster Recovery

### Backup Strategy
- DynamoDB point-in-time recovery enabled
- Daily snapshots of DynamoDB tables
- Lambda code in version control (Git)
- Infrastructure as code (Serverless Framework)

### Recovery Time Objective (RTO)
- **Target**: 1 hour
- **Process**: Redeploy from Git + restore DynamoDB from snapshot

### Recovery Point Objective (RPO)
- **Target**: 5 minutes
- **Method**: DynamoDB point-in-time recovery
