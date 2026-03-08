# API Documentation

Base URL: `https://[api-id].execute-api.ap-south-1.amazonaws.com/`

All endpoints use HTTP GET method and return JSON responses.

## Response Format

### Success Response
```json
{
  "statusCode": 200,
  "body": {
    // Response data
  }
}
```

### Error Response
```json
{
  "statusCode": 400|404|405|500,
  "body": {
    "error": "Error message"
  }
}
```

## Endpoints

### 1. Dashboard Overview
```
GET /dashboard/overview
```

Returns aggregated platform metrics.

**Response:**
```json
{
  "totalFarmers": 1250,
  "activeServices": 45,
  "todayQueries": 230,
  "alerts": 12
}
```

---

### 2. Recent Activity
```
GET /dashboard/activity?limit=10
```

**Query Parameters:**
- `limit` (optional) - Number of activities to return (default: 10)

**Response:**
```json
[
  {
    "type": "voice_query",
    "farmer": "farmer123",
    "query": "Weather forecast",
    "time": "2024-03-08T10:30:00Z"
  },
  {
    "type": "service_request",
    "service": "Tractor rental",
    "location": "Maharashtra",
    "time": "2024-03-08T10:25:00Z"
  }
]
```

---

### 3. Farmer Analytics
```
GET /dashboard/farmers
```

**Response:**
```json
{
  "total": 1250,
  "byState": {
    "Maharashtra": 450,
    "Punjab": 320
  },
  "byCity": {
    "Mumbai": 120,
    "Pune": 95
  },
  "byLanguage": {
    "Hindi": 600,
    "Marathi": 400
  },
  "totalLandArea": 15000,
  "profileComplete": 980
}
```

---

### 4. AI Usage Analytics
```
GET /dashboard/ai-usage
```

**Response:**
```json
{
  "totalSessions": 5420,
  "todaySessions": 230,
  "avgLatency": 1200,
  "topQueries": ["Weather", "Crop prices", "Pest control"]
}
```

---

### 5. Alerts Summary
```
GET /dashboard/alerts
```

**Response:**
```json
{
  "weatherAlerts": 8,
  "irrigationAlerts": 4,
  "total": 12
}
```

---

### 6. Service Requests
```
GET /dashboard/services
```

**Response:**
```json
{
  "totalRequests": 450,
  "todayRequests": 45
}
```

---

### 7. All Features
```
GET /dashboard/features
```

Returns comprehensive data from all features.

**Response:**
```json
{
  "voiceAI": {
    "total": 5420,
    "sessions": [...],
    "topQuestions": [...],
    "avgLatency": 1200
  },
  "helpingHand": {
    "serviceRequests": {...},
    "providers": {...},
    "treatments": {...},
    "bannedPesticides": {...},
    "kvkContacts": {...},
    "pincodeMappings": {...}
  },
  "farmers": {...},
  "irrigation": {
    "farmers": {...},
    "cropData": {...},
    "monsoonCalendar": {...},
    "savings": {...},
    "smsLog": {...},
    "soilState": {...}
  }
}
```

---

### 8. Voice AI Details
```
GET /dashboard/features/voice-ai
```

**Response:**
```json
{
  "total": 5420,
  "sessions": [
    {
      "sessionId": "sess_123",
      "farmerId": "farmer_456",
      "question": "What is the weather forecast?",
      "latency": 1150,
      "timestamp": "2024-03-08T10:30:00Z"
    }
  ],
  "topQuestions": [
    { "value": "Weather forecast", "count": 450 },
    { "value": "Crop prices", "count": 320 }
  ],
  "avgLatency": 1200
}
```

---

### 9. Helping Hand Services
```
GET /dashboard/features/helping-hand
```

**Response:**
```json
{
  "serviceRequests": {
    "total": 450,
    "requests": [...],
    "byStatus": {
      "PENDING": 120,
      "COMPLETED": 280,
      "CANCELLED": 50
    },
    "byServiceType": {
      "Tractor": 180,
      "Harvester": 150
    },
    "totalRevenue": 450000,
    "completedRequests": 280
  },
  "providers": {
    "total": 85,
    "providers": [...]
  },
  "treatments": {
    "total": 230,
    "treatments": [...],
    "diseases": ["Blight", "Rust", "Wilt"]
  },
  "bannedPesticides": {
    "total": 45,
    "pesticides": [...]
  },
  "kvkContacts": {
    "total": 120,
    "contacts": [...],
    "byDistrict": {
      "Pune": 5,
      "Mumbai": 3
    }
  },
  "pincodeMappings": {
    "total": 850,
    "mappings": [...]
  }
}
```

---

### 10. Irrigation System
```
GET /dashboard/features/irrigation
```

**Response:**
```json
{
  "farmers": {
    "total": 680,
    "farmers": [...]
  },
  "cropData": {
    "total": 45,
    "crops": [...]
  },
  "monsoonCalendar": {
    "total": 12,
    "calendar": [...]
  },
  "savings": {
    "total": 680,
    "savings": [...]
  },
  "smsLog": {
    "total": 3420,
    "logs": [...]
  },
  "soilState": {
    "total": 680,
    "soilStates": [...]
  }
}
```

---

### 11. All Users
```
GET /dashboard/users
```

Returns deduplicated users from all systems.

**Response:**
```json
{
  "total": 1450,
  "bySource": {
    "auth": 1250,
    "irrigation": 680,
    "serviceRequests": 320
  },
  "users": [
    {
      "source": "auth",
      "name": "Ramesh Kumar",
      "phone": "+919876543210",
      "location": "Pune, Maharashtra",
      "language": "Marathi",
      "landArea": 5.5,
      "profileComplete": true,
      "createdAt": "2024-01-15T08:30:00Z",
      "coordinates": {
        "lat": 18.5204,
        "lng": 73.8567
      }
    }
  ]
}
```

---

## Error Codes

- `400` - Bad Request
- `404` - Not Found
- `405` - Method Not Allowed (only GET supported)
- `500` - Internal Server Error

## Rate Limits

No rate limiting currently implemented. Consider adding based on usage patterns.

## Authentication

No authentication currently required. Implement API keys or JWT tokens for production use.

## CORS

CORS not configured. Add CORS headers if accessing from web browsers.
