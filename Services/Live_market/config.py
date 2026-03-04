"""Configuration for Commodity Analyzer"""
import os

# Load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
except ImportError:
    pass

# API Configuration
API_KEY = os.environ.get("DATA_GOV_API_KEY", "")
API_BASE_URL = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"

# AWS Bedrock Configuration
AWS_REGION = "us-east-1"
BEDROCK_MODEL_ID = "amazon.nova-micro-v1:0"

# Alternative models:
# FREE MODELS (No approval, no marketplace):
# - amazon.nova-micro-v1:0 (default, fastest, FREE) ✅
# - amazon.nova-lite-v1:0 (more capable, FREE) ✅
# - amazon.nova-pro-v1:0 (most capable, FREE) ✅
#
# MARKETPLACE MODELS (Require subscription):
# - ai21.jamba-1-5-mini-v1:0 (requires marketplace subscription)
# - ai21.jamba-1-5-large-v1:0 (requires marketplace subscription)
#
# APPROVAL REQUIRED:
# - anthropic.claude-3-haiku-20240307-v1:0 (requires approval)
# - anthropic.claude-3-sonnet-20240229-v1:0 (requires approval)
