const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Feature: Voice AI Sessions
const getVoiceAISessions = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'farmer-voice-ai-dev-sessions',
    }));
    
    return {
      total: response.Count || 0,
      sessions: response.Items || [],
      topQuestions: getTopItems(response.Items, 'question', 5),
      avgLatency: calculateAverage(response.Items, 'latency'),
    };
  } catch (error) {
    console.error('Error fetching voice AI sessions:', error);
    return { total: 0, sessions: [], topQuestions: [], avgLatency: 0 };
  }
};

// Feature: Helping Hand - Service Requests
const getServiceRequests = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'HH_Requests',
    }));
    
    const items = response.Items || [];
    
    return {
      total: response.Count || 0,
      requests: items,
      byStatus: groupBy(items, 'status'),
      byServiceType: groupBy(items, 'service_type'),
      totalRevenue: items.reduce((sum, item) => sum + (item.estimated_price || 0), 0),
      completedRequests: items.filter(item => item.status === 'COMPLETED').length,
    };
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return { total: 0, requests: [], byStatus: {}, byServiceType: {}, totalRevenue: 0, completedRequests: 0 };
  }
};

// Feature: Helping Hand - Providers
const getProviders = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'HH_Providers',
    }));
    
    return {
      total: response.Count || 0,
      providers: response.Items || [],
    };
  } catch (error) {
    console.error('Error fetching providers:', error);
    return { total: 0, providers: [] };
  }
};

// Feature: Helping Hand - Treatment Database
const getTreatmentDatabase = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'HH_TreatmentDB',
    }));
    
    return {
      total: response.Count || 0,
      treatments: response.Items || [],
      diseases: getUniqueValues(response.Items, 'disease_label'),
    };
  } catch (error) {
    console.error('Error fetching treatment database:', error);
    return { total: 0, treatments: [], diseases: [] };
  }
};

// Feature: Helping Hand - Banned Pesticides
const getBannedPesticides = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'HH_BannedPesticides',
    }));
    
    return {
      total: response.Count || 0,
      pesticides: response.Items || [],
    };
  } catch (error) {
    console.error('Error fetching banned pesticides:', error);
    return { total: 0, pesticides: [] };
  }
};

// Feature: Helping Hand - KVK Contacts
const getKVKContacts = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'HH_KVKContacts',
    }));
    
    return {
      total: response.Count || 0,
      contacts: response.Items || [],
      byDistrict: groupBy(response.Items, 'district'),
    };
  } catch (error) {
    console.error('Error fetching KVK contacts:', error);
    return { total: 0, contacts: [], byDistrict: {} };
  }
};

// Feature: Helping Hand - Pincode Mappings
const getPincodeMappings = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'HH_PincodeMappings',
    }));
    
    return {
      total: response.Count || 0,
      mappings: response.Items || [],
    };
  } catch (error) {
    console.error('Error fetching pincode mappings:', error);
    return { total: 0, mappings: [] };
  }
};

// Feature: Farmers
const getFarmers = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'kisanvoice-auth-api-dev-farmers',
    }));
    
    const items = response.Items || [];
    
    return {
      total: response.Count || 0,
      farmers: items,
      byState: groupBy(items, 'state'),
      byCity: groupBy(items, 'city'),
      byLanguage: groupBy(items, 'language'),
      totalLandArea: items.reduce((sum, item) => sum + (item.totalLandArea || 0), 0),
      profileComplete: items.filter(item => item.isProfileComplete).length,
    };
  } catch (error) {
    console.error('Error fetching farmers:', error);
    return { total: 0, farmers: [], byState: {}, byCity: {}, byLanguage: {}, totalLandArea: 0, profileComplete: 0 };
  }
};

// Get all logged-in users from all systems
const getAllLoggedInUsers = async () => {
  try {
    const [authFarmers, irrigationFarmers, serviceRequests] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: 'kisanvoice-auth-api-dev-farmers' })),
      docClient.send(new ScanCommand({ TableName: 'kisanvoice-irrigation-dev-farmers' })),
      docClient.send(new ScanCommand({ TableName: 'HH_Requests' })),
    ]);

    // Auth farmers
    const authUsers = (authFarmers.Items || []).map(item => ({
      source: 'auth',
      name: item.name,
      phone: item.phone,
      location: `${item.city}, ${item.state}`,
      language: item.language,
      landArea: item.totalLandArea,
      profileComplete: item.isProfileComplete,
      createdAt: item.createdAt,
      coordinates: { lat: item.latitude, lng: item.longitude },
    }));

    // Irrigation farmers
    const irrigationUsers = (irrigationFarmers.Items || []).map(item => ({
      source: 'irrigation',
      name: item.name,
      phone: item.pk || item.phone,
      location: item.location || item.state || 'N/A',
      createdAt: item.createdAt || item.created_at,
    }));

    // Unique farmers from service requests
    const uniqueServiceFarmers = {};
    (serviceRequests.Items || []).forEach(item => {
      const farmerId = item.farmer_id;
      if (farmerId && !uniqueServiceFarmers[farmerId]) {
        uniqueServiceFarmers[farmerId] = {
          source: 'service_requests',
          name: item.farmer_name,
          phone: farmerId,
          location: `Pincode: ${item.farmer_pincode}`,
          serviceCount: 1,
        };
      } else if (farmerId) {
        uniqueServiceFarmers[farmerId].serviceCount++;
      }
    });

    const serviceUsers = Object.values(uniqueServiceFarmers);

    // Combine and deduplicate by phone
    const allUsers = {};
    
    [...authUsers, ...irrigationUsers, ...serviceUsers].forEach(user => {
      const phone = user.phone;
      if (!allUsers[phone]) {
        allUsers[phone] = user;
      } else {
        // Merge data from multiple sources
        allUsers[phone] = {
          ...allUsers[phone],
          ...user,
          sources: [...(allUsers[phone].sources || [allUsers[phone].source]), user.source],
        };
      }
    });

    const users = Object.values(allUsers);

    return {
      total: users.length,
      bySource: {
        auth: authUsers.length,
        irrigation: irrigationUsers.length,
        serviceRequests: serviceUsers.length,
      },
      users: users.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      }),
    };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return { total: 0, bySource: {}, users: [] };
  }
};

