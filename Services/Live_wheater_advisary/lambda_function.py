import json
import os
import urllib.request
import urllib.error
from datetime import datetime
import boto3

OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', 'YOUR_OPENWEATHER_API_KEY')
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/onecall"

# Initialize Bedrock client
bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', os.environ.get('AWS_DEFAULT_REGION', 'ap-south-1')))

def lambda_handler(event, context):
    """Main Lambda handler for weather advisory"""
    try:
        body = json.loads(event.get('body', '{}'))
        lat = body.get('lat')
        lon = body.get('lon')
        activity = body.get('activity', 'spraying')
        
        if not lat or not lon:
            return error_response(400, "Missing lat or lon parameters")
        
        weather_data = fetch_weather(lat, lon)
        advisory = generate_advisory(weather_data, activity)
        
        # Generate user-friendly message using Bedrock
        friendly_message = generate_friendly_advisory(advisory)
        advisory['friendly_message'] = friendly_message
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(advisory)
        }
    
    except Exception as e:
        return error_response(500, f"Internal error: {str(e)}")

def fetch_weather(lat, lon):
    """Fetch weather data from OpenWeather API"""
    # Using current weather + forecast API (free tier compatible)
    current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    
    try:
        # Fetch current weather
        with urllib.request.urlopen(current_url, timeout=5) as response:
            current_data = json.loads(response.read().decode())
        
        # Fetch forecast
        with urllib.request.urlopen(forecast_url, timeout=5) as response:
            forecast_data = json.loads(response.read().decode())
        
        # Transform to unified format
        return {
            'lat': lat,
            'lon': lon,
            'current': {
                'temp': current_data['main']['temp'],
                'humidity': current_data['main']['humidity'],
                'wind_speed': current_data['wind']['speed'],
                'uvi': current_data.get('uvi', 0)  # May not be available
            },
            'hourly': [
                {
                    'pop': item.get('pop', 0),
                    'dt': item['dt']
                }
                for item in forecast_data['list'][:6]
            ]
        }
    except urllib.error.HTTPError as e:
        raise Exception(f"Weather API error: {e.code}")
    except Exception as e:
        raise Exception(f"Failed to fetch weather: {str(e)}")

def generate_advisory(weather_data, activity):
    """Generate agriculture advisory based on weather data"""
    current = weather_data.get('current', {})
    hourly = weather_data.get('hourly', [])[:6]
    
    # Extract key parameters
    temp = current.get('temp', 0)
    humidity = current.get('humidity', 0)
    wind_speed = current.get('wind_speed', 0) * 3.6  # m/s to km/h
    uv_index = current.get('uvi', 0)
    
    # Calculate rain probability in next 6 hours
    rain_prob = max([h.get('pop', 0) * 100 for h in hourly]) if hourly else 0
    
    # Apply spray safety rules
    spray_safe = True
    messages = []
    
    if rain_prob > 60:
        spray_safe = False
        messages.append("अगले 6 घंटों में बारिश की संभावना है")
    
    if wind_speed > 15:
        spray_safe = False
        messages.append("तेज हवा - दवा बह सकती है")
    
    if humidity > 80:
        messages.append("अधिक नमी - फफूंद का खतरा")
    
    if uv_index > 8:
        messages.append("तेज धूप - दोपहर में छिड़काव से बचें")
    
    if spray_safe and not messages:
        messages.append("छिड़काव के लिए अनुकूल मौसम")
    
    return {
        "location": f"Lat: {weather_data.get('lat')}, Lon: {weather_data.get('lon')}",
        "timestamp": datetime.utcnow().isoformat(),
        "rain_probability_next_6h": round(rain_prob, 1),
        "wind_speed": round(wind_speed, 1),
        "humidity": humidity,
        "temperature": round(temp, 1),
        "uv_index": round(uv_index, 1),
        "advisory": {
            "spray_safe": spray_safe,
            "messages": messages
        }
    }

def error_response(status_code, message):
    """Return error response"""
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'error': message})
    }

def generate_friendly_advisory(advisory_data):
    """Generate user-friendly advisory message using AWS Bedrock"""
    try:
        print("Calling Bedrock for friendly message generation...")
        # Prepare context for Bedrock
        spray_safe = advisory_data['advisory']['spray_safe']
        messages = advisory_data['advisory']['messages']
        weather_info = {
            'rain_probability': advisory_data['rain_probability_next_6h'],
            'wind_speed': advisory_data['wind_speed'],
            'humidity': advisory_data['humidity'],
            'temperature': advisory_data['temperature'],
            'uv_index': advisory_data['uv_index']
        }
        
        # Create prompt for Bedrock
        prompt = f"""आप एक कृषि सलाहकार हैं जो भारतीय किसानों की मदद कर रहे हैं। मौसम की स्थिति के आधार पर, 2-3 वाक्यों में सरल हिंदी में एक दोस्ताना सलाह संदेश दें।

मौसम की स्थिति:
- बारिश की संभावना (अगले 6 घंटे): {weather_info['rain_probability']}%
- हवा की गति: {weather_info['wind_speed']} किमी/घंटा
- नमी: {weather_info['humidity']}%
- तापमान: {weather_info['temperature']}°C
- UV सूचकांक: {weather_info['uv_index']}

छिड़काव सुरक्षा: {"सुरक्षित" if spray_safe else "असुरक्षित"}
तकनीकी संदेश: {', '.join(messages)}

किसान के लिए सरल हिंदी भाषा में एक दोस्ताना संदेश लिखें। अगर छिड़काव सुरक्षित नहीं है, तो समझाएं क्यों और कब छिड़काव करना चाहिए। अगर सुरक्षित है, तो उन्हें प्रोत्साहित करें और कोई सावधानियां बताएं।"""

        # Call Bedrock with Amazon Nova Lite model
        request_body = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            "inferenceConfig": {
                "max_new_tokens": 200,
                "temperature": 0.7
            }
        }
        
        response = bedrock_runtime.invoke_model(
            modelId='apac.amazon.nova-lite-v1:0',
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        friendly_message = response_body['output']['message']['content'][0]['text'].strip()
        
        print(f"Bedrock response received: {friendly_message[:100]}...")
        return friendly_message
        
    except Exception as e:
        print(f"Bedrock error: {str(e)}, using fallback message")
        # Fallback to simple message if Bedrock fails
        if advisory_data['advisory']['spray_safe']:
            return "मौसम की स्थिति छिड़काव के लिए अच्छी है। आप अपने खेत का काम सुरक्षित रूप से कर सकते हैं।"
        else:
            return f"अभी छिड़काव करने की सलाह नहीं दी जाती है। {' '.join(advisory_data['advisory']['messages'])}। कृपया बेहतर मौसम का इंतजार करें।"
