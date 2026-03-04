#!/bin/bash

# Setup script for AWS Secrets Manager
# This script will prompt for credentials and create the secret

echo "=========================================="
echo "KisanVoice Irrigation - Secrets Setup"
echo "=========================================="
echo ""

# Check if secret already exists
SECRET_EXISTS=$(aws secretsmanager describe-secret --secret-id kisanvoice/prod --region ap-south-1 2>&1)

if [[ $SECRET_EXISTS == *"ResourceNotFoundException"* ]]; then
    echo "Secret does not exist. Creating new secret..."
    
    echo ""
    echo "Please provide the following credentials:"
    echo ""
    
    # Prompt for Twilio credentials
    echo "1. TWILIO CREDENTIALS"
    echo "   Get these from: https://console.twilio.com"
    echo ""
    read -p "   Twilio Account SID (starts with AC): " TWILIO_SID
    read -p "   Twilio Auth Token: " TWILIO_TOKEN
    read -p "   Twilio Messaging Service SID (starts with MG): " TWILIO_MSG_SID
    
    echo ""
    echo "2. OPENWEATHERMAP API KEY"
    echo "   Get this from: https://openweathermap.org/api"
    echo "   (Free tier works fine - 1000 calls/day)"
    echo ""
    read -p "   OpenWeatherMap API Key: " OPENWEATHER_KEY
    
    # Create the secret
    echo ""
    echo "Creating secret in AWS Secrets Manager..."
    
    aws secretsmanager create-secret \
        --name kisanvoice/prod \
        --region ap-south-1 \
        --secret-string "{
            \"TWILIO_ACCOUNT_SID\": \"$TWILIO_SID\",
            \"TWILIO_AUTH_TOKEN\": \"$TWILIO_TOKEN\",
            \"TWILIO_MESSAGING_SERVICE_SID\": \"$TWILIO_MSG_SID\",
            \"OPENWEATHER_API_KEY\": \"$OPENWEATHER_KEY\"
        }" \
        --description "KisanVoice Irrigation credentials"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Secret created successfully!"
    else
        echo ""
        echo "❌ Failed to create secret. Please check your AWS permissions."
        exit 1
    fi
else
    echo "✅ Secret 'kisanvoice/prod' already exists in ap-south-1"
    echo ""
    read -p "Do you want to update it? (y/n): " UPDATE_SECRET
    
    if [ "$UPDATE_SECRET" = "y" ]; then
        echo ""
        echo "Please provide the following credentials:"
        echo ""
        
        # Prompt for Twilio credentials
        echo "1. TWILIO CREDENTIALS"
        read -p "   Twilio Account SID (starts with AC): " TWILIO_SID
        read -p "   Twilio Auth Token: " TWILIO_TOKEN
        read -p "   Twilio Messaging Service SID (starts with MG): " TWILIO_MSG_SID
        
        echo ""
        echo "2. OPENWEATHERMAP API KEY"
        read -p "   OpenWeatherMap API Key: " OPENWEATHER_KEY
        
        # Update the secret
        echo ""
        echo "Updating secret..."
        
        aws secretsmanager update-secret \
            --secret-id kisanvoice/prod \
            --region ap-south-1 \
            --secret-string "{
                \"TWILIO_ACCOUNT_SID\": \"$TWILIO_SID\",
                \"TWILIO_AUTH_TOKEN\": \"$TWILIO_TOKEN\",
                \"TWILIO_MESSAGING_SERVICE_SID\": \"$TWILIO_MSG_SID\",
                \"OPENWEATHER_API_KEY\": \"$OPENWEATHER_KEY\"
            }"
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Secret updated successfully!"
        else
            echo ""
            echo "❌ Failed to update secret."
            exit 1
        fi
    fi
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Run: npx serverless deploy --stage dev"
echo "2. Run: npm run seed:crops"
echo "3. Run: npm run seed:monsoon"
echo "4. Test registration endpoint"
echo ""
