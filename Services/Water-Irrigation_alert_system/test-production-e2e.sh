#!/bin/bash

################################################################################
# KisanVoice Production End-to-End Test Script
# 
# This script simulates the complete farmer lifecycle:
# 1. Register multiple farmers
# 2. Trigger daily intelligence
# 3. Check weather alerts
# 4. Get dashboard data
# 5. Retrieve alerts
# 6. Get crop calendar
# 7. Trigger weekly summary
# 8. Cleanup test data
#
# Usage: ./test-production-e2e.sh
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="https://ys4xa8tu60.execute-api.ap-south-1.amazonaws.com/dev"
REGION="ap-south-1"
TEST_PHONE_PREFIX="+9199999"
TIMESTAMP=$(date +%s)

# Test data arrays
declare -a FARMER_IDS=()
declare -a TEST_PHONES=()

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_step() {
    echo -e "${BLUE}→ $1${NC}"
}

# Check if command succeeded
check_result() {
    if [ $? -eq 0 ]; then
        print_success "$1"
        return 0
    else
        print_error "$1"
        return 1
    fi
}

# Wait with progress
wait_with_progress() {
    local seconds=$1
    local message=$2
    print_info "$message"
    for ((i=$seconds; i>0; i--)); do
        echo -ne "\r  Waiting: $i seconds remaining...  "
        sleep 1
    done
    echo -ne "\r  Done!                              \n"
}

################################################################################
# Test Functions
################################################################################

# Test 1: Register Farmers
test_register_farmers() {
    print_header "TEST 1: Register Farmers"
    
    # Test data for different scenarios
    local farmers=(
        "Rajesh Kumar:wheat:Karnal:29.6857:76.9905:5.0"
        "Suresh Patel:rice:Panipat:29.3909:76.9635:3.5"
        "Amit Singh:cotton:Hisar:29.1492:75.7217:10.0"
    )
    
    local index=0
    for farmer_data in "${farmers[@]}"; do
        IFS=':' read -r name crop district lat lon area <<< "$farmer_data"
        
        local phone="${TEST_PHONE_PREFIX}${index}${TIMESTAMP: -4}"
        TEST_PHONES+=("$phone")
        
        print_step "Registering: $name ($crop, $district)"
        
        local response=$(curl -s -X POST "${API_BASE_URL}/irrigation/register" \
            -H "Content-Type: application/json" \
            -d "{
                \"phone\": \"$phone\",
                \"name\": \"$name\",
                \"crop\": \"$crop\",
                \"district\": \"$district\",
                \"sowingDate\": \"2026-02-01\",
                \"areaAcres\": $area,
                \"lat\": $lat,
                \"lon\": $lon,
                \"language\": \"hi\"
            }")
        
        # Extract farmerId
        local farmer_id=$(echo "$response" | jq -r '.farmerId // empty')
        
        if [ -n "$farmer_id" ] && [ "$farmer_id" != "null" ]; then
            FARMER_IDS+=("$farmer_id")
            print_success "Registered $name - ID: $farmer_id"
            echo "  Phone: $phone"
            echo "  Crop: $crop"
            echo "  Location: $district ($lat, $lon)"
        else
            print_error "Failed to register $name"
            echo "  Response: $response"
        fi
        
        ((index++))
        sleep 1
    done
    
    echo ""
    print_info "Registered ${#FARMER_IDS[@]} farmers"
}

# Test 2: Verify Farmer Data
test_verify_farmers() {
    print_header "TEST 2: Verify Farmer Data in DynamoDB"
    
    for i in "${!FARMER_IDS[@]}"; do
        local farmer_id="${FARMER_IDS[$i]}"
        local phone="${TEST_PHONES[$i]}"
        
        print_step "Verifying farmer: $farmer_id"
        
        # Check in DynamoDB
        local db_result=$(aws dynamodb get-item \
            --table-name kisanvoice-irrigation-dev-farmers \
            --key "{\"pk\":{\"S\":\"farmer#$farmer_id\"},\"sk\":{\"S\":\"profile\"}}" \
            --region $REGION \
            2>&1)
        
        if echo "$db_result" | grep -q "\"phone\""; then
            print_success "Farmer data exists in DynamoDB"
        else
            print_error "Farmer data not found in DynamoDB"
        fi
        
        # Check EventBridge rule
        local rule_name="irrigation-$farmer_id"
        local rule_result=$(aws events describe-rule \
            --name "$rule_name" \
            --region $REGION \
            2>&1)
        
        if echo "$rule_result" | grep -q "State"; then
            print_success "EventBridge rule created: $rule_name"
        else
            print_error "EventBridge rule not found: $rule_name"
        fi
    done
}

