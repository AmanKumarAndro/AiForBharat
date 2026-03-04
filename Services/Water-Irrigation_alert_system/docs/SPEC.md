# KisanVoice Technical Specification

**System Design & Implementation Details**

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FARMER INTERACTION                        │
│  Registration → Daily Alerts → Weather Warnings → Dashboard │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY (HTTPS)                     │
│  /irrigation/register  |  /irrigation/dashboard/{id}        │
│  /irrigation/alerts/*  |  /irrigation/crop-calendar/*       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LAMBDA FUNCTIONS                          │
│  • register-farmer-irrigation  • daily-intelligence          │
│  • weather-alert-check         • get-dashboard               │
│  • get-alerts-by-phone         • delete-alert                │
│  • unregister-farmer           • get-crop-calendar           │
│  • weekly-summary              • retry-alert                 │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│      DYNAMODB TABLES     │  │   EXTERNAL SERVICES      │
│  • farmers               │  │  • Twilio (SMS)          │
│  • soil-state            │  │  • OpenWeatherMap        │
│  • sms-log               │  │  • AWS Secrets Manager   │
│  • savings               │  └──────────────────────────┘
│  • monsoon-calendar      │
│  • crop-data             │
└──────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────┐
│                    EVENTBRIDGE SCHEDULER                      │
│  • Per-farmer daily rules (17:00 IST)                        │
│  • Weather check (every 3 hours)                             │
│  • Weekly summary (Sunday 8 AM IST)                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Models

### 1. Farmers Table

**Table Name:** `kisanvoice-irrigation-{stage}-farmers`

**Schema:**
```javascript
{
  pk: "farmer#<uuid>",           // Partition key
  sk: "profile",                 // Sort key
  phone: "+919876543210",        // GSI partition key
  name: "Ramesh Kumar",
  district: "Karnal",
  state: "Haryana",
  lat: 29.6857,                  // Optional GPS
  lon: 76.9905,                  // Optional GPS
  crop: "wheat",
  cropStage: "flowering",
  sowingDate: "2026-01-15",
  areaAcres: 5.0,
  irrMethod: "flood",            // flood, drip, sprinkler
  language: "hi",                // hi, en
  alertTime: "17:00",            // IST
  active: true,
  createdAt: "2026-02-28T12:00:00.000Z",
  updatedAt: "2026-02-28T12:00:00.000Z"
}
```

**Indexes:**
- Primary: pk (HASH) + sk (RANGE)
- GSI: phone-index (phone as HASH)

### 2. Soil State Table

**Table Name:** `kisanvoice-irrigation-{stage}-soil-state`

**Schema:**
```javascript
{
  pk: "farmer#<uuid>",
  sk: "state",
  soilMoistureMm: 45,            // Current moisture in mm
  fieldCapacityMm: 80,           // Maximum capacity
  lastRainfallMm: 0,             // Yesterday's rainfall
  lastDecision: "irrigate",      // Last alert decision
  lastDecisionDate: "2026-02-28",
  consecutiveDryDays: 3,
  daysSinceSowing: 44,
  currentStage: "Crown Root",
  updatedAt: "2026-02-28T12:44:15.992Z"
}
```

### 3. SMS Log Table

**Table Name:** `kisanvoice-irrigation-{stage}-sms-log`

**Schema:**
```javascript
{
  pk: "farmer#<uuid>",
  sk: "sms#<timestamp>",         // ISO 8601 timestamp
  messageType: "irrigate",       // irrigate, skip, recovery, weather_*, etc.
  messageBody: "Full SMS text",
  deliveryStatus: "delivered",   // sent, delivered, failed
  twilioSid: "SM...",
  createdAt: "2026-02-28T12:49:06.911Z"
}
```

**Message Types:**
- Irrigation: `irrigate`, `skip`, `recovery`, `critical_monsoon`, `reassurance`
- Weather: `weather_heatwave`, `weather_frost`, `weather_storm`, `weather_heavyRain`, `weather_highWind`, `weather_drought`
- System: `confirm`, `weekly`

### 4. Savings Table

**Table Name:** `kisanvoice-irrigation-{stage}-savings`

**Schema:**
```javascript
{
  pk: "farmer#<uuid>",
  sk: "saving#<date>",           // YYYY-MM-DD
  litresSaved: 24000,
  moneySavedRs: 1440,
  co2SavedKg: 7.2,
  decision: "skip",              // irrigate or skip
  reason: "Rain expected",
  createdAt: "2026-02-28T12:00:00.000Z"
}
```

### 5. Monsoon Calendar Table

**Table Name:** `kisanvoice-irrigation-{stage}-monsoon-calendar`

**Schema:**
```javascript
{
  pk: "district#Karnal",
  sk: "monsoon",
  monsoonStart: "2026-06-15",
  monsoonEnd: "2026-09-30",
  avgRainfall: 650,              // mm
  peakMonth: "July"
}
```

### 6. Crop Data Table

**Table Name:** `kisanvoice-irrigation-{stage}-crop-data`

**Schema:**
```javascript
{
  pk: "crop#wheat",
  sk: "stage#Crown Root",
  startDay: 21,
  endDay: 40,
  kc: 0.7,                       // Crop coefficient
  stressThreshold: 44,           // mm
  description: "Crown root initiation",
  activities: ["Monitor growth", "Apply nitrogen"],
  irrigationFrequency: "7-10 days"
}
```

---

## Algorithms

### 1. Soil Water Balance (FAO-56)

**Purpose:** Calculate daily soil moisture and irrigation need

**Steps:**

```javascript
// 1. Calculate ET₀ (Reference Evapotranspiration) - Hargreaves Method
function calculateET0(tMin, tMax, lat, dayOfYear) {
  const tMean = (tMin + tMax) / 2;
  const ra = calculateExtraterrestrialRadiation(lat, dayOfYear);
  const et0 = 0.0023 * (tMean + 17.8) * Math.pow(tMax - tMin, 0.5) * ra;
  return et0; // mm/day
}

// 2. Calculate ETc (Crop Evapotranspiration)
function calculateETc(et0, kc) {
  return et0 * kc; // mm/day
}

// 3. Update Soil Moisture
function updateSoilMoisture(currentMoisture, rainfall, etc, fieldCapacity) {
  let newMoisture = currentMoisture + rainfall - etc;
  newMoisture = Math.max(0, Math.min(newMoisture, fieldCapacity));
  return newMoisture; // mm
}

// 4. Calculate Deficit
function calculateDeficit(fieldCapacity, currentMoisture) {
  return fieldCapacity - currentMoisture; // mm
}
```

**Inputs:**
- Weather data (temperature, rainfall)
- Crop coefficient (Kc) from crop-data table
- Current soil moisture from soil-state table
- Field capacity (default: 80mm)

**Outputs:**
- Updated soil moisture (mm)
- Deficit (mm)
- Irrigation recommendation

### 2. Decision Tree

**Purpose:** Determine if irrigation alert should be sent

```javascript
function makeIrrigationDecision(soilState, weather, cropData, monsoonData) {
  const { soilMoistureMm, lastDecision, consecutiveDryDays } = soilState;
  const { rain48hr, rainProbability, currentTemp } = weather;
  const { stressThreshold } = cropData;
  const { monsoonActive, criticalStage } = monsoonData;
  
  const deficit = 80 - soilMoistureMm;
  
  // Recovery check
  if (lastDecision === 'skip' && rain48hr < 2) {
    return {
      decision: 'recovery',
      reason: 'Predicted rain did not arrive'
    };
  }
  
  // Deficit check
  if (deficit > stressThreshold) {
    // Check if rain is coming
    if (rain48hr >= 5 || rainProbability >= 0.70) {
      return {
        decision: 'skip',
        reason: `Rain expected: ${rain48hr}mm`
      };
    }
    
    return {
      decision: 'irrigate',
      reason: `Deficit ${deficit}mm exceeds threshold ${stressThreshold}mm`
    };
  }
  
  // Monsoon dry spell check
  if (monsoonActive && consecutiveDryDays >= 5 && criticalStage) {
    return {
      decision: 'critical_monsoon',
      reason: `${consecutiveDryDays} days without rain during critical stage`
    };
  }
  
  // Weekly reassurance
  if (daysSinceLastSMS >= 7) {
    return {
      decision: 'reassurance',
      reason: 'Weekly status update'
    };
  }
  
  return {
    decision: 'none',
    reason: 'Soil moisture adequate'
  };
}
```

### 3. Weather Alert Detection

**Purpose:** Identify critical weather conditions

```javascript
function checkWeatherAlerts(weather, location) {
  const alerts = [];
  const { temp, windSpeed, rain48hr, description, consecutiveDryDays } = weather;
  
  // Heatwave
  if (temp > 40) {
    alerts.push({
      type: 'weather_heatwave',
      severity: temp > 45 ? 'critical' : 'high',
      message: `Temperature: ${temp}°C`
    });
  }
  
  // Frost
  if (temp < 5) {
    alerts.push({
      type: 'weather_frost',
      severity: temp < 0 ? 'critical' : 'high',
      message: `Temperature: ${temp}°C`
    });
  }
  
  // Thunderstorm
  if (description.toLowerCase().includes('thunderstorm')) {
    alerts.push({
      type: 'weather_storm',
      severity: 'high',
      message: 'Thunderstorm detected'
    });
  }
  
  // Heavy rain
  if (rain48hr > 50) {
    alerts.push({
      type: 'weather_heavyRain',
      severity: 'medium',
      message: `Heavy rain forecast: ${rain48hr}mm`
    });
  }
  
  // High wind
  if (windSpeed > 40) {
    alerts.push({
      type: 'weather_highWind',
      severity: windSpeed > 60 ? 'high' : 'medium',
      message: `Wind speed: ${windSpeed} km/h`
    });
  }
  
  // Drought
  if (consecutiveDryDays >= 10) {
    alerts.push({
      type: 'weather_drought',
      severity: consecutiveDryDays >= 15 ? 'critical' : 'high',
      message: `${consecutiveDryDays} days without rain`
    });
  }
  
  return alerts;
}
```

---

## API Specifications

### 1. Register Farmer

**Endpoint:** `POST /irrigation/register`

**Request:**
```json
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

**Response:**
```json
{
  "farmerId": "91761321-ff4a-4dd8-9e5c-b3c0a0f8103d",
  "message": "Registration successful",
  "firstAlertDate": "2026-03-01"
}
```

**Process:**
1. Validate input
2. Generate farmerId (UUID)
3. Resolve coordinates (GPS or district lookup)
4. Initialize soil state (50mm default)
5. Create DynamoDB records
6. Create EventBridge rule
7. Send confirmation SMS
8. Return response

### 2. Daily Intelligence

**Trigger:** EventBridge rule (per farmer, daily at alertTime)

**Process:**
1. Fetch farmer profile
2. Fetch soil state
3. Fetch weather data (current + forecast)
4. Fetch crop data (current stage)
5. Check monsoon calendar
6. Calculate ET₀ and ETc
7. Update soil moisture
8. Run decision tree
9. Send SMS if needed
10. Update soil state
11. Log SMS
12. Record savings

**Execution Time:** ~2-3 seconds per farmer

### 3. Weather Alert Check

**Trigger:** EventBridge cron (every 3 hours)

**Process:**
1. Scan all active farmers
2. For each farmer:
   - Fetch weather data (GPS or district)
   - Check for critical conditions
   - Check last alert time (throttle: 6 hours)
   - Send alert if needed
   - Update last alert time
3. Log results

**Execution Time:** ~30-60 seconds for 1,000 farmers

---

## SMS Templates

### Irrigation Alert (Hindi)

```
[KisanVoice] 🌾 सिंचाई सलाह
{name} जी, {crop}
कल सुबह 6-8 बजे सिंचाई करें

मौसम: {temp}°C, {condition}
मिट्टी: {moisture}% नमी
बारिश: {rain}mm (अगले 2 दिन)

पानी बचत: {liters}L
STOP भेजें रोकने के लिए
```

### Weather Alert (Hindi)

```
[KisanVoice] ⚠️ {alertType} चेतावनी
{crop} खतरे में! {condition}

{action1}
{action2}
{action3}

STOP भेजें
```

### Weekly Summary (Hindi)

```
[KisanVoice] 📊 साप्ताहिक रिपोर्ट
{name} जी, {crop}

पिछले 7 दिन:
✅ सिंचाई: {count} बार
💧 पानी बचाया: {liters}L
💰 पैसे बचाए: ₹{money}

सीजन कुल: {seasonTotal}L बचाए
बढ़िया काम! 🎉
```

---

## Scheduling

### EventBridge Rules

**1. Per-Farmer Daily Rule**
```yaml
Name: irrigation-{farmerId}
Schedule: cron({minute} {hour} * * ? *)  # Farmer's alertTime in UTC
Target: daily-intelligence Lambda
Input: {"farmerId": "{farmerId}"}
State: ENABLED
```

**2. Weather Alert Check**
```yaml
Name: weather-alert-check
Schedule: cron(0 */3 * * ? *)  # Every 3 hours
Target: weather-alert-check Lambda
State: ENABLED
```

**3. Weekly Summary**
```yaml
Name: weekly-summary
Schedule: cron(30 2 ? * SUN *)  # Sunday 8 AM IST (2:30 AM UTC)
Target: weekly-summary Lambda
State: ENABLED
```

---

## Error Handling

### Lambda Error Handling

```javascript
try {
  // Main logic
  const result = await processIrrigation(farmerId);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
} catch (error) {
  console.error('Error:', error);
  
  // Send to DLQ for retry
  if (error.retryable) {
    throw error;  // Lambda will send to DLQ
  }
  
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Internal server error',
      message: error.message
    })
  };
}
```

### Dead Letter Queue (DLQ)

**Purpose:** Retry failed SMS alerts

**Configuration:**
- Queue: SQS
- Retention: 14 days
- Visibility timeout: 300 seconds
- Max receive count: 3

**Retry Logic:**
```javascript
async function retryAlert(event) {
  for (const record of event.Records) {
    const { farmerId, messageType, attempt } = JSON.parse(record.body);
    
    if (attempt >= 3) {
      console.error('Max retries exceeded:', farmerId);
      continue;
    }
    
    try {
      await sendSMS(farmerId, messageType);
      console.log('Retry successful:', farmerId);
    } catch (error) {
      console.error('Retry failed:', error);
      // Will be retried again by SQS
    }
  }
}
```

---

## Performance Optimization

### 1. DynamoDB Optimization

**Batch Operations:**
```javascript
// Batch get items
const params = {
  RequestItems: {
    [FARMERS_TABLE]: {
      Keys: farmerIds.map(id => ({ pk: `farmer#${id}`, sk: 'profile' }))
    }
  }
};
const result = await dynamodb.batchGet(params).promise();
```

**Parallel Queries:**
```javascript
const [farmer, soilState, cropData] = await Promise.all([
  getFarmer(farmerId),
  getSoilState(farmerId),
  getCropData(crop, stage)
]);
```

### 2. API Caching

**Weather Data:**
- Cache duration: 30 minutes
- Key: `weather:{lat}:{lon}:{timestamp}`
- Storage: In-memory (Lambda)

**Crop Data:**
- Cache duration: 24 hours
- Key: `crop:{crop}:{stage}`
- Storage: In-memory (Lambda)

### 3. Lambda Optimization

**Cold Start Reduction:**
- Provisioned concurrency: 5 (for critical functions)
- Memory: 256MB (optimal for Node.js)
- Timeout: Appropriate per function

**Connection Reuse:**
```javascript
// Reuse DynamoDB client
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Reuse HTTP connections
const axios = require('axios');
const axiosInstance = axios.create({
  timeout: 5000,
  keepAlive: true
});
```

---

## Security

### 1. Secrets Management

**Storage:** AWS Secrets Manager

**Access:**
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecrets() {
  const data = await secretsManager.getSecretValue({
    SecretId: 'kisanvoice/prod'
  }).promise();
  
  return JSON.parse(data.SecretString);
}
```

