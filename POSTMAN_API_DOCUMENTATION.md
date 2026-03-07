# Master Analytics API - Postman Documentation

## Base URL
```
https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com
```

## Authentication
No authentication required (add JWT/API Key in production)

---

## 📊 Dashboard Endpoints

### 1. GET /dashboard/overview
**Description**: Get aggregated metrics across all platform services

**Endpoint**: `GET /dashboard/overview`

**Headers**: None required

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "totalFarmers": 1,
  "voiceQueriesToday": 0,
  "weatherAlerts": 0,
  "irrigationAlerts": 0,
  "serviceRequests": 0,
  "marketQueries": 0
}
```

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/overview`
3. Click Send

---

### 2. GET /dashboard/activity
**Description**: Get recent platform activity feed with voice queries and service requests

**Endpoint**: `GET /dashboard/activity`

**Headers**: None required

**Query Parameters**:
- `limit` (optional, default: 10) - Number of activities to return

**Example Request**:
```
GET /dashboard/activity?limit=5
```

**Response** (200 OK):
```json
[
  {
    "type": "voice_query",
    "farmer": "Unknown",
    "query": "गेहूं की बुवाई कब करें?",
    "time": 1772559067229
  },
  {
    "type": "service_request",
    "service": "TRACTOR",
    "location": "411001",
    "time": "2026-03-01T10:06:54.909264Z"
  }
]
```

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/activity`
3. Params Tab:
   - Key: `limit`, Value: `5`
4. Click Send

---

### 3. GET /dashboard/farmers
**Description**: Get farmer statistics including total count, new registrations, and state distribution

**Endpoint**: `GET /dashboard/farmers`

**Headers**: None required

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "totalFarmers": 1,
  "newToday": 0,
  "topStates": [
    {
      "state": "Utter Pradesh",
      "count": 1
    }
  ]
}
```

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/farmers`
3. Click Send

---

### 4. GET /dashboard/ai-usage
**Description**: Get Voice AI analytics including total queries, response time, and top questions

**Endpoint**: `GET /dashboard/ai-usage`

**Headers**: None required

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "totalQueries": 14,
  "avgResponseTime": "2.1s",
  "topQueries": [
    "गेहूं की बुवाई कब करें?",
    "धान में कीट नियंत्रण कैसे करें?",
    "धान की फसल के बारे में बताएं",
    "test",
    "और कितना पानी चाहिए?"
  ]
}
```

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/ai-usage`
3. Click Send

---

### 5. GET /dashboard/alerts
**Description**: Get weather and irrigation alert counts

**Endpoint**: `GET /dashboard/alerts`

**Headers**: None required

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "weatherAlerts": 0,
  "irrigationAlerts": 0,
  "total": 0
}
```

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/alerts`
3. Click Send

---

### 6. GET /dashboard/services
**Description**: Get service request statistics

**Endpoint**: `GET /dashboard/services`

**Headers**: None required

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "totalRequests": 0,
  "todayRequests": 0
}
```

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/services`
3. Click Send

---

## 🎯 Feature-Based Endpoints

### 7. GET /dashboard/features
**Description**: Get complete data from ALL tables organized by features (Voice AI, Helping Hand, Farmers, Irrigation)

**Endpoint**: `GET /dashboard/features`

**Headers**: None required

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "voiceAI": {
    "total": 14,
    "sessions": [...],
    "topQuestions": [...],
    "avgLatency": 5867
  },
  "helpingHand": {
    "serviceRequests": {...},
    "providers": {...},
    "treatments": {...},
    "bannedPesticides": {...},
    "kvkContacts": {...},
    "pincodeMappings": {...}
  },
  "farmers": {
    "total": 1,
    "farmers": [...],
    "byState": {...},
    "byCity": {...}
  },
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

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/features`
3. Click Send

---

### 8. GET /dashboard/features/voice-ai
**Description**: Get detailed Voice AI session data with questions, answers, and performance metrics

**Endpoint**: `GET /dashboard/features/voice-ai`

**Headers**: None required

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "total": 14,
  "sessions": [
    {
      "question": "गेहूं की बुवाई कब करें?",
      "sessionId": "test-1772559058",
      "latency": 8103,
      "timestamp": 1772559067229,
      "ttl": 1773163867,
      "source": "",
      "isLiveAnswer": false,
      "answer": "..."
    }
  ],
  "topQuestions": [
    {
      "value": "गेहूं की बुवाई कब करें?",
      "count": 8
    },
    {
      "value": "धान में कीट नियंत्रण कैसे करें?",
      "count": 2
    }
  ],
  "avgLatency": 5867
}
```

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/features/voice-ai`
3. Click Send

---

### 9. GET /dashboard/features/helping-hand
**Description**: Get complete Helping Hand service data including requests, providers, treatments, and resources

**Endpoint**: `GET /dashboard/features/helping-hand`

**Headers**: None required

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "serviceRequests": {
    "total": 30,
    "requests": [...],
    "byStatus": {
      "NOTIFYING": 12,
      "MATCHED": 9,
      "COMPLETED": 4,
      "NO_PROVIDERS_FOUND": 5
    },
    "byServiceType": {
      "TRACTOR": 20,
      "TRANSPORT": 9,
      "LABOUR": 1
    },
    "totalRevenue": 16550,
    "completedRequests": 4
  },
  "providers": {
    "total": 5,
    "providers": [...]
  },
  "treatments": {
    "total": 6,
    "treatments": [...],
    "diseases": [...]
  },
  "bannedPesticides": {
    "total": 8,
    "pesticides": [...]
  },
  "kvkContacts": {
    "total": 11,
    "contacts": [...],
    "byDistrict": {...}
  },
  "pincodeMappings": {
    "total": 3,
    "mappings": [...]
  }
}
```

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/features/helping-hand`
3. Click Send

