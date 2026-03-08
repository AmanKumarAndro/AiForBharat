// API response helpers
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(body),
});

const success = (data) => createResponse(200, data);
const error = (message, statusCode = 500) => createResponse(statusCode, { error: message });

module.exports = { success, error };
