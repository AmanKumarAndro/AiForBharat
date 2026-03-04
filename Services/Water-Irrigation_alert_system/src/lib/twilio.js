const twilio = require('twilio');
const { getSecrets } = require('./secrets');

let twilioClient = null;

async function getTwilioClient() {
  if (twilioClient) return twilioClient;
  
  const secrets = await getSecrets();
  twilioClient = twilio(secrets.TWILIO_ACCOUNT_SID, secrets.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

async function sendSMS(to, body) {
  const secrets = await getSecrets();
  const client = await getTwilioClient();
  
  const message = await client.messages.create({
    body,
    messagingServiceSid: secrets.TWILIO_MESSAGING_SERVICE_SID,
    to
  });

  return {
    sid: message.sid,
    status: message.status
  };
}

module.exports = { sendSMS };
