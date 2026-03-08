const { success, error } = require('./utils/response');
const aggregator = require('./services/aggregator');
const db = require('./services/dynamodb');
const features = require('./services/features');

// Main Lambda handler
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const path = event.path || event.rawPath;
  const method = event.httpMethod || event.requestContext?.http?.method;

  // Route handling
  try {
    if (method !== 'GET') {
      return error('Method not allowed', 405);
    }

    switch (path) {
      case '/dashboard/overview':
        return await handleOverview();
      
      case '/dashboard/activity':
        return await handleActivity(event);
      
      case '/dashboard/farmers':
        return await handleFarmers();
      
      case '/dashboard/ai-usage':
        return await handleAIUsage();
      
      case '/dashboard/alerts':
        return await handleAlerts();
      
      case '/dashboard/services':
        return await handleServices();
      
      case '/dashboard/features':
        return await handleAllFeatures();
      
      case '/dashboard/features/voice-ai':
        return await handleVoiceAI();
      
      case '/dashboard/features/helping-hand':
        return await handleHelpingHand();
      
      case '/dashboard/features/irrigation':
        return await handleIrrigation();
      
      case '/dashboard/users':
        return await handleAllUsers();
      
      default:
        return error('Not found', 404);
    }
  } catch (err) {
    console.error('Error:', err);
    return error(err.message || 'Internal server error');
  }
};

// Handler functions
const handleOverview = async () => {
  const data = await aggregator.getOverview();
  return success(data);
};

const handleActivity = async (event) => {
  const limit = parseInt(event.queryStringParameters?.limit || '10');
  const activities = await db.getRecentActivity(limit);
  return success(activities);
};

const handleFarmers = async () => {
  const data = await aggregator.getFarmerAnalytics();
  return success(data);
};

const handleAIUsage = async () => {
  const data = await aggregator.getAIUsageAnalytics();
  return success(data);
};

const handleAlerts = async () => {
  const [weatherAlerts, irrigationAlerts] = await Promise.all([
    db.getTodayCount(db.TABLES.WEATHER_ALERTS),
    db.getTodayCount(db.TABLES.IRRIGATION_ALERTS),
  ]);

  return success({
    weatherAlerts,
    irrigationAlerts,
    total: weatherAlerts + irrigationAlerts,
  });
};

const handleServices = async () => {
  const serviceRequests = await db.getTodayCount(db.TABLES.SERVICE_REQUESTS);
  
  return success({
    totalRequests: serviceRequests,
    todayRequests: serviceRequests,
  });
};

// New feature handlers
const handleAllFeatures = async () => {
  const data = await features.getAllFeatures();
  return success(data);
};

const handleVoiceAI = async () => {
  const data = await features.getVoiceAISessions();
  return success(data);
};

const handleHelpingHand = async () => {
  const [serviceRequests, providers, treatments, bannedPesticides, kvkContacts, pincodeMappings] = await Promise.all([
    features.getServiceRequests(),
    features.getProviders(),
    features.getTreatmentDatabase(),
    features.getBannedPesticides(),
    features.getKVKContacts(),
    features.getPincodeMappings(),
  ]);
  
  return success({
    serviceRequests,
    providers,
    treatments,
    bannedPesticides,
    kvkContacts,
    pincodeMappings,
  });
};

const handleIrrigation = async () => {
  const [farmers, cropData, monsoonCalendar, savings, smsLog, soilState] = await Promise.all([
    features.getIrrigationFarmers(),
    features.getCropData(),
    features.getMonsoonCalendar(),
    features.getSavings(),
    features.getSMSLog(),
    features.getSoilState(),
  ]);
  
  return success({
    farmers,
    cropData,
    monsoonCalendar,
    savings,
    smsLog,
    soilState,
  });
};

const handleAllUsers = async () => {
  const data = await features.getAllLoggedInUsers();
  return success(data);
};