// Feature: Irrigation - Crop Data
const getCropData = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'kisanvoice-irrigation-dev-crop-data',
    }));
    
    return {
      total: response.Count || 0,
      crops: response.Items || [],
    };
  } catch (error) {
    console.error('Error fetching crop data:', error);
    return { total: 0, crops: [] };
  }
};

// Feature: Irrigation - Farmers
const getIrrigationFarmers = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'kisanvoice-irrigation-dev-farmers',
    }));
    
    return {
      total: response.Count || 0,
      farmers: response.Items || [],
    };
  } catch (error) {
    console.error('Error fetching irrigation farmers:', error);
    return { total: 0, farmers: [] };
  }
};

// Feature: Irrigation - Monsoon Calendar
const getMonsoonCalendar = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'kisanvoice-irrigation-dev-monsoon-calendar',
    }));
    
    return {
      total: response.Count || 0,
      calendar: response.Items || [],
    };
  } catch (error) {
    console.error('Error fetching monsoon calendar:', error);
    return { total: 0, calendar: [] };
  }
};

// Feature: Irrigation - Savings
const getSavings = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'kisanvoice-irrigation-dev-savings',
    }));
    
    return {
      total: response.Count || 0,
      savings: response.Items || [],
    };
  } catch (error) {
    console.error('Error fetching savings:', error);
    return { total: 0, savings: [] };
  }
};

// Feature: Irrigation - SMS Log
const getSMSLog = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'kisanvoice-irrigation-dev-sms-log',
    }));
    
    return {
      total: response.Count || 0,
      logs: response.Items || [],
    };
  } catch (error) {
    console.error('Error fetching SMS log:', error);
    return { total: 0, logs: [] };
  }
};

// Feature: Irrigation - Soil State
const getSoilState = async () => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: 'kisanvoice-irrigation-dev-soil-state',
    }));
    
    return {
      total: response.Count || 0,
      soilStates: response.Items || [],
    };
  } catch (error) {
    console.error('Error fetching soil state:', error);
    return { total: 0, soilStates: [] };
  }
};

// Helper functions
const groupBy = (items, key) => {
  return items.reduce((acc, item) => {
    const value = item[key] || 'Unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
};

const getTopItems = (items, key, limit = 5) => {
  const counts = {};
  items.forEach(item => {
    const value = item[key];
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  });
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
};

const getUniqueValues = (items, key) => {
  return [...new Set(items.map(item => item[key]).filter(Boolean))];
};

const calculateAverage = (items, key) => {
  const values = items.map(item => item[key]).filter(v => typeof v === 'number');
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
};

// Main aggregator
const getAllFeatures = async () => {
  const [
    voiceAI,
    serviceRequests,
    providers,
    treatments,
    bannedPesticides,
    kvkContacts,
    pincodeMappings,
    farmers,
    cropData,
    irrigationFarmers,
    monsoonCalendar,
    savings,
    smsLog,
    soilState,
  ] = await Promise.all([
    getVoiceAISessions(),
    getServiceRequests(),
    getProviders(),
    getTreatmentDatabase(),
    getBannedPesticides(),
    getKVKContacts(),
    getPincodeMappings(),
    getFarmers(),
    getCropData(),
    getIrrigationFarmers(),
    getMonsoonCalendar(),
    getSavings(),
    getSMSLog(),
    getSoilState(),
  ]);

  return {
    voiceAI,
    helpingHand: {
      serviceRequests,
      providers,
      treatments,
      bannedPesticides,
      kvkContacts,
      pincodeMappings,
    },
    farmers,
    irrigation: {
      farmers: irrigationFarmers,
      cropData,
      monsoonCalendar,
      savings,
      smsLog,
      soilState,
    },
  };
};

module.exports = {
  getAllFeatures,
  getVoiceAISessions,
  getServiceRequests,
  getProviders,
  getTreatmentDatabase,
  getBannedPesticides,
  getKVKContacts,
  getPincodeMappings,
  getFarmers,
  getCropData,
  getIrrigationFarmers,
  getMonsoonCalendar,
  getSavings,
  getSMSLog,
  getSoilState,
  getAllLoggedInUsers,
};
