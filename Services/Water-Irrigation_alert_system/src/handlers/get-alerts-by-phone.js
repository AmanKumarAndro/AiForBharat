const { query, scan } = require('../lib/dynamo');

exports.handler = async (event) => {
  try {
    let { phone } = event.pathParameters;
    
    // Decode URL-encoded phone number
    phone = decodeURIComponent(phone);
    
    if (!phone) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Phone number is required' })
      };
    }

    // Find farmer by phone number using GSI
    const farmers = await query(
      process.env.FARMERS_TABLE,
      'phone = :phone',
      { ':phone': phone },
      'phone-index'
    );

    if (farmers.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'No farmer found with this phone number',
          phone 
        })
      };
    }

    const farmer = farmers[0];
    const farmerId = farmer.pk.replace('farmer#', '');

    // Get all SMS alerts for this farmer
    const alerts = await query(
      process.env.SMS_LOG_TABLE,
      'pk = :pk',
      { ':pk': `farmer#${farmerId}` }
    );

    // Sort by timestamp (newest first)
    const sortedAlerts = alerts
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map(alert => ({
        alertId: alert.sk.replace('sms#', ''),
        timestamp: alert.updatedAt,
        messageType: alert.messageType,
        messageBody: alert.messageBody,
        deliveryStatus: alert.deliveryStatus,
        twilioSid: alert.twilioSid
      }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        phone,
        farmerId,
        farmerName: farmer.name,
        crop: farmer.crop,
        totalAlerts: sortedAlerts.length,
        alerts: sortedAlerts
      })
    };

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch alerts',
        message: error.message 
      })
    };
  }
};