---

### 10. GET /dashboard/features/irrigation
**Description**: Get irrigation system data including farmers, crops, monsoon calendar, and soil state

**Endpoint**: `GET /dashboard/features/irrigation`

**Headers**: None required

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "farmers": {
    "total": 13,
    "farmers": [...]
  },
  "cropData": {
    "total": 31,
    "crops": [...]
  },
  "monsoonCalendar": {
    "total": 12,
    "calendar": [...]
  },
  "savings": {
    "total": 0,
    "savings": []
  },
  "smsLog": {
    "total": 1,
    "logs": [...]
  },
  "soilState": {
    "total": 13,
    "soilStates": [...]
  }
}
```

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/features/irrigation`
3. Click Send

---

### 11. GET /dashboard/users
**Description**: Get all logged-in users across all systems (Auth, Irrigation, Service Requests)

**Endpoint**: `GET /dashboard/users`

**Headers**: None required

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "total": 16,
  "bySource": {
    "auth": 1,
    "irrigation": 13,
    "serviceRequests": 3
  },
  "users": [
    {
      "source": "irrigation",
      "name": "Sravan Maurya",
      "phone": "farmer#41aa29a7-5ef1-4abb-9a50-41d637506856",
      "location": "N/A",
      "createdAt": "2026-03-01T08:17:42.075Z"
    },
    {
      "source": "service_requests",
      "name": "Rajesh Sharma",
      "phone": "+919910890180",
      "location": "Pincode: 411001",
      "language": "hi",
      "landArea": 6,
      "profileComplete": true,
      "createdAt": "2026-02-28T17:50:40.380Z",
      "coordinates": {
        "lat": 28.4595,
        "lng": 77.0266
      },
      "serviceCount": 23,
      "sources": ["auth", "service_requests"]
    }
  ]
}
```

**Postman Setup**:
1. Method: GET
2. URL: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/users`
3. Click Send

---

## 📦 Postman Collection Import

### Quick Setup
1. Open Postman
2. Click "Import" button
3. Select "Raw text"
4. Paste the JSON below
5. Click "Import"

### Collection JSON
```json
{
  "info": {
    "name": "Master Analytics API",
    "description": "Complete API collection for Master Analytics Dashboard",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Dashboard",
      "item": [
        {
          "name": "Overview",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/overview",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "overview"]
            }
          }
        },
        {
          "name": "Activity",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/activity?limit=10",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "activity"],
              "query": [
                {
                  "key": "limit",
                  "value": "10"
                }
              ]
            }
          }
        },
        {
          "name": "Farmers",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/farmers",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "farmers"]
            }
          }
        },
        {
          "name": "AI Usage",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/ai-usage",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "ai-usage"]
            }
          }
        },
        {
          "name": "Alerts",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/alerts",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "alerts"]
            }
          }
        },
        {
          "name": "Services",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/services",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "services"]
            }
          }
        },
        {
          "name": "All Users",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/users",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "users"]
            }
          }
        }
      ]
    },
    {
      "name": "Features",
      "item": [
        {
          "name": "All Features",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/features",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "features"]
            }
          }
        },
        {
          "name": "Voice AI",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/features/voice-ai",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "features", "voice-ai"]
            }
          }
        },
        {
          "name": "Helping Hand",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/features/helping-hand",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "features", "helping-hand"]
            }
          }
        },
        {
          "name": "Irrigation",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com/dashboard/features/irrigation",
              "protocol": "https",
              "host": ["1n1xhaq7z6", "execute-api", "ap-south-1", "amazonaws", "com"],
              "path": ["dashboard", "features", "irrigation"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🔧 Testing Tips

### 1. Test All Endpoints Sequentially
Run requests in this order to understand the data flow:
1. `/dashboard/overview` - Get high-level metrics
2. `/dashboard/users` - See all registered users
3. `/dashboard/features/voice-ai` - Check AI interactions
4. `/dashboard/features/helping-hand` - Review service requests
5. `/dashboard/activity` - See recent activity

### 2. Use Postman Tests
Add this to the "Tests" tab for automatic validation:

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});

pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.not.be.empty;
});
```

### 3. Environment Variables
Create a Postman environment with:
- `base_url`: `https://1n1xhaq7z6.execute-api.ap-south-1.amazonaws.com`

Then use: `{{base_url}}/dashboard/overview`

---

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200  | Success - Request completed successfully |
| 404  | Not Found - Invalid endpoint |
| 405  | Method Not Allowed - Only GET is supported |
| 500  | Internal Server Error - Check logs |

---

## 🚀 Quick Start Guide

1. **Import Collection**: Copy the JSON above into Postman
2. **Test Overview**: Run `/dashboard/overview` first
3. **Explore Features**: Try `/dashboard/features` for complete data
4. **Check Users**: Run `/dashboard/users` to see all logged-in users
5. **Monitor Activity**: Use `/dashboard/activity?limit=5` for recent events

---

## 📝 Notes

- All endpoints return JSON
- No authentication required (add in production)
- Response times are typically < 500ms
- Data is cached for performance
- All timestamps are in ISO 8601 format or Unix milliseconds

---

## 🆘 Support

For issues or questions:
- Check CloudWatch logs: `/aws/lambda/master-analytics-api-dev-api`
- Verify table names in `serverless.yml`
- Ensure IAM permissions are correct
- Test with `curl` if Postman fails

---

**Last Updated**: March 7, 2026  
**API Version**: 1.0.0  
**Region**: ap-south-1 (Mumbai)
