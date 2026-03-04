const { response } = require('../utils/response');
const { sendOtp: sendOtpService, verifyOtp: verifyOtpService } = require('../utils/twilio');
const { getUser, createUser } = require('../utils/dynamodb');
const { generateToken } = require('../utils/jwt');

const sendOtp = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { phone } = body;

    if (!phone || !phone.match(/^\+\d{10,15}$/)) {
      return response(400, { success: false, message: 'Invalid phone number format' });
    }

    await sendOtpService(phone);
    return response(200, { success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return response(500, { success: false, message: error.message });
  }
};

const verifyOtp = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { phone, otp } = body;

    if (!phone || !otp) {
      return response(400, { success: false, message: 'Phone and OTP are required' });
    }

    const isValid = await verifyOtpService(phone, otp);

    if (!isValid) {
      return response(400, { success: false, message: 'Invalid OTP' });
    }

    let user = await getUser(phone);
    if (!user) {
      user = await createUser(phone);
    }

    const token = generateToken(phone);

    return response(200, {
      success: true,
      token,
      isProfileComplete: user.isProfileComplete || false,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return response(500, { success: false, message: error.message });
  }
};

module.exports = { sendOtp, verifyOtp };
