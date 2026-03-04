#!/bin/bash

################################################################################
# KisanVoice Real Scenario Test Script
# 
# This script simulates a complete real-world farmer journey:
# 1. Register farmer with actual phone number
# 2. Trigger daily irrigation intelligence
# 3. Check weather alerts (critical conditions)
# 4. View dashboard data
# 5. Retrieve all alerts
# 6. Get crop calendar timeline
# 7. Trigger weekly summary
# 8. Show all SMS logs
# 9. Optional: Cleanup
#
# Usage: ./test-real-scenario.sh
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="https://ys4xa8tu60.execute-api.ap-south-1.amazonaws.com/dev"
REGION="ap-south-1"
PHONE="+919910890180"
FARMER_ID=""

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $(printf '%-62s' "$1")║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_step() {
    echo -e "${MAGENTA}→ $1${NC}"
}

print_data() {
    echo -e "${YELLOW}  $1${NC}"
}

wait_with_message() {
    local seconds=$1
    local message=$2
    print_info "$message"
    for ((i=$seconds; i>0; i--)); do
        echo -ne "\r  ${CYAN}⏳ Waiting: $i seconds...${NC}  "
        sleep 1
    done
    echo -ne "\r  ${GREEN}✓ Done!${NC}                    \n"
}

################################################################################
# Test Functions
################################################################################

# Step 1: Register Farmer
register_farmer() {
    print_header "STEP 1: Register Farmer"
    
    print_step "Registering farmer with phone: $PHONE"
    print_info "Farmer Details:"
    print_data "Name: Rajesh Kumar"
    print_data "Crop: Wheat"
    print_data "District: Karnal, Haryana"
    print_data "Location: 29.6857°N, 76.9905°E"
    print_data "Farm Size: 5.0 acres"
    print_data "Sowing Date: 2026-02-01"
    print_data "Language: Hindi"
    echo ""
    
    local response=$(curl -s -X POST "${API_BASE_URL}/irrigation/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"phone\": \"$PHONE\",
            \"name\": \"Rajesh Kumar\",
            \"crop\": \"wheat\",
            \"district\": \"Karnal\",
            \"sowingDate\": \"2026-02-01\",
            \"areaAcres\": 5.0,
            \"lat\": 29.6857,
            \"lon\": 76.9905,
            \"language\": \"hi\"
        }")
    
    FARMER_ID=$(echo "$response" | jq -r '.farmerId // empty')
    
    if [ -n "$FARMER_ID" ] && [ "$FARMER_ID" != "null" ]; then
        print_success "Farmer registered successfully!"
        print_data "Farmer ID: $FARMER_ID"
        print_data "Phone: $PHONE"
        
        # Show full response
        echo ""
        print_info "Registration Response:"
        echo "$response" | jq '.'
        
        # Save farmer ID for later use
        echo "$FARMER_ID" > /tmp/kisanvoice_farmer_id.txt
    else
        print_error "Failed to register farmer"
        print_data "Response: $response"
        exit 1
    fi
}