### 2. IAM Policies

**Lambda Execution Role:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/kisanvoice-*"
    },
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:*:*:secret:kisanvoice/prod-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "events:PutRule",
        "events:PutTargets",
        "events:DeleteRule"
      ],
      "Resource": "arn:aws:events:*:*:rule/irrigation-*"
    }
  ]
}
```

### 3. Input Validation

```javascript
function validateRegistration(data) {
  const errors = [];
  
  // Phone validation
  if (!data.phone || !/^\+[1-9]\d{1,14}$/.test(data.phone)) {
    errors.push('Invalid phone number format');
  }
  
  // Crop validation
  const validCrops = ['wheat', 'rice', 'cotton', 'sugarcane', 'maize', 'potato'];
  if (!validCrops.includes(data.crop)) {
    errors.push('Invalid crop type');
  }
  
  // GPS validation
  if (data.lat && (data.lat < -90 || data.lat > 90)) {
    errors.push('Invalid latitude');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
}
```

---

## Monitoring & Logging

### CloudWatch Metrics

**Custom Metrics:**
```javascript
const cloudwatch = new AWS.CloudWatch();

async function publishMetric(metricName, value, unit = 'Count') {
  await cloudwatch.putMetricData({
    Namespace: 'KisanVoice/Irrigation',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  }).promise();
}

// Usage
await publishMetric('IrrigationAlertsSent', 1);
await publishMetric('WaterSaved', 24000, 'None');
```

### Structured Logging

```javascript
function log(level, message, metadata = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata
  }));
}

// Usage
log('INFO', 'Irrigation alert sent', {
  farmerId: '123',
  decision: 'irrigate',
  deficit: 60
});
```

---

**Version:** 1.0.0  
**Last Updated:** March 4, 2026
