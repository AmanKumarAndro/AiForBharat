const { v4: uuidv4 } = require('uuid');
const { putItem, getItem } = require('../lib/dynamo');
const { sendSMS } = require('../lib/twilio');
const { buildConfirmationMessage } = require('../lib/sms-templates');
const { EventBridgeClient, PutRuleCommand, PutTargetsCommand } = require('@aws-sdk/client-eventbridge');

const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION || 'ap-south-1' });

async function resolveDistrictCoordinates(district) {
  // Load from static file or DynamoDB
  const coordinates = require('../data/district-coordinates.json');
  return coordinates[district] || { lat: 28.7041, lon: 77.1025 }; // Default Delhi
}

async function determineInitialStage(crop) {
  // Return first stage name based on crop
  const firstStages = {
    wheat: 'Crown Root',
    rice: 'Transplanting',
    maize: 'Germination',
    sugarcane: 'Germination',
    cotton: 'Emergence',
    mustard: 'Seedling'
  };
  return firstStages[crop] || 'Initial';
}

async function createEventBridgeRule(farmerId, alertTimeUtc) {
  const ruleName = `irrigation-${farmerId}`;
  
  // Create rule
  const putRuleCommand = new PutRuleCommand({
    Name: ruleName,
    ScheduleExpression: alertTimeUtc,
    State: 'ENABLED',
    Description: `Daily irrigation intelligence for farmer ${farmerId}`
  });
  
  await eventBridgeClient.send(putRuleCommand);
  
  // Add Lambda target
  const putTargetsCommand = new PutTargetsCommand({
    Rule: ruleName,
    Targets: [{
      Id: '1',
      Arn: process.env.DAILY_INTELLIGENCE_LAMBDA_ARN,
      Input: JSON.stringify({ farmerId })
    }]
  });
  
  await eventBridgeClient.send(putTargetsCommand);
  
  return `arn:aws:events:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:rule/${ruleName}`;
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const {
      name,
      phone,
      district,
      state,
      crop,
      sowingDate,
      areaAcres,
      irrMethod,
      alertTime = '17:00',
      language = 'auto', // 'en', 'hi', or 'auto' (auto-detect from phone)
      lat,  // Optional: User's GPS latitude
      lon   // Optional: User's GPS longitude
    } = body;

    // Validate inputs
    if (!phone || !district || !crop || !sowingDate || !areaAcres) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const farmerId = uuidv4();
    
    // Resolve coordinates
    // Priority: 1. User-provided GPS, 2. District lookup
    let coords;
    if (lat && lon) {
      // Use exact GPS coordinates from user
      coords = {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        source: 'gps'
      };
      console.log(`Using GPS coordinates: ${coords.lat}, ${coords.lon}`);
    } else {
      // Fallback to district-based coordinates
      coords = await resolveDistrictCoordinates(district);
      coords.source = 'district';
      console.log(`Using district coordinates for ${district}: ${coords.lat}, ${coords.lon}`);
    }
    
    // Determine initial stage
    const initialStage = await determineInitialStage(crop);
    
    // Calculate initial soil moisture
    const sowingDateObj = new Date(sowingDate);
    const today = new Date();
    const daysSinceSowing = Math.floor((today - sowingDateObj) / (1000 * 60 * 60 * 24));
    
    let initialSoilMoisture = 60; // Default for recent sowing
    if (daysSinceSowing > 5) {
      initialSoilMoisture = 50; // Estimated for older sowing
    }
    
    // Convert alert time to cron (17:00 IST = 11:30 UTC)
    const [hour, minute] = alertTime.split(':');
    const utcHour = (parseInt(hour) - 5) % 24; // IST to UTC rough conversion
    const cronExpression = `cron(${minute} ${utcHour} * * ? *)`;
    
    // Auto-detect language if set to 'auto'
    const detectedLanguage = language === 'auto' 
      ? (phone.startsWith('+91') ? 'hi' : 'en')
      : language;
    
    // Create EventBridge rule
    const ruleArn = await createEventBridgeRule(farmerId, cronExpression);
    
    // Write farmer profile
    await putItem(process.env.FARMERS_TABLE, {
      pk: `farmer#${farmerId}`,
      sk: 'profile',
      name,
      phone,
      district,
      state,
      lat: coords.lat,
      lon: coords.lon,
      coordinateSource: coords.source, // 'gps' or 'district'
      crop,
      sowingDate,
      areaAcres: parseFloat(areaAcres),
      irrMethod: irrMethod || 'flood',
      language: detectedLanguage,
      alertTimeUtc: cronExpression,
      eventBridgeRuleArn: ruleArn,
      active: true,
      createdAt: new Date().toISOString()
    });
    
    // Initialize soil state
    await putItem(process.env.SOIL_STATE_TABLE, {
      pk: `farmer#${farmerId}`,
      sk: 'state',
      soilMoistureMm: initialSoilMoisture,
      currentStage: initialStage,
      daysSinceSowing,
      lastRainfallMm: 0,
      lastDecision: 'none',
      consecutiveDryDays: 0,
      daysSinceLastSms: 0,
      updatedAt: new Date().toISOString()
    });
    
    // Send confirmation SMS
    const confirmationMsg = buildConfirmationMessage(crop, detectedLanguage);
    await sendSMS(phone, confirmationMsg);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        farmerId,
        crop,
        firstAlertDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        soilMoistureInit: initialSoilMoisture,
        coordinates: {
          lat: coords.lat,
          lon: coords.lon,
          source: coords.source
        },
        message: 'Registration successful'
      })
    };
    
  } catch (error) {
    console.error('Error in register-farmer-irrigation:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