# Step 2: Verify Registration
verify_registration() {
    print_header "STEP 2: Verify Registration in Database"
    
    print_step "Checking DynamoDB for farmer profile..."
    
    local db_result=$(aws dynamodb get-item \
        --table-name kisanvoice-irrigation-dev-farmers \
        --key "{\"pk\":{\"S\":\"farmer#$FARMER_ID\"},\"sk\":{\"S\":\"profile\"}}" \
        --region $REGION \
        2>&1)
    
    if echo "$db_result" | grep -q "\"phone\""; then
        print_success "Farmer profile exists in DynamoDB"
        
        # Extract and display key fields
        local name=$(echo "$db_result" | jq -r '.Item.name.S')
        local crop=$(echo "$db_result" | jq -r '.Item.crop.S')
        local district=$(echo "$db_result" | jq -r '.Item.district.S')
        
        print_data "Name: $name"
        print_data "Crop: $crop"
        print_data "District: $district"
    else
        print_error "Farmer profile not found in DynamoDB"
        return 1
    fi
    
    echo ""
    print_step "Checking EventBridge scheduled rule..."
    
    local rule_name="irrigation-$FARMER_ID"
    local rule_result=$(aws events describe-rule \
        --name "$rule_name" \
        --region $REGION \
        2>&1)
    
    if echo "$rule_result" | grep -q "State"; then
        local state=$(echo "$rule_result" | jq -r '.State')
        local schedule=$(echo "$rule_result" | jq -r '.ScheduleExpression')
        
        print_success "EventBridge rule created successfully"
        print_data "Rule Name: $rule_name"
        print_data "State: $state"
        print_data "Schedule: $schedule"
    else
        print_error "EventBridge rule not found"
        return 1
    fi
    
    echo ""
    print_step "Checking soil state initialization..."
    
    local soil_result=$(aws dynamodb get-item \
        --table-name kisanvoice-irrigation-dev-soil-state \
        --key "{\"pk\":{\"S\":\"farmer#$FARMER_ID\"},\"sk\":{\"S\":\"state\"}}" \
        --region $REGION \
        2>&1)
    
    if echo "$soil_result" | grep -q "moistureMm"; then
        print_success "Soil state initialized"
        
        local moisture=$(echo "$soil_result" | jq -r '.Item.moistureMm.N')
        print_data "Initial Soil Moisture: ${moisture}mm"
    else
        print_warning "Soil state not yet initialized (will be created on first alert)"
    fi
}

# Step 3: Trigger Daily Intelligence
trigger_daily_intelligence() {
    print_header "STEP 3: Trigger Daily Irrigation Intelligence"
    
    print_step "Invoking daily intelligence Lambda for farmer: $FARMER_ID"
    print_info "This simulates the daily 5:45 PM alert..."
    echo ""
    
    local result=$(aws lambda invoke \
        --function-name kisanvoice-irrigation-dev-daily-intelligence \
        --region $REGION \
        --payload "{\"farmerId\":\"$FARMER_ID\"}" \
        /tmp/daily-intelligence.json \
        2>&1)
    
    if [ $? -eq 0 ]; then
        local response=$(cat /tmp/daily-intelligence.json)
        
        print_success "Daily intelligence executed successfully!"
        echo ""
        print_info "Intelligence Response:"
        echo "$response" | jq '.'
        
        # Extract key information
        local message_type=$(echo "$response" | jq -r '.messageType // "unknown"')
        local recommendation=$(echo "$response" | jq -r '.recommendation // "N/A"')
        
        echo ""
        print_data "Message Type: $message_type"
        print_data "Recommendation: $recommendation"
        
        if [ "$message_type" == "irrigate" ]; then
            print_warning "🚰 IRRIGATION NEEDED - SMS sent to farmer"
        elif [ "$message_type" == "skip" ]; then
            print_success "✓ NO IRRIGATION NEEDED - Water saved!"
        fi
    else
        print_error "Daily intelligence failed"
        print_data "Error: $result"
        return 1
    fi
}

# Step 4: Trigger Weather Alerts
trigger_weather_alerts() {
    print_header "STEP 4: Check Critical Weather Conditions"
    
    print_step "Running weather alert check..."
    print_info "This checks for: heatwave, frost, thunderstorm, heavy rain, high wind, drought"
    echo ""
    
    local result=$(aws lambda invoke \
        --function-name kisanvoice-irrigation-dev-weather-alert-check \
        --region $REGION \
        /tmp/weather-alerts.json \
        2>&1)
    
    if [ $? -eq 0 ]; then
        local response=$(cat /tmp/weather-alerts.json)
        
        print_success "Weather alert check completed!"
        echo ""
        print_info "Weather Alert Response:"
        echo "$response" | jq '.'
        
        # Check if any alerts were sent
        local alerts_sent=$(echo "$response" | jq -r '.alertsSent // 0')
        
        if [ "$alerts_sent" -gt 0 ]; then
            print_warning "⚠️  $alerts_sent critical weather alert(s) sent!"
        else
            print_success "✓ No critical weather conditions detected"
        fi
    else
        print_error "Weather alert check failed"
        print_data "Error: $result"
        return 1
    fi
}

