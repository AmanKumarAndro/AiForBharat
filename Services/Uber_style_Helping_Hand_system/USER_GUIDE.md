# User Guide

## For Farmers

### Getting Started

#### 1. Create Your First Request

**Step 1**: Open the app or call the API

**Step 2**: Fill in request details:
- Your phone number (e.g., +919910890180)
- Your name
- Service type (TRACTOR, LABOUR, or TRANSPORT)
- Your location (pincode)
- Expected price (optional)

**Step 3**: Submit request

**Example**:
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/request \
  -H 'Content-Type: application/json' \
  -d '{
    "farmer_id": "+919910890180",
    "farmer_name": "Rajesh Sharma",
    "service_type": "TRACTOR",
    "farmer_pincode": "411001",
    "estimated_price": 500
  }'
```

**What Happens Next**:
1. Request created with unique ID
2. System finds top 3 providers
3. SMS sent to providers
4. You receive confirmation

---

#### 2. Track Your Request

**Check Status**:
```bash
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/status/{request_id}"
```

**Status Meanings**:
- **PENDING**: Finding providers for you
- **NOTIFYING**: SMS sent to providers, waiting for acceptance
- **MATCHED**: Provider accepted! Details shown
- **COMPLETED**: Service finished
- **NO_PROVIDERS_FOUND**: No providers available (try again later)

**When Matched**:
- You'll see provider name
- Provider phone number
- Provider rating
- Provider price

**Action**: Call the provider to coordinate

---

#### 3. Complete and Rate Service

**After Service is Done**:

**Step 1**: Open completion screen

**Step 2**: Rate provider (1-5 stars)
- 5 stars: Excellent
- 4 stars: Good
- 3 stars: Average
- 2 stars: Below average
- 1 star: Poor

**Step 3**: Add feedback (optional)

**Step 4**: Submit

**Example**:
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/complete \
  -H 'Content-Type: application/json' \
  -d '{
    "request_id": "{request_id}",
    "rating": 5,
    "feedback": "Excellent service, very professional!"
  }'
```

**What Happens**:
- Request marked as completed
- Provider's rating updated
- Provider becomes available again

---

#### 4. View Your Request History

**See All Your Requests**:
```bash
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/farmer-requests/+919910890180"
```

**You'll See**:
- **Ongoing**: Active requests (waiting or in progress)
- **Completed**: Finished services with ratings
- **Pending**: Requests waiting for providers

**Use Cases**:
- Track spending
- Find previous providers
- Review service history
- Contact providers again

---

#### 5. View Providers on Map

**See Nearby Providers**:
```bash
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/providers-map?pincode=411001&service_type=TRACTOR"
```

**Map Shows**:
- Provider locations (GPS markers)
- Availability status (green=available, red=busy)
- Provider ratings
- Provider prices

**How to Use**:
1. Open map view
2. Select service type
3. Enter your pincode
4. View nearby providers
5. Tap marker for details

---

### Tips for Farmers

**Get Faster Service**:
- Create requests during business hours (8 AM - 6 PM)
- Set realistic estimated prices
- Provide accurate pincode
- Be available on phone when provider calls

**Get Better Service**:
- Choose providers with high ratings (4+ stars)
- Read previous feedback
- Communicate clearly with provider
- Rate honestly after service

**Save Money**:
- Compare prices on map before requesting
- Request during off-peak hours
- Build relationships with good providers
- Rate providers to help others

---

## For Providers

### Getting Started

#### 1. Register as Provider

**Step 1**: Prepare your information:
- Phone number (will be your ID)
- Full name
- Service type (TRACTOR, LABOUR, or TRANSPORT)
- Location (pincode)
- Hourly rate
- GPS coordinates (optional, for map display)

**Step 2**: Submit registration

**Example**:
```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/provider \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "+919910890180",
    "name": "Ramesh Kumar",
    "service_type": "TRACTOR",
    "pincode": "411001",
    "price_per_hour": 500,
    "latitude": 18.5204,
    "longitude": 73.8567
  }'
```

**What Happens**:
- Unique provider ID created (PRV_9910890180)
- Initial rating set to 5.0 stars
- Status set to AVAILABLE
- You can now receive job requests

---

#### 2. Receive Job Notifications

**Via SMS**:

When a farmer creates a request matching your service:
1. You receive SMS within 2-3 seconds
2. SMS contains job details
3. You can accept by replying "YES"

**SMS Format**:
```
Helping Hand: New TRACTOR request from Rajesh Sharma in 411001.
Price: Rs500. Reply YES to accept. ID: a6706841
```

**Important**:
- Keep your phone on
- Check SMS regularly
- Respond quickly (first come, first served)
- Only accept if you're available

---

#### 3. Accept Jobs

**Method 1: Reply to SMS**

Simply reply:
```
YES
```

Other accepted replies: ACCEPT, Y, OK

**Method 2: Use Mobile App**

1. Open app
2. View available requests
3. Tap "Accept" button

**Method 3: Test Endpoint** (for testing only)

```bash
curl -X POST https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/test-accept \
  -H 'Content-Type: application/json' \
  -d '{"provider_phone": "+919910890180"}'
```

**What Happens After Acceptance**:
1. You receive confirmation SMS with farmer details
2. Farmer receives notification with your details
3. Your status changes to ON_JOB
4. You won't receive new requests until job is done

