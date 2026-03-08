const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Table names - configure these based on your AWS setup
const TABLES = {
  FARMERS: process.env.FARMERS_TABLE || 'farmers_table',
  VOICE_QUERIES: process.env.VOICE_QUERIES_TABLE || 'voice_query_logs',
  WEATHER_ALERTS: process.env.WEATHER_ALERTS_TABLE || 'weather_alert_logs',
  IRRIGATION_ALERTS: process.env.IRRIGATION_ALERTS_TABLE || 'irrigation_alerts',
  SERVICE_REQUESTS: process.env.SERVICE_REQUESTS_TABLE || 'service_requests',
  MARKET_QUERIES: process.env.MARKET_QUERIES_TABLE || 'market_queries',
};

// Get total count from a table
const getTableCount = async (tableName) => {
  // TODO: Handle missing tables gracefully
  if (!tableName || tableName.includes('TODO')) {
    console.warn(`Table not configured: ${tableName}`);
    return 0;
  }
  
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Select: 'COUNT',
    });
    const response = await docClient.send(command);
    return response.Count || 0;
  } catch (error) {
    console.error(`Error counting ${tableName}:`, error);
    return 0;
  }
};

// Get today's count - tries multiple date field names
const getTodayCount = async (tableName, dateFields = ['timestamp', 'createdAt', 'created_at']) => {
  // TODO: Handle missing tables gracefully
  if (!tableName || tableName.includes('TODO')) {
    console.warn(`Table not configured: ${tableName}`);
    return 0;
  }
  
  const today = new Date().toISOString().split('T')[0];
  const todayTimestamp = new Date(today).getTime();
  
  // Try each date field
  for (const dateField of dateFields) {
    try {
      // Try ISO string format first
      const command = new ScanCommand({
        TableName: tableName,
        FilterExpression: 'begins_with(#date, :today)',
        ExpressionAttributeNames: { '#date': dateField },
        ExpressionAttributeValues: { ':today': today },
        Select: 'COUNT',
      });
      const response = await docClient.send(command);
      if (response.Count > 0) {
        return response.Count;
      }
    } catch (error) {
      // Field might not exist or wrong format, try next
      continue;
    }
  }
  
  // If no date field worked, try timestamp number format
  try {
    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: '#ts >= :todayStart',
      ExpressionAttributeNames: { '#ts': 'timestamp' },
      ExpressionAttributeValues: { ':todayStart': todayTimestamp },
      Select: 'COUNT',
    });
    const response = await docClient.send(command);
    return response.Count || 0;
  } catch (error) {
    console.error(`Error counting today's ${tableName}:`, error);
    return 0;
  }
};

// Get recent activity items
const getRecentActivity = async (limit = 10) => {
  const activities = [];
  
  try {
    // Fetch recent voice queries
    const voiceQueries = await docClient.send(new ScanCommand({
      TableName: TABLES.VOICE_QUERIES,
      Limit: 5,
    }));
    
    voiceQueries.Items?.forEach(item => {
      activities.push({
        type: 'voice_query',
        farmer: item.farmerId || item.farmer_id || item.farmer || 'Unknown',
        query: item.query || item.question,
        time: item.timestamp || item.createdAt || item.created_at,
      });
    });

    // Fetch recent service requests
    const serviceRequests = await docClient.send(new ScanCommand({
      TableName: TABLES.SERVICE_REQUESTS,
      Limit: 5,
    }));
    
    serviceRequests.Items?.forEach(item => {
      activities.push({
        type: 'service_request',
        service: item.serviceType || item.service_type || item.service,
        location: item.location || item.farmer_pincode || item.state,
        time: item.timestamp || item.createdAt || item.created_at,
      });
    });

    // Sort by time and limit
    return activities
      .sort((a, b) => {
        const timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime();
        const timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime();
        return timeB - timeA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return [];
  }
};

// Get farmer statistics by state
const getFarmersByState = async () => {
  try {
    const command = new ScanCommand({
      TableName: TABLES.FARMERS,
      ProjectionExpression: '#state',
      ExpressionAttributeNames: { '#state': 'state' },
    });
    const response = await docClient.send(command);
    
    const stateCounts = {};
    response.Items?.forEach(item => {
      const state = item.state || 'Unknown';
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });

    return Object.entries(stateCounts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch (error) {
    console.error('Error fetching farmers by state:', error);
    return [];
  }
};

// Get top queries
const getTopQueries = async (limit = 5) => {
  try {
    const command = new ScanCommand({
      TableName: TABLES.VOICE_QUERIES,
      ProjectionExpression: 'question',
    });
    const response = await docClient.send(command);
    
    const queryCounts = {};
    response.Items?.forEach(item => {
      const query = item.question || item.query || 'Unknown';
      if (query !== 'Unknown') {
        queryCounts[query] = (queryCounts[query] || 0) + 1;
      }
    });

    return Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query);
  } catch (error) {
    console.error('Error fetching top queries:', error);
    return [];
  }
};

module.exports = {
  TABLES,
  getTableCount,
  getTodayCount,
  getRecentActivity,
  getFarmersByState,
  getTopQueries,
};
