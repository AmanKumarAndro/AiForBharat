const { scan, query } = require('../lib/dynamo');
const { sendSMS } = require('../lib/twilio');
const { buildWeeklySummaryMessage } = require('../lib/sms-templates');

exports.handler = async (event) => {
  try {
    // Get all active farmers
    const farmers = await scan(
      process.env.FARMERS_TABLE,
      'active = :active AND sk = :sk',
      { ':active': true, ':sk': 'profile' }
    );

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    for (const farmer of farmers) {
      const farmerId = farmer.pk.replace('farmer#', '');

      // Get savings for last 7 days
      const savings = await query(
        process.env.SAVINGS_TABLE,
        'pk = :pk AND sk BETWEEN :start AND :end',
        {
          ':pk': `farmer#${farmerId}`,
          ':start': `saving#${oneWeekAgo}`,
          ':end': `saving#${today}`
        }
      );

      // Get SMS logs for last 7 days
      const smsLogs = await query(
        process.env.SMS_LOG_TABLE,
        'pk = :pk AND sk BETWEEN :start AND :end',
        {
          ':pk': `farmer#${farmerId}`,
          ':start': `sms#${oneWeekAgo}`,
          ':end': `sms#${today}`
        }
      );

      const weeklyLitresSaved = savings.reduce((sum, s) => sum + s.litresSaved, 0);
      const weeklyMoneySaved = savings.reduce((sum, s) => sum + s.moneySavedRs, 0);
      
      const irrigationsDone = smsLogs.filter(log => log.messageType === 'irrigate').length;
      const irrigationsSkipped = smsLogs.filter(log => log.messageType === 'skip').length;

      // Get season total (all savings for this farmer)
      const allSavings = await query(
        process.env.SAVINGS_TABLE,
        'pk = :pk',
        { ':pk': `farmer#${farmerId}` }
      );
      const seasonLitresSaved = allSavings.reduce((sum, s) => sum + s.litresSaved, 0);

      // Send weekly summary
      if (weeklyLitresSaved > 0 || irrigationsDone > 0) {
        const message = buildWeeklySummaryMessage(
          weeklyLitresSaved,
          weeklyMoneySaved,
          irrigationsDone,
          irrigationsSkipped,
          seasonLitresSaved
        );

        await sendSMS(farmer.phone, message);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Weekly summaries sent',
        farmerCount: farmers.length
      })
    };

  } catch (error) {
    console.error('Error in weekly-summary:', error);
    throw error;
  }
};