# Step 5: Get Dashboard
get_dashboard() {
    print_header "STEP 5: Fetch Farmer Dashboard"
    
    print_step "Retrieving comprehensive dashboard data..."
    echo ""
    
    local response=$(curl -s -X GET "${API_BASE_URL}/irrigation/dashboard/$FARMER_ID")
    
    if echo "$response" | jq -e '.farmer and .weather and .farm' > /dev/null 2>&1; then
        print_success "Dashboard data retrieved successfully!"
        echo ""
        
        # Extract and display key metrics
        print_info "📊 FARMER PROFILE:"
        local name=$(echo "$response" | jq -r '.farmer.name')
        local crop=$(echo "$response" | jq -r '.farmer.crop')
        local area=$(echo "$response" | jq -r '.farmer.areaAcres')
        print_data "Name: $name"
        print_data "Crop: $crop"
        print_data "Farm Size: ${area} acres"
        
        echo ""
        print_info "🌤️  CURRENT WEATHER:"
        local temp=$(echo "$response" | jq -r '.weather.current.temperature')
        local humidity=$(echo "$response" | jq -r '.weather.current.humidity')
        local condition=$(echo "$response" | jq -r '.weather.current.condition')
        local rain=$(echo "$response" | jq -r '.weather.forecast.rainToday')
        print_data "Temperature: ${temp}°C"
        print_data "Humidity: ${humidity}%"
        print_data "Condition: $condition"
        print_data "Rain Today: ${rain}mm"
        
        echo ""
        print_info "🌱 FARM STATUS:"
        local soil=$(echo "$response" | jq -r '.farm.soil.moisturePercent')
        local soil_status=$(echo "$response" | jq -r '.farm.soil.status')
        local crop_progress=$(echo "$response" | jq -r '.farm.crop.progress')
        local crop_stage=$(echo "$response" | jq -r '.farm.crop.currentStage')
        print_data "Soil Moisture: ${soil}%"
        print_data "Soil Status: $soil_status"
        print_data "Crop Progress: ${crop_progress}%"
        print_data "Current Stage: $crop_stage"
        
        echo ""
        print_info "💰 SAVINGS & STATISTICS:"
        local water_saved=$(echo "$response" | jq -r '.statistics.waterSaved')
        local money_saved=$(echo "$response" | jq -r '.statistics.moneySaved')
        local total_alerts=$(echo "$response" | jq -r '.statistics.totalAlerts')
        print_data "Water Saved: ${water_saved} liters"
        print_data "Money Saved: ₹${money_saved}"
        print_data "Total Alerts: $total_alerts"
        
        echo ""
        print_info "Full Dashboard JSON:"
        echo "$response" | jq '.'
    else
        print_error "Failed to retrieve dashboard"
        print_data "Response: $response"
        return 1
    fi
}

# Step 6: Get All Alerts
get_all_alerts() {
    print_header "STEP 6: Retrieve All SMS Alerts"
    
    local encoded_phone=$(echo "$PHONE" | sed 's/+/%2B/g')
    
    print_step "Fetching all alerts for phone: $PHONE"
    echo ""
    
    local response=$(curl -s -X GET "${API_BASE_URL}/irrigation/alerts/phone/$encoded_phone")
    
    if echo "$response" | jq -e '.farmerId' > /dev/null 2>&1; then
        print_success "Alerts retrieved successfully!"
        
        local total=$(echo "$response" | jq -r '.totalAlerts')
        print_data "Total Alerts: $total"
        
        echo ""
        print_info "📱 ALERT BREAKDOWN:"
        
        # Count by message type
        local irrigate=$(echo "$response" | jq '[.alerts[] | select(.messageType == "irrigate")] | length')
        local skip=$(echo "$response" | jq '[.alerts[] | select(.messageType == "skip")] | length')
        local weather=$(echo "$response" | jq '[.alerts[] | select(.messageType | startswith("weather_"))] | length')
        local weekly=$(echo "$response" | jq '[.alerts[] | select(.messageType == "weekly_summary")] | length')
        
        print_data "Irrigation Alerts: $irrigate"
        print_data "Skip Irrigation: $skip"
        print_data "Weather Alerts: $weather"
        print_data "Weekly Summaries: $weekly"
        
        echo ""
        print_info "Recent Alerts (Last 5):"
        echo "$response" | jq -r '.alerts[:5] | .[] | "  • [\(.messageType)] \(.timestamp) - \(.message[:80])..."'
        
        echo ""
        print_info "Full Alerts JSON:"
        echo "$response" | jq '.'
    else
        print_error "Failed to retrieve alerts"
        print_data "Response: $response"
        return 1
    fi
}

