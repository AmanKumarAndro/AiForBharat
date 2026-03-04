# KisanVoice Project Structure

**Complete folder and file organization guide**

---

## 📁 Root Directory Structure

```
kisanvoice-irrigation/
├── README.md                          # Project overview and quick start
├── serverless.yml                     # AWS infrastructure configuration
├── package.json                       # Node.js dependencies
├── package-lock.json                  # Locked dependency versions
├── jest.config.js                     # Jest testing configuration
├── .env.example                       # Environment variables template
├── .gitignore                         # Git ignore rules
│
├── docs/                              # 📚 Documentation
├── src/                               # 💻 Source code
├── scripts/                           # 🔧 Utility scripts
├── tests/                             # 🧪 Test files
├── .kiro/                             # Kiro IDE configuration
│
├── setup-secrets.sh                   # AWS Secrets Manager setup script
├── test-production-e2e.sh             # End-to-end production tests
├── test-real-scenario.sh              # Real scenario testing
├── cleanup-test-farmers.sh            # Clean up test data
│
└── *.json, *.log, *.txt              # Temporary/output files
```

---

## 📚 Documentation (`docs/`)

```
docs/
├── README.md                          # Documentation index and navigation
├── ARCHITECTURE.md                    # System architecture and design
├── FEATURES.md                        # Feature list and capabilities
├── REQUIREMENTS.md                    # System requirements and setup
├── SPEC.md                            # Technical specifications
├── USER_GUIDE.md                      # User guide (farmers & developers)
└── API_DOCUMENTATION.md               # Complete API reference
```

**Purpose:** All project documentation organized in one place

**Key Files:**
- `README.md` - Start here for documentation navigation
- `ARCHITECTURE.md` - Understand system design
- `API_DOCUMENTATION.md` - API integration guide
- `USER_GUIDE.md` - End-user and developer guide

---

## 💻 Source Code (`src/`)

```
src/
├── handlers/                          # Lambda function handlers
│   ├── register-farmer-irrigation.js  # POST /irrigation/register
│   ├── daily-intelligence.js          # Daily irrigation check (EventBridge)
│   ├── weather-alert-check.js         # Weather monitoring (EventBridge)
│   ├── get-dashboard.js               # GET /irrigation/dashboard/{id}
│   ├── get-alerts-by-phone.js         # GET /irrigation/alerts/phone/{phone}
│   ├── delete-alert.js                # DELETE /irrigation/alerts/delete/{id}/{alertId}
│   ├── unregister-farmer.js           # DELETE /irrigation/unregister/{id}
│   ├── get-crop-calendar.js           # GET /irrigation/crop-calendar/{crop}
│   ├── weekly-summary.js              # Weekly report (EventBridge)
│   ├── twilio-webhook.js              # POST /twilio/inbound (STOP/START)
│   ├── twilio-status.js               # POST /twilio/status (delivery status)
│   └── retry-alert.js                 # SQS retry handler
│
├── lib/                               # Shared libraries and utilities
│   ├── dynamo.js                      # DynamoDB operations
│   ├── weather.js                     # OpenWeatherMap API integration
│   ├── twilio.js                      # Twilio SMS operations
│   ├── secrets.js                     # AWS Secrets Manager
│   ├── soil-water-balance.js          # FAO-56 calculations
│   ├── irrigation-decision.js         # Decision tree logic
│   ├── monsoon-phase.js               # Monsoon calendar logic
│   └── sms-templates.js               # SMS message templates
│
└── data/                              # Static data files
    ├── crop-calendar.json             # Crop growth stages and schedules
    └── district-coordinates.json      # District GPS coordinates
```

### Handler Functions

| File | Trigger | Purpose |
|------|---------|---------|
| `register-farmer-irrigation.js` | API Gateway | Register new farmer |
| `daily-intelligence.js` | EventBridge (daily) | Check irrigation need |
| `weather-alert-check.js` | EventBridge (3 hours) | Monitor weather |
| `get-dashboard.js` | API Gateway | Fetch dashboard data |
| `get-alerts-by-phone.js` | API Gateway | Get alert history |
| `delete-alert.js` | API Gateway | Delete specific alert |
| `unregister-farmer.js` | API Gateway | Remove farmer |
| `get-crop-calendar.js` | API Gateway | Get crop timeline |
| `weekly-summary.js` | EventBridge (Sunday) | Send weekly report |
| `twilio-webhook.js` | API Gateway | Handle STOP/START |
| `twilio-status.js` | API Gateway | Track SMS delivery |
| `retry-alert.js` | SQS | Retry failed SMS |

### Library Modules

| File | Purpose |
|------|---------|
| `dynamo.js` | DynamoDB CRUD operations |
| `weather.js` | Fetch weather data from OpenWeatherMap |
| `twilio.js` | Send SMS via Twilio |
| `secrets.js` | Retrieve secrets from AWS Secrets Manager |
| `soil-water-balance.js` | Calculate ET₀, ETc, soil moisture |
| `irrigation-decision.js` | Decision tree for irrigation alerts |
| `monsoon-phase.js` | Check monsoon season status |
| `sms-templates.js` | Generate SMS messages (Hindi/English) |