# Test 3: Trigger Daily Intelligence
test_daily_intelligence() {
    print_header "TEST 3: Trigger Daily Intelligence"
    
    for i in "${!FARMER_IDS[@]}"; do
        local farmer_id="${FARMER_IDS[$i]}"
        
        print_step "Triggering daily intelligence for: $farmer_id"
        
        # Invoke Lambda
        local result=$(aws lambda invoke \
            --function-name kisanvoice-irrigation-dev-daily-intelligence \
            --region $REGION \
            --payload "{\"farmerId\":\"$farmer_id\"}" \
            /tmp/daily-intelligence-$i.json \
            2>&1)
        
        if [ $? -eq 0 ]; then
            local response=$(cat /tmp/daily-intelligence-$i.json)
            print_success "Daily intelligence executed"
            echo "  Response: $(echo $response | jq -c '.')"
        else
            print_error "Daily intelligence failed"
            echo "  Error: $result"
        fi
        
        sleep 2
    done
}

# Test 4: Check Weather Alerts
test_weather_alerts() {
    print_header "TEST 4: Trigger Weather Alert Check"
    
    print_step "Running weather alert check for all farmers"
    
    local result=$(aws lambda invoke \
        --function-name kisanvoice-irrigation-dev-weather-alert-check \
        --region $REGION \
        /tmp/weather-alerts.json \
        2>&1)
    
    if [ $? -eq 0 ]; then
        local response=$(cat /tmp/weather-alerts.json)
        print_success "Weather alert check executed"
        echo "  Response: $(echo $response | jq -c '.')"
    else
        print_error "Weather alert check failed"
        echo "  Error: $result"
    fi
}

# Test 5: Get Dashboard Data
test_dashboard() {
    print_header "TEST 5: Get Dashboard Data"
    
    for i in "${!FARMER_IDS[@]}"; do
        local farmer_id="${FARMER_IDS[$i]}"
        
        print_step "Fetching dashboard for: $farmer_id"
        
        local response=$(curl -s -X GET "${API_BASE_URL}/irrigation/dashboard/$farmer_id")
        
        # Check if response has required fields
        if echo "$response" | jq -e '.farmer and .weather and .farm' > /dev/null 2>&1; then
            print_success "Dashboard data retrieved"
            
            # Extract key metrics
            local temp=$(echo "$response" | jq -r '.weather.current.temperature')
            local soil=$(echo "$response" | jq -r '.farm.soil.moisturePercent')
            local progress=$(echo "$response" | jq -r '.farm.crop.progress')
            
            echo "  Temperature: ${temp}°C"
            echo "  Soil Moisture: ${soil}%"
            echo "  Crop Progress: ${progress}%"
        else
            print_error "Dashboard data incomplete"
            echo "  Response: $response"
        fi
        
        sleep 1
    done
}

# Test 6: Get Alerts by Phone
test_get_alerts() {
    print_header "TEST 6: Get Alerts by Phone"
    
    for i in "${!TEST_PHONES[@]}"; do
        local phone="${TEST_PHONES[$i]}"
        local encoded_phone=$(echo "$phone" | sed 's/+/%2B/g')
        
        print_step "Fetching alerts for: $phone"
        
        local response=$(curl -s -X GET "${API_BASE_URL}/irrigation/alerts/phone/$encoded_phone")
        
        # Check if response has alerts
        if echo "$response" | jq -e '.farmerId' > /dev/null 2>&1; then
            local total_alerts=$(echo "$response" | jq -r '.totalAlerts')
            print_success "Alerts retrieved: $total_alerts alerts"
            
            # Show alert types
            local irrigate=$(echo "$response" | jq -r '.alerts | map(select(.messageType == "irrigate")) | length')
            local skip=$(echo "$response" | jq -r '.alerts | map(select(.messageType == "skip")) | length')
            local weather=$(echo "$response" | jq -r '.alerts | map(select(.messageType | startswith("weather_"))) | length')
            
            echo "  Irrigate: $irrigate, Skip: $skip, Weather: $weather"
        else
            print_error "Failed to retrieve alerts"
            echo "  Response: $response"
        fi
        
        sleep 1
    done
}

