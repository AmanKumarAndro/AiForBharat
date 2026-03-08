const db = require('./dynamodb');

// Aggregate overview metrics
const getOverview = async () => {
  const [
    totalFarmers,
    voiceQueriesToday,
    weatherAlerts,
    irrigationAlerts,
    serviceRequests,
    marketQueries,
  ] = await Promise.all([
    db.getTableCount(db.TABLES.FARMERS),
    db.getTodayCount(db.TABLES.VOICE_QUERIES),
    db.getTodayCount(db.TABLES.WEATHER_ALERTS),
    db.getTodayCount(db.TABLES.IRRIGATION_ALERTS),
    db.getTodayCount(db.TABLES.SERVICE_REQUESTS),
    db.getTodayCount(db.TABLES.MARKET_QUERIES),
  ]);

  return {
    totalFarmers,
    voiceQueriesToday,
    weatherAlerts,
    irrigationAlerts,
    serviceRequests,
    marketQueries,
  };
};

// Get farmer analytics
const getFarmerAnalytics = async () => {
  const [totalFarmers, newToday, topStates] = await Promise.all([
    db.getTableCount(db.TABLES.FARMERS),
    db.getTodayCount(db.TABLES.FARMERS, 'createdAt'),
    db.getFarmersByState(),
  ]);

  return {
    totalFarmers,
    newToday,
    topStates,
  };
};

// Get AI usage analytics
const getAIUsageAnalytics = async () => {
  const [totalQueries, topQueries] = await Promise.all([
    db.getTableCount(db.TABLES.VOICE_QUERIES),
    db.getTopQueries(),
  ]);

  return {
    totalQueries,
    avgResponseTime: '2.1s', // Mock - calculate from actual response time data
    topQueries,
  };
};

module.exports = {
  getOverview,
  getFarmerAnalytics,
  getAIUsageAnalytics,
};
