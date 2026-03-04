const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

const sendOtp = async (phone) => {
  try {
    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: 'sms' });
    return { success: true, status: verification.status };
  } catch (error) {
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

const verifyOtp = async (phone, code) => {
  try {
    const verificationCheck = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
    return verificationCheck.status === 'approved';
  } catch (error) {
    throw new Error(`Failed to verify OTP: ${error.message}`);
  }
};

module.exports = { sendOtp, verifyOtp };
