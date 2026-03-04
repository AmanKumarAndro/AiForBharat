# Helping Hand — Requirements
*Kiro Spec Format*

---

## 1. Project Overview

**Product:** Helping Hand — On-Demand Farm Services Marketplace
**Tagline:** Tractor | Labour | Transport — Matched in Minutes, Not Days
**Model:** Uber/Rapido-style service matching for rural farmers on AWS

---

## 2. User Stories

### 2.1 Farmer (Requester)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| F-01 | As a farmer, I want to request a tractor/labour/transport by tapping a button, so that I don't need to call middlemen | Request is created in DynamoDB within 2 seconds; farmer receives a `request_id` |
| F-02 | As a farmer, I want to see nearby providers sorted by rating, so that I can trust the service quality | Top 3 providers in nearby pincodes are returned, sorted by rating descending |
| F-03 | As a farmer, I want to know when a provider has accepted my request, so that I can prepare | Status transitions from `PENDING` → `MATCHED`; farmer sees provider name, phone, and rating |
| F-04 | As a farmer, I want to call the provider directly from the app, so that I can coordinate easily | Call button appears with provider phone number after match |
| F-05 | As a farmer, I want to rate the provider after the job, so that quality providers rank higher | 1–5 star rating submitted; provider's rolling average recalculates immediately |
| F-06 | As a farmer, I want to speak my request in Hindi, so that I don't need to know English | Voice keywords (`ट्रैक्टर`, `मजदूर`, `गाड़ी`) trigger the correct service type |

### 2.2 Provider (Service Supplier)

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| P-01 | As a provider, I want to receive a push notification when a nearby farmer needs my service, so that I don't miss jobs | SNS push fires to device within 5 seconds of request creation |
| P-02 | As a provider, I want to accept a job with one tap, so that I can respond quickly | `AcceptRequest` API atomically updates status; 409 returned if job already taken |
| P-03 | As a provider, I want to be marked unavailable while on a job, so that I don't get double-booked | `is_available` set to `false` and `status` set to `ON_JOB` on acceptance |
| P-04 | As a provider, I want to return to the available pool after job completion, so that I can receive new jobs | `is_available` reset to `true` and `status` reset to `IDLE` after rating submitted |
| P-05 | As a provider, I want my rating to improve my ranking, so that quality work is rewarded | Rating recalculated as rolling average; GSI sort ensures top-rated providers match first |

---

## 3. Functional Requirements

### 3.1 Service Request Flow

- **FR-01:** System SHALL create a service request record in `HH_Requests` with status `PENDING` upon farmer submission
- **FR-02:** System SHALL asynchronously invoke `HH_MatchProviders` Lambda after request creation (non-blocking for farmer)
- **FR-03:** System SHALL look up neighboring pincodes from `HH_PincodeMappings` to define the search radius
- **FR-04:** System SHALL query `HH_Providers` GSI (`ServiceType-Rating-Index`) filtered by `is_available = true` and matching pincodes
- **FR-05:** System SHALL select the top 3 providers by rating descending
- **FR-06:** System SHALL send an SNS push notification to each of the top 3 providers

### 3.2 Acceptance & Matching

- **FR-07:** System SHALL use a DynamoDB conditional write to atomically accept a request — only if status is `PENDING` or `NOTIFYING`
- **FR-08:** System SHALL return HTTP 409 if a second provider attempts to accept an already-matched request
- **FR-09:** System SHALL update the matched provider's `is_available` to `false` and `status` to `ON_JOB` upon acceptance

### 3.3 Rating & Completion

- **FR-10:** System SHALL accept a 1–5 integer rating from the farmer after job completion
- **FR-11:** System SHALL recalculate provider rating as a rolling average: `((old_rating × total_jobs) + new_rating) / (total_jobs + 1)`
- **FR-12:** System SHALL increment `total_jobs` and reset provider availability on completion

### 3.4 Voice Integration

- **FR-13:** System SHALL detect Hindi and English tractor/labour/transport keywords from transcribed voice input
- **FR-14:** System SHALL route detected intent to the Helping Hand request flow without any new infrastructure
- **FR-15:** System SHALL respond with a Hindi confirmation: *"आपका अनुरोध भेज दिया गया है"*

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Latency | Provider push notification must fire within 5 seconds of farmer request |
| NFR-02 | Concurrency | Atomic DynamoDB conditional write must prevent race conditions when multiple providers accept simultaneously |
| NFR-03 | Availability | All Lambda functions must be stateless and independently restartable |
| NFR-04 | Cost | MVP must operate within AWS Free Tier during hackathon; target < $4/month at scale |
| NFR-05 | Scalability | All tables use on-demand DynamoDB capacity — no manual provisioning required |
| NFR-06 | Portability | Pincode-based proximity matching — no GPS required; works with basic rural mobile data |
| NFR-07 | Security | IAM policies must follow least-privilege; Lambda roles scoped to `HH_*` resources only |

