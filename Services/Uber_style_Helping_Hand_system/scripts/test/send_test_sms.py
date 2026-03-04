#!/usr/bin/env python3
import os
from twilio.rest import Client

# Load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
except ImportError:
    pass

# Twilio credentials (loaded from environment variables)
account_sid = os.environ.get('TWILIO_ACCOUNT_SID', '')
auth_token = os.environ.get('TWILIO_AUTH_TOKEN', '')
twilio_number = os.environ.get('TWILIO_PHONE_NUMBER', '+16187025334')

# Test number
test_number = '+919910890180'

# Create Twilio client
client = Client(account_sid, auth_token)

# Send test SMS
try:
    message = client.messages.create(
        from_=twilio_number,
        body='🚜 Helping Hand Test: Your Twilio SMS integration is working! This is a test message from your hackathon project.',
        to=test_number
    )
    
    print(f"✅ SMS sent successfully!")
    print(f"Message SID: {message.sid}")
    print(f"Status: {message.status}")
    print(f"To: {test_number}")
    print(f"\nCheck your phone for the message!")
    
except Exception as e:
    print(f"❌ Error sending SMS: {e}")
    print(f"\nNote: If you're using a trial account, you need to verify +919910890180 first at:")
    print(f"https://console.twilio.com/us1/develop/phone-numbers/manage/verified")