**Confirmation SMS**:
```
Request accepted! Farmer: Rajesh Sharma, Phone: +919910890180,
Location: 411001. ID: a6706841
```

---

#### 4. Complete the Service

**During Service**:
- Call farmer to coordinate
- Arrive on time
- Provide quality service
- Be professional

**After Service**:
- Farmer will rate you in the app
- Your rating will be updated
- Your status will change back to AVAILABLE
- You can receive new requests

---

#### 5. View Your Job History

**See All Your Jobs**:
```bash
curl "https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod/provider-jobs/PRV_+919910890180"
```

**You'll See**:
- Your current rating
- Total jobs completed
- Current availability status
- **Ongoing**: Current job details
- **Completed**: Past jobs with ratings

**Use Cases**:
- Track earnings
- See your ratings
- Review feedback
- Contact previous farmers

---

### Tips for Providers

**Get More Jobs**:
- Keep phone on and charged
- Respond quickly to SMS
- Maintain high rating (4+ stars)
- Be available during peak hours
- Update your location if you move

**Get Better Ratings**:
- Arrive on time
- Be professional
- Provide quality service
- Communicate clearly
- Be honest about capabilities

**Increase Earnings**:
- Accept jobs during peak hours
- Build reputation with good ratings
- Expand service area (nearby pincodes)
- Offer competitive pricing
- Be reliable and consistent

---

## Common Scenarios

### Scenario 1: Farmer Needs Urgent Tractor Service

**Farmer Actions**:
1. Create request with service_type=TRACTOR
2. Wait for SMS confirmation
3. Check status (should be NOTIFYING)
4. Wait for provider acceptance (usually < 5 minutes)
5. Call provider when matched
6. Complete and rate after service

**Provider Actions**:
1. Receive SMS notification
2. Reply "YES" immediately
3. Receive farmer details
4. Call farmer to coordinate
5. Provide service
6. Wait for farmer to complete and rate

---

### Scenario 2: Multiple Providers Try to Accept Same Request

**What Happens**:
1. Provider A replies "YES" at 10:00:00
2. Provider B replies "YES" at 10:00:01
3. System processes both simultaneously
4. Provider A's acceptance succeeds (atomic operation)
5. Provider B gets "already taken" error
6. Only Provider A is matched

**Result**: No double-booking, fair first-come-first-served

---

### Scenario 3: No Providers Available

**What Happens**:
1. Farmer creates request
2. System searches for providers
3. No available providers found in area
4. Request status set to NO_PROVIDERS_FOUND
5. Farmer notified

**Farmer Options**:
- Wait and try again later
- Increase estimated price
- Try different service type
- Expand search to nearby pincodes

---

### Scenario 4: Provider Wants to See Nearby Farmers

**Provider Actions**:
1. Open map view
2. See all requests in area
3. Filter by service type
4. View request details
5. Accept if interested

**Note**: This feature is coming in Phase 2

---

## Troubleshooting

### For Farmers

**Problem**: Request stuck in PENDING
- **Solution**: Wait 30 seconds, then check status again
- **Reason**: Matching takes a few seconds

**Problem**: Status shows NO_PROVIDERS_FOUND
- **Solution**: Try again later or increase price
- **Reason**: No available providers in your area

**Problem**: Provider not calling back
- **Solution**: Call provider directly (number shown when matched)
- **Reason**: Provider may be busy

**Problem**: Can't see request history
- **Solution**: Check your phone number is correct
- **Reason**: Phone number is used as ID

### For Providers

**Problem**: Not receiving SMS notifications
- **Solution**: Check phone number in registration
- **Reason**: Wrong number or phone off

**Problem**: SMS reply not working
- **Solution**: Use test endpoint or mobile app
- **Reason**: Twilio trial account limitation

**Problem**: Can't accept request (already taken)
- **Solution**: Wait for next request
- **Reason**: Another provider was faster

**Problem**: Status stuck on ON_JOB
- **Solution**: Wait for farmer to complete
- **Reason**: Only farmer can mark as complete

---

## FAQ

### General

**Q: Is there a mobile app?**
A: Yes, React Native apps for iOS and Android (coming soon)

**Q: Do I need internet?**
A: Yes, for API calls. SMS works without internet.

**Q: What languages are supported?**
A: Currently English. Hindi and regional languages coming in Phase 3.

**Q: Is my data secure?**
A: Yes, all data encrypted in transit and at rest.

### For Farmers

**Q: How much does it cost?**
A: Free for farmers. You only pay the provider's service fee.

**Q: Can I cancel a request?**
A: Not yet. This feature is coming in Phase 2.

**Q: Can I request multiple services?**
A: Yes, create separate requests for each service.

**Q: How do I pay the provider?**
A: Currently cash only. In-app payments coming in Phase 2.

### For Providers

**Q: How do I get paid?**
A: Currently cash from farmer. In-app payments coming in Phase 2.

**Q: Can I set my own prices?**
A: Yes, set your hourly rate during registration.

**Q: Can I work in multiple areas?**
A: Yes, update your pincode or add nearby pincodes.

**Q: How is my rating calculated?**
A: Average of all ratings from farmers.

---

## Support

**For Help**:
- Check this guide first
- Review API documentation
- Check CloudWatch logs (developers)
- Contact support team

**Report Issues**:
- Email: support@helpinghand.com
- Phone: +91-XXXX-XXXXXX
- In-app support (coming soon)

---

**Version**: 1.0  
**Last Updated**: March 1, 2026
