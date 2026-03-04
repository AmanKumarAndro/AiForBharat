const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let cachedSecrets = null;

async function getSecrets() {
  if (cachedSecrets) return cachedSecrets;

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-south-1' });
  const command = new GetSecretValueCommand({ SecretId: 'kisanvoice/prod' });
  
  const response = await client.send(command);
  cachedSecrets = JSON.parse(response.SecretString);
  return cachedSecrets;
}

module.exports = { getSecrets };