### Data Files

| File | Purpose |
|------|---------|
| `crop-calendar.json` | Crop stages, activities, schedules |
| `district-coordinates.json` | GPS coordinates for districts |

---

## 🔧 Scripts (`scripts/`)

```
scripts/
├── seed-crop-data.js                  # Seed crop data to DynamoDB
└── seed-monsoon-calendar.js           # Seed monsoon calendar to DynamoDB
```

**Purpose:** Database seeding and maintenance scripts

**Usage:**
```bash
npm run seed:crops        # Seed crop data
npm run seed:monsoon      # Seed monsoon calendar
```

---

## 🧪 Tests (`tests/`)

```
tests/
├── soil-water-balance.test.js         # Test FAO-56 calculations
├── irrigation-decision.test.js        # Test decision tree logic
├── monsoon-phase.test.js              # Test monsoon detection
└── sms-templates.test.js              # Test SMS generation
```

**Purpose:** Unit tests for core business logic

**Run Tests:**
```bash
npm test                  # Run all tests
npm test -- --coverage    # With coverage report
```

---

## 🏗️ Infrastructure (`serverless.yml`)

**Defines:**
- 12 Lambda functions
- 6 DynamoDB tables
- API Gateway endpoints
- EventBridge schedules
- SQS dead letter queue
- IAM roles and permissions

**Key Sections:**
```yaml
provider:                 # AWS provider configuration
functions:                # Lambda function definitions
resources:                # DynamoDB tables, SQS queues
```

---

## 🔐 Configuration Files

### `package.json`
```json
{
  "name": "kisanvoice-irrigation",
  "scripts": {
    "test": "jest",
    "seed:crops": "node scripts/seed-crop-data.js",
    "seed:monsoon": "node scripts/seed-monsoon-calendar.js"
  },
  "dependencies": {
    "aws-sdk": "^2.1000.0",
    "axios": "^1.6.0",
    "twilio": "^4.0.0",
    "uuid": "^9.0.0"
  }
}
```

### `.env.example`
```bash
# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCOUNT_ID=your_account_id

# Twilio (stored in Secrets Manager)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_MESSAGING_SERVICE_SID=your_service_sid

# OpenWeatherMap (stored in Secrets Manager)
OPENWEATHER_API_KEY=your_api_key
```

### `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.js']
};
```

---

## 🔧 Utility Scripts

### `setup-secrets.sh`
**Purpose:** Create AWS Secrets Manager secret with credentials

**Usage:**
```bash
./setup-secrets.sh
```

### `test-production-e2e.sh`
**Purpose:** End-to-end testing in production environment

**Tests:**
- Farmer registration
- Dashboard retrieval
- Alert management
- Crop calendar
- Unregistration

### `test-real-scenario.sh`
**Purpose:** Test real-world scenarios with actual data

**Scenarios:**
- Complete farmer lifecycle
- Weather alert triggering
- Weekly summary generation

### `cleanup-test-farmers.sh`
**Purpose:** Remove test farmers from database

**Usage:**
```bash
./cleanup-test-farmers.sh
```

---

## 📊 DynamoDB Tables

### Table Structure

```
DynamoDB Tables (6 total):
├── farmers                            # Farmer profiles
│   ├── pk: farmer#<uuid>
│   ├── sk: profile
│   └── GSI: phone-index
│
├── soil-state                         # Current soil moisture
│   ├── pk: farmer#<uuid>
│   └── sk: state
│
├── sms-log                            # SMS history
│   ├── pk: farmer#<uuid>
│   └── sk: sms#<timestamp>
│
├── savings                            # Water savings records
│   ├── pk: farmer#<uuid>
│   └── sk: saving#<date>
│
├── monsoon-calendar                   # Monsoon dates by district
│   ├── pk: district#<name>
│   └── sk: monsoon
│
└── crop-data                          # Crop coefficients and stages
    ├── pk: crop#<name>
    └── sk: stage#<name>
```

---

## 🌐 API Endpoints

### REST API Structure

```
API Gateway: /dev
├── /irrigation
│   ├── POST   /register              # Register farmer
│   ├── GET    /dashboard/{id}        # Get dashboard
│   ├── DELETE /unregister/{id}       # Unregister farmer
│   ├── GET    /alerts/phone/{phone}  # Get alerts by phone
│   ├── DELETE /alerts/delete/{id}/{alertId}  # Delete alert
│   └── GET    /crop-calendar/{crop}  # Get crop calendar
│
└── /twilio
    ├── POST   /inbound                # Handle STOP/START
    └── POST   /status                 # SMS delivery status
```

---

## 📅 EventBridge Schedules

```
EventBridge Rules:
├── irrigation-{farmerId}              # Per-farmer daily rule
│   └── Schedule: Daily at farmer's alertTime (IST)
│
├── weather-alert-check                # Weather monitoring
│   └── Schedule: cron(0 */3 * * ? *)  # Every 3 hours
│
└── weekly-summary                     # Weekly reports
    └── Schedule: cron(30 2 ? * SUN *)  # Sunday 8 AM IST
