const { query, updateItem } = require('../lib/dynamo');
const { EventBridgeClient, DisableRuleCommand, EnableRuleCommand } = require('@aws-sdk/client-eventbridge');

const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION || 'ap-south-1' });

exports.handler = async (event) => {
  try {
    const body = new URLSearchParams(event.body);
    const from = body.get('From');
    const messageBody = body.get('Body')?.trim().toUpperCase();

    // Find farmer by phone
    const farmers = await query(
      process.env.FARMERS_TABLE,
      'phone = :phone',
      { ':phone': from }
    );

    if (farmers.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/xml' },
        body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
      };
    }

    const farmer = farmers[0];
    const farmerId = farmer.pk.replace('farmer#', '');
    const ruleName = `irrigation-${farmerId}`;

    if (messageBody === 'STOP') {
      // Disable alerts
      await updateItem(process.env.FARMERS_TABLE, 
        { pk: farmer.pk, sk: 'profile' },
        { active: false }
      );

      // Disable EventBridge rule
      const disableCommand = new DisableRuleCommand({ Name: ruleName });
      await eventBridgeClient.send(disableCommand);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/xml' },
        body: '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed from KisanVoice irrigation alerts.</Message></Response>'
      };
    }

    if (messageBody === 'START') {
      // Re-enable alerts
      await updateItem(process.env.FARMERS_TABLE,
        { pk: farmer.pk, sk: 'profile' },
        { active: true }
      );

      // Enable EventBridge rule
      const enableCommand = new EnableRuleCommand({ Name: ruleName });
      await eventBridgeClient.send(enableCommand);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/xml' },
        body: '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Welcome back! Irrigation alerts reactivated.</Message></Response>'
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/xml' },
      body: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    };

  } catch (error) {
    console.error('Error in twilio-webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
