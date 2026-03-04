# Commodity Market Analyzer

AI-powered agricultural commodity price analysis platform using AWS Lambda, Amazon Bedrock (Nova), and React Native.

## Overview

A serverless application that provides real-time agricultural commodity market data analysis for Indian markets. Access 77.5M+ records from data.gov.in with FREE AI-powered insights using Amazon Nova.

## Key Features

- **77.5M+ Market Records**: Complete Indian agricultural market data
- **FREE AI Analysis**: Amazon Nova model (no payment required)
- **Multi-Platform**: Web, iOS, and Android support
- **Real-Time Data**: Live commodity prices and market trends
- **Serverless Architecture**: Auto-scaling AWS Lambda backend
- **Type-Safe**: Full TypeScript support for React Native
- **Offline Support**: Caching and retry mechanisms
- **Zero Setup**: Deploy in 10 minutes

## Quick Start

### Prerequisites

- AWS Account
- AWS CLI configured
- AWS SAM CLI installed
- Python 3.11+

### Deploy Backend (5 minutes)

```bash
sam build
sam deploy --guided
```

### Deploy Frontend (2 minutes)

```bash
./deploy-frontend.sh YOUR_BUCKET YOUR_API_URL
```

### Integrate React Native (5 minutes)

```bash
cp -r react-native/ your-app/src/
# Update API URL in src/react-native/api.ts
```

## Documentation

- **[Architecture](ARCHITECTURE.md)** - System design and components
- **[Specification](SPECIFICATION.md)** - Technical specifications
- **[User Guide](USER-GUIDE.md)** - How to use the application
- **[API Documentation](API-DOCUMENTATION.md)** - Complete API reference
- **[Features](FEATURES.md)** - Detailed feature documentation

## Tech Stack

- **Backend**: Python 3.13, AWS Lambda, Amazon Bedrock
- **Frontend**: HTML/CSS/JavaScript, S3 hosting
- **Mobile**: React Native, TypeScript
- **AI**: Amazon Nova (FREE)
- **Data**: data.gov.in API (77.5M+ records)

## Cost Estimate

Approximately $4/month for 10,000 requests:
- Lambda: $0.20
- API Gateway: $3.50
- Bedrock (Nova): $0.00 (FREE)
- S3: $0.50

## Use Cases

- **Farmers**: Check market prices, get selling recommendations
- **Traders**: Market analysis, price predictions
- **Analysts**: Historical data, trend analysis
- **Researchers**: Agricultural market research

## API Endpoints

### POST /fetch - Get Market Data
```json
{
  "state": "Maharashtra",
  "limit": 50,
  "action": "fetch"
}
```

### POST /analyze - Get AI Analysis
```json
{
  "state": "West Bengal",
  "limit": 50,
  "action": "analyze"
}
```

## Support

For detailed documentation, see:
- [Architecture](ARCHITECTURE.md) - System design
- [User Guide](USER-GUIDE.md) - Usage instructions
- [API Documentation](API-DOCUMENTATION.md) - API reference

## License

MIT License

---

**Ready to deploy!** No payment method needed. No marketplace subscription. Just deploy and use.
