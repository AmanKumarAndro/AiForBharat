const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { EventBridgeClient, RemoveTargetsCommand, DeleteRuleCommand } = require('@aws-sdk/client-eventbridge');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION || 'ap-south-1' });

/**
 * Unregister Farmer - Delete farmer account and stop all alerts
 * 
 * This endpoint:
 * 1. Deletes the farmer profile from DynamoDB
 * 2. Deletes the EventBridge rule (stops scheduled alerts)
 * 3. Deletes the soil state
 * 4. Optionally deletes all SMS logs
 * 
 * Path: DELETE /irrigation/unregister/{farmerId}
 * Query Params: ?deleteLogs=true (optional, default: false)
 */
exports.handler = async (event) => {
  try {
    const { farmerId } = event.pathParameters;
    const deleteLogs = event.queryStringParameters?.deleteLogs === 'true';
    
    if (!farmerId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'farmerId is required' 
        })
      };
    }

    const pk = `farmer#${farmerId}`;
    
    // Step 1: Get farmer profile to retrieve EventBridge rule ARN
    console.log(`Fetching farmer profile: ${farmerId}`);
    const getCommand = new GetCommand({
      TableName: process.env.FARMERS_TABLE,
      Key: { pk, sk: 'profile' }
    });

    const farmerResult = await docClient.send(getCommand);

    if (!farmerResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Farmer not found',
          farmerId 
        })
      };
    }

    const farmer = farmerResult.Item;
    const deletionSummary = {
      farmerId,
      farmerName: farmer.name,
      phone: farmer.phone,
      crop: farmer.crop,
      deletedItems: []
    };

    // Step 2: Delete EventBridge Rule (stop scheduled alerts)
    if (farmer.eventBridgeRuleArn) {
      try {
        const ruleName = `irrigation-${farmerId}`;
        console.log(`Deleting EventBridge rule: ${ruleName}`);
        
        // Remove targets first
        const removeTargetsCommand = new RemoveTargetsCommand({
          Rule: ruleName,
          Ids: ['1']
        });
        await eventBridgeClient.send(removeTargetsCommand);
        
        // Delete rule
        const deleteRuleCommand = new DeleteRuleCommand({
          Name: ruleName
        });
        await eventBridgeClient.send(deleteRuleCommand);
        
        deletionSummary.deletedItems.push('EventBridge rule (scheduled alerts stopped)');
        console.log(`EventBridge rule deleted: ${ruleName}`);
      } catch (error) {
        console.error('Error deleting EventBridge rule:', error);
        // Continue even if rule deletion fails
      }
    }

    // Step 3: Delete Farmer Profile
    console.log(`Deleting farmer profile: ${farmerId}`);
    const deleteFarmerCommand = new DeleteCommand({
      TableName: process.env.FARMERS_TABLE,
      Key: { pk, sk: 'profile' }
    });
    await docClient.send(deleteFarmerCommand);
    deletionSummary.deletedItems.push('Farmer profile');

    // Step 4: Delete Soil State
    console.log(`Deleting soil state: ${farmerId}`);
    try {
      const deleteSoilCommand = new DeleteCommand({
        TableName: process.env.SOIL_STATE_TABLE,
        Key: { pk, sk: 'state' }
      });
      await docClient.send(deleteSoilCommand);
      deletionSummary.deletedItems.push('Soil state');
    } catch (error) {
      console.error('Error deleting soil state:', error);
      // Continue even if soil state deletion fails
    }

    // Step 5: Delete SMS Logs (optional)
    if (deleteLogs) {
      console.log(`Deleting SMS logs: ${farmerId}`);
      try {
        // Query all SMS logs for this farmer
        const queryCommand = new QueryCommand({
          TableName: process.env.SMS_LOG_TABLE,
          KeyConditionExpression: 'pk = :pk',
          ExpressionAttributeValues: {
            ':pk': pk
          }
        });
        
        const smsLogs = await docClient.send(queryCommand);
        
        if (smsLogs.Items && smsLogs.Items.length > 0) {
          // Delete each SMS log
          for (const log of smsLogs.Items) {
            const deleteLogCommand = new DeleteCommand({
              TableName: process.env.SMS_LOG_TABLE,
              Key: { pk: log.pk, sk: log.sk }
            });
            await docClient.send(deleteLogCommand);
          }
          deletionSummary.deletedItems.push(`${smsLogs.Items.length} SMS logs`);
          console.log(`Deleted ${smsLogs.Items.length} SMS logs`);
        }
      } catch (error) {
        console.error('Error deleting SMS logs:', error);
        // Continue even if SMS log deletion fails
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Farmer unregistered successfully',
        ...deletionSummary,
        note: deleteLogs 
          ? 'All data including SMS history has been deleted' 
          : 'SMS history preserved. Add ?deleteLogs=true to delete it'
      })
    };

  } catch (error) {
    console.error('Error unregistering farmer:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to unregister farmer',
        message: error.message 
      })
    };
  }
};
