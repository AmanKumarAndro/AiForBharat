# Helping Hand - Postman Testing Guide

## Setup API Gateway First

Run this script to create a proper API Gateway:

```bash
./setup_api_gateway.sh
```

This will output your API Gateway URL. Use it as `{{base_url}}` in Postman.

---

## Postman Collection Variables

Set these variables in your Postman collection:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/prod` | API Gateway URL |
| `request_id` | (auto-set) | Captured from create request response |
| `request_id_2` | (auto-set) | For race condition testing |

---

## Test Cases

### 1. Register Provider

**Method:** POST  
**URL:** `{{base_url}}/provider/register`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "phone": "+919876543213",
  "name": "Mahesh Deshmukh",
  "service_type": "TRACTOR",
  "pin_code": "411001",
  "nearby_pincodes": ["411002", "411003"],
  "price_per_hour": 550,
  "device_token": "arn:aws:sns:ap-south-1:YOUR_AWS_ACCOUNT_ID:endpoint/FCM/HelpingHand/mahesh-device"
}
```

**Expected Response (200):**
```json
{
  "message": "Provider registered successfully",
  "provider_id": "PRV_+919876543213"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Provider ID returned", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.provider_id).to.exist;
});
```

---

### 2. Create Service Request (Farmer)

**Method:** POST  
**URL:** `{{base_url}}/request`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "farmer_id": "+919999999999",
  "farmer_name": "Rajesh Sharma",
  "service_type": "TRACTOR",
  "farmer_pincode": "411001",
  "estimated_price": 500
}
```

**Expected Response (200):**
```json
{
  "request_id": "a6706841-0a56-4801-8908-ea1feae848e1",
  "status": "PENDING",
  "message": "Request created successfully"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Request ID returned", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.request_id).to.exist;
    pm.collectionVariables.set("request_id", jsonData.request_id);
});

pm.test("Status is PENDING", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql("PENDING");
});
```

---

### 3. Get Request Status (Wait 5 seconds after creating request)

**Method:** GET  
**URL:** `{{base_url}}/status/{{request_id}}`  
**Headers:**
```
Content-Type: application/json
```

**Expected Response (200):**
```json
{
  "request_id": "a6706841-0a56-4801-8908-ea1feae848e1",
  "status": "NOTIFYING",
  "service_type": "TRACTOR",
  "created_at": "2026-02-26T05:24:54.581385Z"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Status is NOTIFYING or MATCHED", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.status).to.be.oneOf(["NOTIFYING", "MATCHED", "PENDING"]);
});
```

---

### 4. Accept Request (Provider)

**Method:** POST  
**URL:** `{{base_url}}/accept`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "request_id": "{{request_id}}",
  "provider_id": "PRV_9876543210"
}
```

**Expected Response (200):**
```json
{
  "message": "Request accepted successfully",
  "request_id": "a6706841-0a56-4801-8908-ea1feae848e1",
  "provider": {
    "name": "Ramesh Kumar",
    "phone": "+919876543210",
    "rating": 4.8
  }
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Provider details returned", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.provider).to.exist;
    pm.expect(jsonData.provider.name).to.exist;
    pm.expect(jsonData.provider.phone).to.exist;
    pm.expect(jsonData.provider.rating).to.be.a('number');
});
```

---

### 5. Get Status After Acceptance

**Method:** GET  
**URL:** `{{base_url}}/status/{{request_id}}`  
**Headers:**
```
Content-Type: application/json
```

**Expected Response (200):**
```json
{
  "request_id": "a6706841-0a56-4801-8908-ea1feae848e1",
  "status": "MATCHED",
  "service_type": "TRACTOR",
  "created_at": "2026-02-26T05:24:54.581385Z",
  "provider": {
    "name": "Ramesh Kumar",
    "phone": "+919876543210",
    "rating": 4.8,
    "price_per_hour": 500.0
  }
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Status is MATCHED", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql("MATCHED");
});

pm.test("Provider details included", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.provider).to.exist;
});
```

---

### 6. Complete and Rate Service