---

## 5. Data Models

### HH_Providers
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `provider_id` | String (PK) | ✅ | e.g. `PRV_9876543210` |
| `name` | String | ✅ | |
| `phone` | String | ✅ | E.164 format |
| `service_type` | String | ✅ | `TRACTOR` / `LABOUR` / `TRANSPORT` |
| `pin_code` | String | ✅ | Provider's home pincode |
| `nearby_pincodes` | List | ✅ | Villages provider will travel to |
| `rating` | Number | ✅ | Rolling average, e.g. `4.8` |
| `total_jobs` | Number | ✅ | Used in rating recalculation |
| `price_per_hour` | Number | ✅ | In INR |
| `is_available` | Boolean | ✅ | `true` = can receive jobs |
| `device_token` | String | ✅ | FCM/APNs token |
| `status` | String | ✅ | `IDLE` / `ON_JOB` |

### HH_Requests
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `request_id` | String (PK) | ✅ | UUID |
| `farmer_id` | String | ✅ | Farmer's phone number |
| `farmer_name` | String | ✅ | |
| `service_type` | String | ✅ | `TRACTOR` / `LABOUR` / `TRANSPORT` |
| `farmer_pincode` | String | ✅ | |
| `status` | String | ✅ | `PENDING` / `NOTIFYING` / `MATCHED` / `COMPLETED` / `NO_PROVIDERS_FOUND` |
| `matched_provider_id` | String | ❌ | Filled on acceptance |
| `created_at` | String | ✅ | ISO 8601 timestamp |
| `farmer_rating_given` | Number | ❌ | 1–5, submitted post-job |
| `estimated_price` | Number | ✅ | In INR |

### HH_PincodeMappings
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `pincode` | String (PK) | ✅ | e.g. `411001` |
| `nearby` | List\<String\> | ✅ | Neighbor village pincodes |
| `district` | String | ❌ | e.g. `Pune` |
| `state` | String | ❌ | e.g. `Maharashtra` |

---

## 6. API Endpoints

| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| POST | `/request` | `HH_CreateRequest` | Farmer submits service request |
| POST | `/accept` | `HH_AcceptRequest` | Provider accepts a job |
| POST | `/complete` | `HH_CompleteAndRate` | Farmer rates after job completion |
| GET | `/status/{request_id}` | `HH_GetStatus` | Poll for request status |
| POST | `/provider/register` | `HH_RegisterProvider` | Onboard a new provider |

---

## 7. AWS Services & Infrastructure

| Service | Usage | Config |
|---------|-------|--------|
| DynamoDB | All data storage | On-demand capacity, 3 tables, 1 GSI |
| Lambda | All business logic | Python 3.12, 4 functions |
| API Gateway | REST API layer | 5 routes, CORS enabled, `prod` stage |
| SNS | Push notifications to providers | Android (FCM) + iOS (APNs) platform apps |
| S3 | Static demo frontend | Static website hosting enabled |
| IAM | Permissions | Inline policies scoped to `HH_*` resources |

---

## 8. Out of Scope (MVP)

- Payment processing
- Real-time GPS tracking
- In-app chat between farmer and provider
- Provider registration self-service UI
- Multi-language support beyond Hindi/English
- SLA enforcement or job cancellation flow

---

## 9. Build Order & Time Estimates

| Phase | Task | Time | Output |
|-------|------|------|--------|
| 1 | DynamoDB tables + GSI | 20 min | Tables Active |
| 2 | Lambda functions (4x) | 20 min | Core logic deployed |
| 3 | API Gateway + deploy | 10 min | REST endpoints live |
| 4 | IAM permissions + Postman test | 10 min | End-to-end working |
| 5 | Seed test data (3 providers) | 15 min | Demo data ready |
| 6 | S3 static frontend | 15 min | Visual demo live |
| 7 | Voice pipeline integration | 10 min | Hindi trigger works |
| 8 | Full end-to-end test + polish | 10 min | Demo ready |
| **Total** | | **110 min** | |

---

## 10. Success Criteria (Judge Demo)

- [ ] Farmer taps "Need Tractor" → 3 rated providers appear on screen within 3 seconds
- [ ] Provider receives push notification within 5 seconds
- [ ] Provider accepts → farmer sees provider name, rating, and call button
- [ ] Second provider attempting to accept receives "Already taken" error
- [ ] Farmer rates → provider score recalculates and they return to available pool
- [ ] Hindi voice input ("मुझे ट्रैक्टर चाहिए") triggers full flow end-to-end
