#!/usr/bin/env python3
"""
Verify phone numbers in Twilio account for SMS testing
"""

from twilio.rest import Client
import os

# Load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
except ImportError:
    pass

# Twilio credentials (loaded from environment variables)
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')

# Numbers to verify
numbers_to_verify = [
    '+919910890180',
    '+918860672275',
    '+919122069695'
]

def verify_numbers():
    """Send verification codes to phone numbers"""
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    print("=" * 60)
    print("TWILIO NUMBER VERIFICATION")
    print("=" * 60)
    print()
    
    for number in numbers_to_verify:
        try:
            print(f"📱 Sending verification code to {number}...")
            
            validation_request = client.validation_requests.create(
                phone_number=number,
                friendly_name=f"Provider {number[-4:]}"
            )
            
            print(f"   ✓ Verification code sent!")
            print(f"   Validation Code: {validation_request.validation_code}")
            print()
            
        except Exception as e:
            print(f"   ✗ Error: {e}")
            print()
    
    print("=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print("1. Check your phones for verification codes")
    print("2. Enter codes at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified")
    print("3. Or use the Twilio Console to manually add verified numbers")
    print()
    print("ALTERNATIVE: Upgrade to paid account ($20 minimum) to skip verification")
    print("=" * 60)

if __name__ == '__main__':
    verify_numbers()