# Test 7: Get Crop Calendar
test_crop_calendar() {
    print_header "TEST 7: Get Crop Calendar"
    
    local crops=("wheat" "rice" "cotton")
    
    for crop in "${crops[@]}"; do
        print_step "Fetching calendar for: $crop"
        
        local response=$(curl -s -X GET "${API_BASE_URL}/irrigation/crop-calendar/$crop?language=hi&currentDay=30")
        
        if echo "$response" | jq -e '.crop and .stages' > /dev/null 2>&1; then
            local progress=$(echo "$response" | jq -r '.overallProgress')
            local current_stage=$(echo "$response" | jq -r '.currentStage.name')
            
            print_success "Crop calendar retrieved"
            echo "  Progress: ${progress}%"
            echo "  Current Stage: $current_stage"
        else
            print_error "Failed to retrieve crop calendar"
            echo "  Response: $response"
        fi
        
        sleep 1
    done
}

# Test 8: Trigger Weekly Summary
test_weekly_summary() {
    print_header "TEST 8: Trigger Weekly Summary"
    
    print_step "Running weekly summary for all farmers"
    
    local result=$(aws lambda invoke \
        --function-name kisanvoice-irrigation-dev-weekly-summary \
        --region $REGION \
        /tmp/weekly-summary.json \
        2>&1)
    
    if [ $? -eq 0 ]; then
        local response=$(cat /tmp/weekly-summary.json)
        print_success "Weekly summary executed"
        echo "  Response: $(echo $response | jq -c '.')"
    else
        print_error "Weekly summary failed"
        echo "  Error: $result"
    fi
}

# Test 9: Check SMS Logs
test_sms_logs() {
    print_header "TEST 9: Check SMS Logs in DynamoDB"
    
    for i in "${!FARMER_IDS[@]}"; do
        local farmer_id="${FARMER_IDS[$i]}"
        
        print_step "Checking SMS logs for: $farmer_id"
        
        local logs=$(aws dynamodb query \
            --table-name kisanvoice-irrigation-dev-sms-log \
            --key-condition-expression "pk = :pk" \
            --expression-attribute-values "{\":pk\":{\"S\":\"farmer#$farmer_id\"}}" \
            --region $REGION \
            2>&1)
        
        if echo "$logs" | grep -q "Items"; then
            local count=$(echo "$logs" | jq '.Items | length')
            print_success "SMS logs found: $count messages"
        else
            print_error "No SMS logs found"
        fi
    done
}

# Test 10: Test Unregister
test_unregister() {
    print_header "TEST 10: Unregister Farmers"
    
    for i in "${!FARMER_IDS[@]}"; do
        local farmer_id="${FARMER_IDS[$i]}"
        
        print_step "Unregistering farmer: $farmer_id"
        
        local response=$(curl -s -X DELETE "${API_BASE_URL}/irrigation/unregister/$farmer_id?deleteLogs=true")
        
        if echo "$response" | jq -e '.message' | grep -q "successfully"; then
            print_success "Farmer unregistered"
            
            local deleted=$(echo "$response" | jq -r '.deletedItems | join(", ")')
            echo "  Deleted: $deleted"
        else
            print_error "Failed to unregister farmer"
            echo "  Response: $response"
        fi
        
        sleep 1
    done
}

