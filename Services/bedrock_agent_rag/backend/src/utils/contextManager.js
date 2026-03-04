const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' }));
const TABLE_NAME = process.env.DYNAMODB_TABLE;

// Store conversation turn
async function addConversationTurn(sessionId, question, answer, metadata = {}) {
  const timestamp = Date.now();
  
  await dynamoClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      sessionId,
      timestamp,
      question,
      answer,
      source: metadata.source || '',
      isLiveAnswer: metadata.isLiveAnswer || false,
      latency: metadata.latency || 0,
      ttl: Math.floor(Date.now() / 1000) + 86400 * 7 // 7 days
    }
  }));
}

// Get conversation history
async function getConversationHistory(sessionId, limit = 5) {
  try {
    const response = await dynamoClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit
    }));

    return (response.Items || []).reverse(); // Return oldest first for context
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}

// Build context-aware prompt
function buildContextPrompt(question, history, systemPrompt) {
  if (!history || history.length === 0) {
    return `${systemPrompt}

प्रश्न: ${question}

कृपया क्रमांकित चरणों में जवाब दें:`;
  }

  const conversationContext = history.map((turn, idx) => 
    `पिछला प्रश्न ${idx + 1}: ${turn.question}\nजवाब: ${turn.answer}`
  ).join('\n\n');

  return `${systemPrompt}

पिछली बातचीत:
${conversationContext}

वर्तमान प्रश्न: ${question}

कृपया पिछली बातचीत के संदर्भ में क्रमांकित चरणों में जवाब दें:`;
}

// Detect follow-up questions
function isFollowUpQuestion(question) {
  const followUpIndicators = [
    'और', 'फिर', 'उसके बाद', 'इसके बाद', 'कैसे', 'क्यों',
    'वह', 'यह', 'उस', 'इस', 'उसमें', 'इसमें',
    'more', 'then', 'after', 'that', 'this', 'it'
  ];
  
  const lowerQuestion = question.toLowerCase();
  return followUpIndicators.some(indicator => lowerQuestion.includes(indicator));
}

// Get session summary
async function getSessionSummary(sessionId) {
  const history = await getConversationHistory(sessionId, 10);
  
  return {
    sessionId,
    totalQuestions: history.length,
    firstQuestion: history[0]?.question || null,
    lastQuestion: history[history.length - 1]?.question || null,
    topics: extractTopics(history),
    duration: history.length > 0 ? 
      history[history.length - 1].timestamp - history[0].timestamp : 0
  };
}

// Extract topics from conversation
function extractTopics(history) {
  const topicKeywords = {
    wheat: ['गेहूं', 'wheat'],
    rice: ['धान', 'चावल', 'rice'],
    pest: ['कीट', 'pest', 'रोग', 'disease'],
    scheme: ['योजना', 'scheme', 'pm-kisan', 'subsidy', 'सब्सिडी'],
    soil: ['मिट्टी', 'soil', 'मृदा'],
    irrigation: ['सिंचाई', 'irrigation', 'पानी', 'water']
  };

  const topics = new Set();
  
  history.forEach(turn => {
    const text = `${turn.question} ${turn.answer}`.toLowerCase();
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.add(topic);
      }
    });
  });

  return Array.from(topics);
}

module.exports = {
  addConversationTurn,
  getConversationHistory,
  buildContextPrompt,
  isFollowUpQuestion,
  getSessionSummary,
  extractTopics
};
