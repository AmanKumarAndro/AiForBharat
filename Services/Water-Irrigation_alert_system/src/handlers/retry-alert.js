const { sendSMS } = require('../lib/twilio');
const { updateItem } = require('../lib/dynamo');

exports.handler = async (event) => {
  try {
    // Process messages from DLQ
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      const { farmerId, phone, messageBody, smsLogKey } = message;

      try {
        // Retry sending SMS
        const result = await sendSMS(phone, messageBody);

        // Update SMS log with retry status
        await updateItem(
          process.env.SMS_LOG_TABLE,
          smsLogKey,
          {
            deliveryStatus: result.status,
            retryAttempt: 1,
            updatedAt: new Date().toISOString()
          }
        );

        console.log(`Retry successful for farmer ${farmerId}`);

      } catch (retryError) {
        console.error(`Retry failed for farmer ${farmerId}:`, retryError);

        // Mark as permanently failed
        await updateItem(
          process.env.SMS_LOG_TABLE,
          smsLogKey,
          {
            deliveryStatus: 'failed',
            retryAttempt: 1,
            failureReason: retryError.message,
            updatedAt: new Date().toISOString()
          }
        );
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Retry processing complete' })
    };

  } catch (error) {
    console.error('Error in retry-alert:', error);
    throw error;
  }
};
