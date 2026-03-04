# KisanVoice Authentication API

Serverless authentication and farmer onboarding system for KisanVoice AI platform.

## Overview

This API provides OTP-based phone authentication and user profile management for farmers and service providers. Built on AWS serverless architecture for scalability and cost-efficiency.

## Features

- Phone number authentication via OTP (Twilio Verify)
- JWT-based session management (7-day expiry)
- User profile onboarding and management
- Support for both farmers and service providers
- Serverless architecture with auto-scaling

## Tech Stack

- **Runtime**: Node.js 18.x
- **Framework**: Serverless Framework
- **Cloud Provider**: AWS (Lambda, API Gateway, DynamoDB)
- **Authentication**: Twilio Verify API + JWT
- **Database**: DynamoDB (on-demand billing)

## Quick Start

### Prerequisites

- Node.js 18+ installed
- AWS CLI configured with appropriate credentials
- Twilio account with Verify service enabled

### Installation

```bash
npm install
```

### Configuration

Store secrets in AWS Systems Manager Parameter Store:

```bash
aws ssm put-parameter --name /kisanvoice/dev/jwt-secret --value "your-secret-key" --type SecureString
aws ssm put-parameter --name /kisanvoice/dev/twilio-account-sid --value "your-twilio-sid" --type SecureString
aws ssm put-parameter --name /kisanvoice/dev/twilio-auth-token --value "your-twilio-token" --type SecureString
aws ssm put-parameter --name /kisanvoice/dev/twilio-verify-service-sid --value "your-verify-sid" --type SecureString
```

### Deployment

```bash
# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/send-otp` | Send OTP to phone | No |
| POST | `/auth/verify-otp` | Verify OTP and get token | No |
| POST | `/farmer/onboard` | Complete user profile | Yes |
| GET | `/farmer/profile` | Get user profile | Yes |

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and infrastructure
- [API Documentation](./docs/API.md) - Detailed API reference
- [User Guide](./docs/USER_GUIDE.md) - Integration guide for developers
- [Specification](./docs/SPEC.md) - Technical specifications

## Project Structure

```
.
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── auth.js        # Authentication endpoints
│   │   └── farmer.js      # Profile management endpoints
│   ├── middleware/        # Custom middleware
│   │   └── auth.js        # JWT authentication middleware
│   └── utils/             # Utility functions
│       ├── dynamodb.js    # Database operations
│       ├── jwt.js         # JWT token management
│       ├── response.js    # HTTP response helper
│       └── twilio.js      # Twilio integration
├── serverless.yml         # Serverless configuration
└── package.json
```

## Testing

Import the Postman collection for testing:
- File: `KisanVoice_API.postman_collection.json`

## Environment Variables

The following environment variables are configured via `serverless.yml`:

- `DYNAMODB_TABLE` - DynamoDB table name
- `JWT_SECRET` - Secret key for JWT signing
- `TWILIO_ACCOUNT_SID` - Twilio account identifier
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_VERIFY_SERVICE_SID` - Twilio Verify service identifier

## License

Proprietary - KisanVoice AI

## Support

For issues or questions, contact the development team.