**Method:** POST  
**URL:** `{{base_url}}/complete`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "request_id": "{{request_id}}",
  "rating": 5
}
```

**Expected Response (200):**
```json
{
  "message": "Job completed and rated successfully",
  "provider_new_rating": 4.81,
  "provider_total_jobs": 46
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Provider rating updated", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.provider_new_rating).to.be.a('number');
    pm.expect(jsonData.provider_total_jobs).to.be.a('number');
});
```

---

### 7. Test Race Condition - Create Second Request

**Method:** POST  
**URL:** `{{base_url}}/request`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "farmer_id": "+919999999998",
  "farmer_name": "Sunil Patil",
  "service_type": "TRACTOR",
  "farmer_pincode": "411001",
  "estimated_price": 500
}
```

**Tests Script:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

var jsonData = pm.response.json();
pm.collectionVariables.set("request_id_2", jsonData.request_id);
```

---

### 8. Test Race Condition - First Provider Accepts

**Method:** POST  
**URL:** `{{base_url}}/accept`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "request_id": "{{request_id_2}}",
  "provider_id": "PRV_9876543210"
}
```

**Expected Response (200):**
```json
{
  "message": "Request accepted successfully",
  "request_id": "...",
  "provider": {...}
}
```

---

### 9. Test Race Condition - Second Provider Tries (Should Fail)

**Method:** POST  
**URL:** `{{base_url}}/accept`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "request_id": "{{request_id_2}}",
  "provider_id": "PRV_9876543211"
}
```

**Expected Response (409):**
```json
{
  "error": "Request already taken by another provider"
}
```

**Tests Script:**
```javascript
pm.test("Status code is 409", function () {
    pm.response.to.have.status(409);
});

pm.test("Error message indicates already taken", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.error).to.include("already taken");
});
```

---

## Additional Test Cases

### 10. Invalid Service Type

**Method:** POST  
**URL:** `{{base_url}}/request`  
**Body:**
```json
{
  "farmer_id": "+919999999999",
  "farmer_name": "Test Farmer",
  "service_type": "INVALID",
  "farmer_pincode": "411001",
  "estimated_price": 500
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid service_type. Must be TRACTOR, LABOUR, or TRANSPORT"
}
```

---

### 11. Missing Required Fields

**Method:** POST  
**URL:** `{{base_url}}/request`  
**Body:**
```json
{
  "farmer_id": "+919999999999",
  "service_type": "TRACTOR"
}
```

**Expected Response (400):**
```json
{
  "error": "Missing required field: farmer_name"
}
```

---

### 12. Invalid Rating (Out of Range)

**Method:** POST  
**URL:** `{{base_url}}/complete`  
**Body:**
```json
{
  "request_id": "{{request_id}}",
  "rating": 10
}
```

**Expected Response (400):**
```json
{
  "error": "Rating must be between 1 and 5"
}
```

---

### 13. Request Labour Service

**Method:** POST  
**URL:** `{{base_url}}/request`  
**Body:**
```json
{
  "farmer_id": "+919999999997",
  "farmer_name": "Prakash Jadhav",
  "service_type": "LABOUR",
  "farmer_pincode": "411001",
  "estimated_price": 200
}
```

**Expected Response (200):**
Should match with Ganesh Jadhav (LABOUR provider with 4.9 rating)

---

### 14. Request Transport Service

**Method:** POST  
**URL:** `{{base_url}}/request`  
**Body:**
```json
{
  "farmer_id": "+919999999996",
  "farmer_name": "Vijay Kulkarni",
  "service_type": "TRANSPORT",
  "farmer_pincode": "411001",
  "estimated_price": 800
}
```

**Expected Response (200):**
Should return NO_PROVIDERS_FOUND (no transport providers seeded)

---

## Test Execution Order

Run tests in this sequence:

1. Register Provider (optional - adds new provider)
2. Create Service Request
3. Wait 5 seconds
4. Get Request Status
5. Accept Request
6. Get Status After Acceptance
7. Complete and Rate Service
8. Create Second Request (for race condition)
9. First Provider Accepts
10. Second Provider Tries (should fail with 409)

---

## Success Criteria

✅ All requests return expected status codes  
✅ Request ID is generated and tracked  
✅ Provider matching happens within 5 seconds  
✅ Atomic acceptance prevents double-booking (409)  
✅ Rating system updates provider scores  
✅ Invalid inputs return 400 errors  
✅ Provider details include name, phone, rating  

---

## Troubleshooting

**"Request not found"**: Check request_id variable is set correctly  
**"No providers found"**: Verify seed data loaded, check service_type matches  
**"Already taken"**: This is expected for race condition test  
**Timeout**: Increase wait time between create and status check  
