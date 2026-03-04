# API Documentation

## Base URL

```
https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev
```

## Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

Tokens are obtained via the `/auth/verify-otp` endpoint and expire after 7 days.

---

## Endpoints

### 1. Send OTP

Send a one-time password to a phone number via SMS.

**Endpoint**: `POST /auth/send-otp`

**Authentication**: Not required

**Request Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "phone": "+919876543210"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number with country code (E.164 format) |

**Success Response** (200):
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Error Responses**:

400 - Invalid phone format:
```json
{
  "success": false,
  "message": "Invalid phone number format"
}
```

500 - Server error:
```json
{
  "success": false,
  "message": "Failed to send OTP: [error details]"
}
```

**Example**:
```bash
curl -X POST https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

---

### 2. Verify OTP

Verify the OTP and receive a JWT authentication token.

**Endpoint**: `POST /auth/verify-otp`

**Authentication**: Not required

**Request Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number with country code |
| otp | string | Yes | 6-digit OTP code received via SMS |

**Success Response** (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isProfileComplete": false
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Operation status |
| token | string | JWT token (valid for 7 days) |
| isProfileComplete | boolean | Whether user has completed onboarding |

**Error Responses**:

400 - Missing fields:
```json
{
  "success": false,
  "message": "Phone and OTP are required"
}
```

400 - Invalid OTP:
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

**Example**:
```bash
curl -X POST https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "123456"}'
```

---

### 3. Onboard User

Complete user profile with personal and location information.

**Endpoint**: `POST /farmer/onboard`

**Authentication**: Required (JWT token)

**Request Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body**:
```json
{
  "name": "Ramesh Kumar",
  "userType": "farmer",
  "totalLandArea": 5.5,
  "latitude": 28.4595,
  "longitude": 77.0266,
  "city": "Gurgaon",
  "state": "Haryana"
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | User's full name |
| userType | string | Yes | Either "farmer" or "provider" |
| totalLandArea | number | Yes | Land area in acres (positive number) |
| latitude | number | Yes | Geographic latitude (decimal degrees) |
| longitude | number | Yes | Geographic longitude (decimal degrees) |
| city | string | Yes | City name |
| state | string | Yes | State name |

**Success Response** (200):
```json
{
  "success": true,
  "message": "Profile completed successfully"
}
```

**Error Responses**:

400 - Missing fields:
```json
{
  "success": false,
  "message": "All fields are required"
}
```

400 - Invalid userType:
```json
{
  "success": false,
  "message": "userType must be either \"farmer\" or \"provider\""
}
```

400 - Invalid land area:
```json
{
  "success": false,
  "message": "totalLandArea must be a positive number"
}
```

401 - Unauthorized:
```json
{
  "success": false,
  "message": "Missing or invalid authorization header"
}
```

**Example**:
```bash
curl -X POST https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev/farmer/onboard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Ramesh Kumar",
    "userType": "farmer",
    "totalLandArea": 5.5,
    "latitude": 28.4595,
    "longitude": 77.0266,
    "city": "Gurgaon",
    "state": "Haryana"
  }'
```

---

### 4. Get User Profile

Retrieve the authenticated user's profile information.

**Endpoint**: `GET /farmer/profile`

**Authentication**: Required (JWT token)

**Request Headers**:
```json
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Request Body**: None

**Success Response** (200):
```json
{
  "phone": "+919876543210",
  "name": "Ramesh Kumar",
  "userType": "farmer",
  "totalLandArea": 5.5,
  "latitude": 28.4595,
  "longitude": 77.0266,
  "city": "Gurgaon",
  "state": "Haryana",
  "isProfileComplete": true,
  "language": "hi",
  "createdAt": "2026-03-04T10:30:00.000Z",
  "updatedAt": "2026-03-04T10:35:00.000Z"
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| phone | string | User's phone number |
| name | string | User's full name |
| userType | string | "farmer" or "provider" |
| totalLandArea | number | Land area in acres |
| latitude | number | Geographic latitude |
| longitude | number | Geographic longitude |
| city | string | City name |
| state | string | State name |
| isProfileComplete | boolean | Profile completion status |
| language | string | Preferred language (default: "hi") |
| createdAt | string | Account creation timestamp (ISO 8601) |
| updatedAt | string | Last update timestamp (ISO 8601) |

**Error Responses**:

401 - Unauthorized:
```json
{
  "success": false,
  "message": "Missing or invalid authorization header"
}
```

404 - User not found:
```json
{
  "success": false,
  "message": "User not found"
}
```

**Example**:
```bash
curl -X GET https://m5w47virua.execute-api.ap-south-1.amazonaws.com/dev/farmer/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Rate Limiting

- OTP requests are limited to 3 attempts per 5 minutes per phone number (enforced by Twilio)
- No rate limiting on other endpoints (consider implementing for production)

---

## CORS

CORS is enabled for all origins (`*`). For production, configure specific allowed origins in `serverless.yml`.

---

## Data Formats

### Phone Numbers

Must follow E.164 format:
- Include country code (e.g., +91 for India)
- No spaces or special characters
- Example: `+919876543210`

### Timestamps

All timestamps use ISO 8601 format:
- Example: `2026-03-04T10:30:00.000Z`

### Coordinates

Geographic coordinates in decimal degrees:
- Latitude: -90 to 90
- Longitude: -180 to 180
- Example: `28.4595, 77.0266`

---

## Testing

Use the provided Postman collection (`KisanVoice_API.postman_collection.json`) for testing all endpoints.

### Test Flow

1. Send OTP to your phone number
2. Receive OTP via SMS
3. Verify OTP and save the returned token
4. Use token to complete onboarding
5. Retrieve profile to verify data

---

## Troubleshooting

### Common Issues

**"Invalid phone number format"**
- Ensure phone number includes country code
- Format: `+[country_code][number]`
- Example: `+919876543210`

**"Invalid OTP"**
- OTP expires after 10 minutes
- Maximum 3 attempts allowed
- Request new OTP if expired

**"Missing or invalid authorization header"**
- Include `Authorization: Bearer <token>` header
- Token may have expired (7-day validity)
- Request new token by verifying OTP again

**"totalLandArea must be a positive number"**
- Ensure value is a number, not a string
- Must be greater than 0
- Example: `5.5` not `"5.5"`