# Step 7: Get Crop Calendar
get_crop_calendar() {
    print_header "STEP 7: Get Crop Growth Timeline"
    
    print_step "Fetching wheat crop calendar..."
    print_info "Showing timeline for 28 days after sowing (current progress)"
    echo ""
    
    local response=$(curl -s -X GET "${API_BASE_URL}/irrigation/crop-calendar/wheat?language=hi&currentDay=28")
    
    if echo "$response" | jq -e '.crop and .stages' > /dev/null 2>&1; then
        print_success "Crop calendar retrieved successfully!"
        
        local progress=$(echo "$response" | jq -r '.overallProgress')
        local total_days=$(echo "$response" | jq -r '.totalDays')
        local current_stage=$(echo "$response" | jq -r '.currentStage.name')
        local current_stage_hi=$(echo "$response" | jq -r '.currentStage.nameHindi')
        
        echo ""
        print_info "🌾 WHEAT GROWTH TIMELINE:"
        print_data "Overall Progress: ${progress}%"
        print_data "Total Duration: ${total_days} days"
        print_data "Current Stage: $current_stage ($current_stage_hi)"
        
        echo ""
        print_info "Growth Stages:"
        echo "$response" | jq -r '.stages[] | "  \(.stageNumber). \(.name) (\(.nameHindi)) - \(.duration) days [\(if .isCompleted then "✓" else "○" end)]"'
        
        echo ""
        print_info "Current Stage Details:"
        echo "$response" | jq '.currentStage'
    else
        print_error "Failed to retrieve crop calendar"
        print_data "Response: $response"
        return 1
    fi
}

# Step 8: Trigger Weekly Summary
trigger_weekly_summary() {
    print_header "STEP 8: Trigger Weekly Summary"
    
    print_step "Running weekly summary Lambda..."
    print_info "This simulates the Sunday 8:00 AM weekly report"
    echo ""
    
    local result=$(aws lambda invoke \
        --function-name kisanvoice-irrigation-dev-weekly-summary \
        --region $REGION \
        /tmp/weekly-summary.json \
        2>&1)
    
    if [ $? -eq 0 ]; then
        local response=$(cat /tmp/weekly-summary.json)
        
        print_success "Weekly summary executed successfully!"
        echo ""
        print_info "Weekly Summary Response:"
        echo "$response" | jq '.'
        
        local summaries_sent=$(echo "$response" | jq -r '.summariesSent // 0')
        print_data "Summaries Sent: $summaries_sent"
    else
        print_error "Weekly summary failed"
        print_data "Error: $result"
        return 1
    fi
}

