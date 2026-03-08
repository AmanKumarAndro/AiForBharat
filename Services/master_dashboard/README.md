# Master Analytics API

A serverless analytics API for aggregating and serving farmer data across multiple AWS DynamoDB tables.

## Overview

This API provides a unified dashboard interface for monitoring farmer activities, service requests, irrigation data, and AI interactions across the KisanVoice platform.

## Quick Start

```bash
# Install dependencies
npm install

# Deploy to AWS
npm run deploy

# Run locally
npm run local
```

## Project Structure

```
├── src/
│   ├── index.js              # Main Lambda handler & routing
│   ├── services/
│   │   ├── aggregator.js     # Data aggregation logic
│   │   ├── dynamodb.js       # DynamoDB operations
│   │   └── features.js       # Feature-specific queries
│   └── utils/
│       └── response.js       # HTTP response helpers
├── scripts/                  # Utility scripts
└── serverless.yml           # AWS deployment config
```

## Environment

- Runtime: Node.js 18.x
- Region: ap-south-1 (Mumbai)
- Memory: 512 MB
- Timeout: 10 seconds

## Documentation

- [FEATURES.md](FEATURES.md) - Feature descriptions and capabilities
- [SPEC.md](SPEC.md) - Technical specifications
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API endpoints reference
- [USER_MANUAL.md](USER_MANUAL.md) - Usage guide

## License

Proprietary
