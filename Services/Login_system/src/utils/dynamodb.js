const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DYNAMODB_TABLE;

const getUser = async (phone) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { phone },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item;
};

const createUser = async (phone) => {
  const timestamp = new Date().toISOString();
  const params = {
    TableName: TABLE_NAME,
    Item: {
      phone,
      isProfileComplete: false,
      language: 'hi',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
  await dynamodb.put(params).promise();
  return params.Item;
};

const updateUserProfile = async (phone, profileData) => {
  const timestamp = new Date().toISOString();
  const params = {
    TableName: TABLE_NAME,
    Key: { phone },
    UpdateExpression: 'SET #name = :name, userType = :userType, totalLandArea = :totalLandArea, latitude = :latitude, longitude = :longitude, city = :city, #state = :state, isProfileComplete = :isProfileComplete, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#name': 'name',
      '#state': 'state',
    },
    ExpressionAttributeValues: {
      ':name': profileData.name,
      ':userType': profileData.userType,
      ':totalLandArea': profileData.totalLandArea,
      ':latitude': profileData.latitude,
      ':longitude': profileData.longitude,
      ':city': profileData.city,
      ':state': profileData.state,
      ':isProfileComplete': true,
      ':updatedAt': timestamp,
    },
    ReturnValues: 'ALL_NEW',
  };
  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};

module.exports = { getUser, createUser, updateUserProfile };
