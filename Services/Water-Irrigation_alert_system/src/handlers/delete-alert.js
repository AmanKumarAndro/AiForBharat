const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const { farmerId, alertId } = event.pathParameters;
    
    if (!farmerId || !alertId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'farmerId and alertId are required' 
        })
      };
    }

    const pk = `farmer#${farmerId}`;
    const sk = `sms#${alertId}`;

    // Check if alert exists
    const getCommand = new GetCommand({
      TableName: process.env.SMS_LOG_TABLE,
      Key: { pk, sk }
    });

    const existingAlert = await docClient.send(getCommand);

    if (!existingAlert.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Alert not found',
          farmerId,
          alertId
        })
      };
    }

    // Delete the alert
    const deleteCommand = new DeleteCommand({
      TableName: process.env.SMS_LOG_TABLE,
      Key: { pk, sk }
    });

    await docClient.send(deleteCommand);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Alert deleted successfully',
        farmerId,
        alertId,
        deletedAlert: {
          messageType: existingAlert.Item.messageType,
          timestamp: existingAlert.Item.updatedAt
        }
      })
    };

  } catch (error) {
    console.error('Error deleting alert:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to delete alert',
        message: error.message 
      })
    };
  }
};
