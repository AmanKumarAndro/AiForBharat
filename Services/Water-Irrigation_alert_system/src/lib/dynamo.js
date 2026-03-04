const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function getItem(tableName, key) {
  const command = new GetCommand({ TableName: tableName, Key: key });
  const response = await docClient.send(command);
  return response.Item;
}

async function putItem(tableName, item) {
  const command = new PutCommand({ TableName: tableName, Item: item });
  await docClient.send(command);
}

async function updateItem(tableName, key, updates) {
  const updateExpression = 'SET ' + Object.keys(updates).map((k, i) => `#${k} = :val${i}`).join(', ');
  const expressionAttributeNames = Object.keys(updates).reduce((acc, k) => ({ ...acc, [`#${k}`]: k }), {});
  const expressionAttributeValues = Object.keys(updates).reduce((acc, k, i) => ({ ...acc, [`:val${i}`]: updates[k] }), {});

  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  });
  
  await docClient.send(command);
}

async function query(tableName, keyCondition, expressionAttributeValues, indexName = null) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionAttributeValues
  };
  
  if (indexName) {
    params.IndexName = indexName;
  }
  
  const command = new QueryCommand(params);
  const response = await docClient.send(command);
  return response.Items || [];
}

async function scan(tableName, filterExpression, expressionAttributeValues) {
  const params = { TableName: tableName };
  if (filterExpression) {
    params.FilterExpression = filterExpression;
    params.ExpressionAttributeValues = expressionAttributeValues;
  }
  const command = new ScanCommand(params);
  const response = await docClient.send(command);
  return response.Items || [];
}

module.exports = { getItem, putItem, updateItem, query, scan };
