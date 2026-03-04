const { updateItem, query } = require('../lib/dynamo');

exports.handler = async (event) => {
  try {
    const body = new URLSearchParams(event.body);
    const messageSid = body.get('MessageSid');
    const messageStatus = body.get('MessageStatus');

    // Find SMS log entry by Twilio SID
    // This requires a GSI on twilioSid in sms-log table
    const logs = await query(
      process.env.SMS_LOG_TABLE,
      'twilioSid = :sid',
      { ':sid': messageSid }
    );

    if (logs.length > 0) {
      const log = logs[0];
      await updateItem(
        process.env.SMS_LOG_TABLE,
        { pk: log.pk, sk: log.sk },
        { 
          deliveryStatus: messageStatus,
          updatedAt: new Date().toISOString()
        }
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Status updated' })
    };

  } catch (error) {
    console.error('Error in twilio-status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