```

---

## 🔄 Data Flow

### Registration Flow
```
User → API Gateway → register-farmer-irrigation.js
                   ↓
                   ├─→ DynamoDB (farmers, soil-state)
                   ├─→ EventBridge (create rule)
                   └─→ Twilio (confirmation SMS)
```

### Daily Intelligence Flow
```
EventBridge → daily-intelligence.js
            ↓
            ├─→ DynamoDB (read: farmer, soil-state, crop-data)
            ├─→ OpenWeatherMap (fetch weather)
            ├─→ Calculate (ET₀, ETc, soil moisture)
            ├─→ Decision Tree (irrigate/skip/recovery)
            ├─→ Twilio (send SMS if needed)
            └─→ DynamoDB (write: soil-state, sms-log, savings)
```

### Weather Alert Flow
```
EventBridge → weather-alert-check.js
            ↓
            ├─→ DynamoDB (scan active farmers)
            ├─→ OpenWeatherMap (fetch weather for each)
            ├─→ Check critical conditions
            ├─→ Twilio (send alerts)
            └─→ DynamoDB (log alerts)
```

---

## 🗂️ File Naming Conventions

### Lambda Handlers
- Pattern: `{action}-{resource}.js`
- Examples: `register-farmer-irrigation.js`, `get-dashboard.js`

### Library Modules
- Pattern: `{functionality}.js`
- Examples: `soil-water-balance.js`, `sms-templates.js`

### Test Files
- Pattern: `{module}.test.js`
- Examples: `soil-water-balance.test.js`

### Data Files
- Pattern: `{resource}.json`
- Examples: `crop-calendar.json`, `district-coordinates.json`

---

## 📦 Dependencies

### Production Dependencies
```json
{
  "aws-sdk": "AWS service integration",
  "axios": "HTTP client for API calls",
  "twilio": "SMS delivery",
  "uuid": "Unique ID generation"
}
```

### Development Dependencies
```json
{
  "jest": "Testing framework",
  "@types/jest": "TypeScript definitions for Jest"
}
```

---

## 🚀 Deployment Structure

### AWS Resources Created

```
AWS Resources:
├── Lambda Functions (12)
│   ├── kisanvoice-irrigation-dev-register-farmer-irrigation
│   ├── kisanvoice-irrigation-dev-daily-intelligence
│   ├── kisanvoice-irrigation-dev-weather-alert-check
│   └── ... (9 more)
│
├── DynamoDB Tables (6)
│   ├── kisanvoice-irrigation-dev-farmers
│   ├── kisanvoice-irrigation-dev-soil-state
│   └── ... (4 more)
│
├── API Gateway (1)
│   └── kisanvoice-irrigation-dev
│
├── EventBridge Rules (2 + per-farmer)
│   ├── weather-alert-check
│   ├── weekly-summary
│   └── irrigation-{farmerId} (dynamic)
│
├── SQS Queue (1)
│   └── kisanvoice-irrigation-dev-alert-dlq
│
└── IAM Roles (1)
    └── kisanvoice-irrigation-dev-{region}-lambdaRole
```

---

## 📝 Best Practices

### Code Organization
- ✅ Handlers in `src/handlers/`
- ✅ Shared logic in `src/lib/`
- ✅ Static data in `src/data/`
- ✅ Tests in `tests/`
- ✅ Documentation in `docs/`

### File Structure
- ✅ One Lambda function per file
- ✅ One library module per functionality
- ✅ One test file per module
- ✅ Clear, descriptive file names

### Documentation
- ✅ README.md in root for quick start
- ✅ Detailed docs in `docs/` folder
- ✅ Code comments for complex logic
- ✅ JSDoc for function documentation

---

## 🔍 Quick Reference

### Find a File

**Need to modify registration logic?**
→ `src/handlers/register-farmer-irrigation.js`

**Need to change SMS templates?**
→ `src/lib/sms-templates.js`

**Need to adjust irrigation decision logic?**
→ `src/lib/irrigation-decision.js`

**Need to update crop data?**
→ `src/data/crop-calendar.json`

**Need to add a test?**
→ `tests/{module}.test.js`

**Need to update documentation?**
→ `docs/{document}.md`

---

## 📊 Project Statistics

```
Total Files: ~70
├── Source Code: 20 files
├── Tests: 4 files
├── Documentation: 7 files
├── Scripts: 5 files
├── Configuration: 5 files
└── Other: ~29 files

Lines of Code: ~5,000
├── Handlers: ~2,000 lines
├── Libraries: ~1,500 lines
├── Tests: ~800 lines
└── Configuration: ~700 lines

AWS Resources: 22+
├── Lambda Functions: 12
├── DynamoDB Tables: 6
├── API Endpoints: 8
├── EventBridge Rules: 2+ (dynamic)
├── SQS Queues: 1
└── IAM Roles: 1
```

---

**Version:** 1.0.0  
**Last Updated:** March 4, 2026  
**Maintained by:** KisanVoice Team
