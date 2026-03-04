const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const DYNAMO_TABLE_NAME = process.env.DYNAMO_TABLE_NAME;

/**
 * Lambda handler for query_farmer_database tool
 * Scans DynamoDB table with FilterExpression on crop and problem fields
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract parameters from Bedrock Agent event
    const parameters = event.parameters || [];
    let keyword = '';
    let queryType = 'general';

    for (const param of parameters) {
      if (param.name === 'keyword') {
        keyword = param.value;
      } else if (param.name === 'query_type') {
        queryType = param.value;
      }
    }

    if (!keyword) {
      return formatAgentResponse(event, {
        error: 'keyword parameter is required',
        results: []
      });
    }

    if (!DYNAMO_TABLE_NAME) {
      return formatAgentResponse(event, {
        error: 'DYNAMO_TABLE_NAME environment variable not configured',
        results: []
      });
    }

    console.log(`Querying DynamoDB: keyword="${keyword}", queryType="${queryType}"`);

    // Build FilterExpression for crop and problem fields
    const filterExpression = 'contains(#crop, :keyword) OR contains(#problem, :keyword)';
    const expressionAttributeNames = {
      '#crop': 'crop',
      '#problem': 'problem'
    };
    const expressionAttributeValues = {
      ':keyword': { S: keyword }
    };

    // Scan DynamoDB table
    const scanCommand = new ScanCommand({
      TableName: DYNAMO_TABLE_NAME,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: 20 // Limit results to avoid large responses
    });

    const response = await dynamoClient.send(scanCommand);

    // Unmarshall DynamoDB items to regular JSON
    const results = (response.Items || []).map(item => unmarshall(item));

    console.log(`Found ${results.length} matching records`);

    // Format results for agent
    const formattedResults = results.map(record => ({
      farmer_id: record.farmerId || record.sessionId || 'unknown',
      crop: record.crop || record.question || '',
      problem: record.problem || record.answer || '',
      solution: record.solution || record.answer || '',
      region: record.region || 'unknown',
      date: record.timestamp || record.createdAt || Date.now()
    }));

    return formatAgentResponse(event, {
      query: keyword,
      query_type: queryType,
      count: formattedResults.length,
      results: formattedResults
    });

  } catch (error) {
    console.error('DynamoDB query error:', error);
    return formatAgentResponse(event, {
      error: error.message,
      results: []
    });
  }
};

/**
 * Format response for Bedrock Agent
 */
function formatAgentResponse(event, data) {
  return {
    messageVersion: '1.0',
    response: {
      actionGroup: event.actionGroup,
      function: event.function,
      functionResponse: {
        responseBody: {
          TEXT: {
            body: JSON.stringify(data)
          }
        }
      }
    }
  };
}
