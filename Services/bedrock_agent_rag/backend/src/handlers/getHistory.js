const { getConversationHistory, getSessionSummary } = require('../utils/contextManager');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { sessionId, limit = 10, includeSummary = false } = body;

    if (!sessionId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'sessionId is required' })
      };
    }

    const history = await getConversationHistory(sessionId, limit);
    
    const response = {
      sessionId,
      history,
      count: history.length
    };

    if (includeSummary) {
      response.summary = await getSessionSummary(sessionId);
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Get history error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