# Test 11: Verify Cleanup
test_verify_cleanup() {
    print_header "TEST 11: Verify Cleanup"
    
    for i in "${!FARMER_IDS[@]}"; do
        local farmer_id="${FARMER_IDS[$i]}"
        
        print_step "Verifying cleanup for: $farmer_id"
        
        # Check DynamoDB
        local db_result=$(aws dynamodb get-item \
            --table-name kisanvoice-irrigation-dev-farmers \
            --key "{\"pk\":{\"S\":\"farmer#$farmer_id\"},\"sk\":{\"S\":\"profile\"}}" \
            --region $REGION \
            2>&1)
        
        if echo "$db_result" | grep -q "Item"; then
            print_error "Farmer still exists in DynamoDB"
        else
            print_success "Farmer removed from DynamoDB"
        fi
        
        # Check EventBridge rule
        local rule_name="irrigation-$farmer_id"
        local rule_result=$(aws events describe-rule \
            --name "$rule_name" \
            --region $REGION \
            2>&1)
        
        if echo "$rule_result" | grep -q "ResourceNotFoundException"; then
            print_success "EventBridge rule deleted"
        else
            print_error "EventBridge rule still exists"
        fi
    done
}

# Test 12: System Health Check
test_system_health() {
    print_header "TEST 12: System Health Check"
    
    # Check Lambda functions
    print_step "Checking Lambda functions"
    
    local functions=(
        "kisanvoice-irrigation-dev-register-farmer-irrigation"
        "kisanvoice-irrigation-dev-daily-intelligence"
        "kisanvoice-irrigation-dev-weather-alert-check"
        "kisanvoice-irrigation-dev-get-dashboard"
        "kisanvoice-irrigation-dev-get-alerts-by-phone"
        "kisanvoice-irrigation-dev-weekly-summary"
    )
    
    for func in "${functions[@]}"; do
        local status=$(aws lambda get-function \
            --function-name "$func" \
            --region $REGION \
            --query 'Configuration.State' \
            --output text \
            2>&1)
        
        if [ "$status" == "Active" ]; then
            print_success "$func is Active"
        else
            print_error "$func status: $status"
        fi
    done
    
    # Check DynamoDB tables
    print_step "Checking DynamoDB tables"
    
    local tables=(
        "kisanvoice-irrigation-dev-farmers"
        "kisanvoice-irrigation-dev-soil-state"
        "kisanvoice-irrigation-dev-sms-log"
        "kisanvoice-irrigation-dev-savings"
    )
    
    for table in "${tables[@]}"; do
        local status=$(aws dynamodb describe-table \
            --table-name "$table" \
            --region $REGION \
            --query 'Table.TableStatus' \
            --output text \
            2>&1)
        
        if [ "$status" == "ACTIVE" ]; then
            print_success "$table is ACTIVE"
        else
            print_error "$table status: $status"
        fi
    done
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header "KisanVoice Production E2E Test Suite"
    print_info "Starting comprehensive system test..."
    print_info "Timestamp: $(date)"
    print_info "Region: $REGION"
    print_info "API Base URL: $API_BASE_URL"
    echo ""
    
    # Confirm before running
    read -p "This will create test data in PRODUCTION. Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Test cancelled."
        exit 0
    fi
    
    # Run all tests
    test_register_farmers
    wait_with_progress 5 "Waiting for registration to propagate..."
    
    test_verify_farmers
    wait_with_progress 3 "Waiting before triggering alerts..."
    
    test_daily_intelligence
    wait_with_progress 5 "Waiting for SMS delivery..."
    
    test_weather_alerts
    wait_with_progress 3 "Waiting for weather alerts..."
    
    test_dashboard
    wait_with_progress 2 "Waiting before checking alerts..."
    
    test_get_alerts
    wait_with_progress 2 "Waiting before crop calendar..."
    
    test_crop_calendar
    wait_with_progress 2 "Waiting before weekly summary..."
    
    test_weekly_summary
    wait_with_progress 3 "Waiting before checking logs..."
    
    test_sms_logs
    wait_with_progress 2 "Waiting before cleanup..."
    
    test_unregister
    wait_with_progress 5 "Waiting for cleanup to complete..."
    
    test_verify_cleanup
    
    test_system_health
    
    # Print summary
    print_header "Test Summary"
    echo ""
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "All tests passed! ✨"
        exit 0
    else
        print_error "Some tests failed. Please review the output above."
        exit 1
    fi
}

# Run main function
main