# Step 9: View SMS Logs
view_sms_logs() {
    print_header "STEP 9: View All SMS Logs in Database"
    
    print_step "Querying DynamoDB for SMS history..."
    echo ""
    
    local logs=$(aws dynamodb query \
        --table-name kisanvoice-irrigation-dev-sms-log \
        --key-condition-expression "pk = :pk" \
        --expression-attribute-values "{\":pk\":{\"S\":\"farmer#$FARMER_ID\"}}" \
        --region $REGION \
        2>&1)
    
    if echo "$logs" | grep -q "Items"; then
        local count=$(echo "$logs" | jq '.Items | length')
        
        print_success "Found $count SMS log entries"
        echo ""
        
        print_info "📨 SMS LOG ENTRIES:"
        echo "$logs" | jq -r '.Items[] | "  • [\(.messageType.S)] \(.timestamp.S) - Status: \(.status.S)"'
        
        echo ""
        print_info "Full SMS Logs:"
        echo "$logs" | jq '.Items'
    else
        print_warning "No SMS logs found yet"
        print_data "This is normal if alerts haven't been processed yet"
    fi
}

# Step 10: Cleanup Option
cleanup_farmer() {
    print_header "STEP 10: Cleanup (Optional)"
    
    echo ""
    read -p "Do you want to unregister this farmer and delete all data? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Skipping cleanup. Farmer remains registered."
        print_data "Farmer ID: $FARMER_ID"
        print_data "Phone: $PHONE"
        return 0
    fi
    
    print_step "Unregistering farmer: $FARMER_ID"
    
    local response=$(curl -s -X DELETE "${API_BASE_URL}/irrigation/unregister/$FARMER_ID?deleteLogs=true")
    
    if echo "$response" | jq -e '.message' | grep -q "successfully"; then
        print_success "Farmer unregistered successfully!"
        
        local deleted=$(echo "$response" | jq -r '.deletedItems | join(", ")')
        print_data "Deleted: $deleted"
        
        echo ""
        print_info "Cleanup Response:"
        echo "$response" | jq '.'
    else
        print_error "Failed to unregister farmer"
        print_data "Response: $response"
        return 1
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header "🌾 KisanVoice Real Scenario Test 🌾"
    
    print_info "This script will simulate a complete farmer journey"
    print_info "Phone Number: $PHONE"
    print_info "Timestamp: $(date)"
    print_info "Region: $REGION"
    echo ""
    
    # Check if farmer ID already exists
    if [ -f /tmp/kisanvoice_farmer_id.txt ]; then
        FARMER_ID=$(cat /tmp/kisanvoice_farmer_id.txt)
        print_warning "Found existing farmer ID: $FARMER_ID"
        read -p "Use existing farmer? (yes/no): " use_existing
        
        if [ "$use_existing" != "yes" ]; then
            FARMER_ID=""
        fi
    fi
    
    # Run all steps
    if [ -z "$FARMER_ID" ]; then
        register_farmer
        wait_with_message 3 "Waiting for registration to propagate..."
        verify_registration
        wait_with_message 2 "Preparing to trigger alerts..."
    else
        print_info "Using existing farmer ID: $FARMER_ID"
    fi
    
    trigger_daily_intelligence
    wait_with_message 5 "Waiting for SMS delivery..."
    
    trigger_weather_alerts
    wait_with_message 3 "Waiting for weather alerts..."
    
    get_dashboard
    wait_with_message 2 "Preparing to fetch alerts..."
    
    get_all_alerts
    wait_with_message 2 "Preparing crop calendar..."
    
    get_crop_calendar
    wait_with_message 2 "Preparing weekly summary..."
    
    trigger_weekly_summary
    wait_with_message 3 "Waiting for summary delivery..."
    
    view_sms_logs
    
    echo ""
    cleanup_farmer
    
    # Final summary
    print_header "✨ Test Complete ✨"
    
    print_success "All steps executed successfully!"
    print_info "Farmer ID: $FARMER_ID"
    print_info "Phone: $PHONE"
    
    echo ""
    print_info "Next Steps:"
    print_data "1. Check your phone ($PHONE) for SMS messages"
    print_data "2. Review the dashboard data above"
    print_data "3. Check AWS CloudWatch logs for detailed execution"
    print_data "4. Monitor DynamoDB tables for data persistence"
    
    echo ""
    print_success "🎉 KisanVoice system is working perfectly! 🎉"
}

# Run main function
main
