const { response } = require('../utils/response');
const { getUser, updateUserProfile } = require('../utils/dynamodb');
const { authenticate } = require('../middleware/auth');

const onboard = authenticate(async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { name, userType, totalLandArea, latitude, longitude, city, state } = body;
    const { phone } = event.user;

    if (!name || !userType || !totalLandArea || !latitude || !longitude || !city || !state) {
      return response(400, { success: false, message: 'All fields are required' });
    }

    if (!['farmer', 'provider'].includes(userType)) {
      return response(400, { success: false, message: 'userType must be either "farmer" or "provider"' });
    }

    if (typeof totalLandArea !== 'number' || totalLandArea <= 0) {
      return response(400, { success: false, message: 'totalLandArea must be a positive number' });
    }

    await updateUserProfile(phone, {
      name,
      userType,
      totalLandArea,
      latitude,
      longitude,
      city,
      state,
    });

    return response(200, { success: true, message: 'Profile completed successfully' });
  } catch (error) {
    console.error('Onboard error:', error);
    return response(500, { success: false, message: error.message });
  }
});

const getProfile = authenticate(async (event) => {
  try {
    const { phone } = event.user;
    const user = await getUser(phone);

    if (!user) {
      return response(404, { success: false, message: 'User not found' });
    }

    return response(200, user);
  } catch (error) {
    console.error('Get profile error:', error);
    return response(500, { success: false, message: error.message });
  }
});

module.exports = { onboard, getProfile };
