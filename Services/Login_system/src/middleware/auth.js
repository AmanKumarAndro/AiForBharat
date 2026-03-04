const { verifyToken } = require('../utils/jwt');
const { response } = require('../utils/response');

const authenticate = (handler) => {
  return async (event, context) => {
    try {
      const authHeader = event.headers.Authorization || event.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response(401, { success: false, message: 'Missing or invalid authorization header' });
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (!decoded) {
        return response(401, { success: false, message: 'Invalid or expired token' });
      }

      event.user = decoded;
      return await handler(event, context);
    } catch (error) {
      return response(500, { success: false, message: 'Authentication error' });
    }
  };
};

module.exports = { authenticate };
