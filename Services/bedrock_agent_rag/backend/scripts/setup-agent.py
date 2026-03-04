#!/usr/bin/env python3

"""
Setup Bedrock Agent with Action Groups
Uses boto3 for better JSON handling
"""

import boto3
import json
import time
import sys
from pathlib import Path

# Colors for output
GREEN = '\033[0;32m'
BLUE = '\033[0;34m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
NC = '\033[0m'

def print_step(msg):
    print(f"{BLUE}{msg}{NC}")

def print_success(msg):
    print(f"{GREEN}✅ {msg}{NC}")

def print_error(msg):
    print(f"{RED}❌ {msg}{NC}")

def print_warning(msg):
    print(f"{YELLOW}⚠️  {msg}{NC}")

# Configuration
REGION = 'ap-south-1'
AGENT_ID = 'UZ4BBKGOJB'

# Initialize clients
bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
sts = boto3.client('sts', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

print("🚀 Setting up Bedrock Agent Action Groups")
print("=" * 50)
print()

# Get account ID
account_id = sts.get_caller_identity()['Account']
print(f"Account ID: {account_id}")
print(f"Agent ID: {AGENT_ID}")
print()

# Load schemas
schemas_dir = Path('scripts/schemas')

def load_schema(filename):
    with open(schemas_dir / filename, 'r') as f:
        return json.load(f)

# Action groups configuration
action_groups = [
    {
        'name': 'web_tools',
        'description': 'Search web for live government schemes and prices',
        'lambda_arn': f'arn:aws:lambda:{REGION}:{account_id}:function:farmer-voice-ai-web-search',
        'schema_file': 'web-simple.json'
    },
    {
        'name': 'farmer_database_tools',
        'description': 'Query farmer database for regional data',
        'lambda_arn': f'arn:aws:lambda:{REGION}:{account_id}:function:farmer-voice-ai-dev-dynamoToolLambda',
        'schema_file': 'dynamo-simple.json'
    },
    {
        'name': 'youtube_tools',
        'description': 'Search YouTube for farming tutorial videos',
        'lambda_arn': f'arn:aws:lambda:{REGION}:{account_id}:function:farmer-voice-ai-dev-youtubeToolLambda',
        'schema_file': 'youtube-simple.json'
    }
]

# Add action groups
for i, ag in enumerate(action_groups, 1):
    print_step(f"Step {i}: Adding {ag['name']}...")
    
    try:
        schema = load_schema(ag['schema_file'])
        
        response = bedrock_agent.create_agent_action_group(
            agentId=AGENT_ID,
            agentVersion='DRAFT',
            actionGroupName=ag['name'],
            description=ag['description'],
            actionGroupExecutor={
                'lambda': ag['lambda_arn']
            },
            apiSchema={
                'payload': json.dumps(schema)
            }
        )
        
        print_success(f"{ag['name']} added")
        
    except Exception as e:
        if 'ConflictException' in str(e):
            print_warning(f"{ag['name']} already exists")
        else:
            print_error(f"Failed to add {ag['name']}: {str(e)}")
    
    print()

# Prepare agent
print_step("Step 4: Preparing Agent...")
print("This may take 1-2 minutes...")

try:
    bedrock_agent.prepare_agent(agentId=AGENT_ID)
    print_success("Agent preparation started")
    
    # Wait for preparation
    time.sleep(30)
    print_success("Agent prepared")
    
except Exception as e:
    print_error(f"Failed to prepare agent: {str(e)}")

print()

# Create alias
print_step("Step 5: Creating Agent Alias...")

try:
    response = bedrock_agent.create_agent_alias(
        agentId=AGENT_ID,
        agentAliasName='production',
        description='Production alias for farmer voice AI'
    )
    
    alias_id = response['agentAlias']['agentAliasId']
    print_success(f"Alias created: {alias_id}")
    
except Exception as e:
    if 'ConflictException' in str(e):
        print_warning("Alias already exists, fetching existing...")
        
        # Get existing alias
        response = bedrock_agent.list_agent_aliases(agentId=AGENT_ID)
        for alias in response['agentAliasSummaries']:
            if alias['agentAliasName'] == 'production':
                alias_id = alias['agentAliasId']
                print_success(f"Using existing alias: {alias_id}")
                break
    else:
        print_error(f"Failed to create alias: {str(e)}")
        sys.exit(1)

print()

# Update .env file
print_step("Step 6: Updating .env file...")

env_content = f"""AWS_REGION={REGION}
KNOWLEDGE_BASE_ID=
AGENT_ID={AGENT_ID}
AGENT_ALIAS_ID={alias_id}
STAGE=dev
"""

# Backup existing .env
try:
    with open('.env', 'r') as f:
        with open('.env.backup', 'w') as backup:
            backup.write(f.read())
except:
    pass

# Write new .env
with open('.env', 'w') as f:
    f.write(env_content)

print_success(".env file updated")
print()

# Grant Lambda permissions
print_step("Step 7: Granting Lambda permissions...")

agent_arn = f'arn:aws:bedrock:{REGION}:{account_id}:agent/{AGENT_ID}'

for ag in action_groups:
    function_name = ag['lambda_arn'].split(':')[-1]
    
    try:
        lambda_client.add_permission(
            FunctionName=function_name,
            StatementId=f'AllowBedrockAgent-{AGENT_ID}',
            Action='lambda:InvokeFunction',
            Principal='bedrock.amazonaws.com',
            SourceArn=agent_arn
        )
        print_success(f"Permission granted for {function_name}")
    except Exception as e:
        if 'ResourceConflictException' in str(e):
            print_warning(f"Permission already exists for {function_name}")
        else:
            print_error(f"Failed to grant permission for {function_name}: {str(e)}")

print()

# Summary
print("=" * 50)
print(f"{GREEN}🎉 Setup Complete!{NC}")
print("=" * 50)
print()
print("Agent Details:")
print(f"  Agent ID: {AGENT_ID}")
print(f"  Alias ID: {alias_id}")
print()
print("Action Groups:")
print("  ✅ web_tools")
print("  ✅ farmer_database_tools")
print("  ✅ youtube_tools")
print()
print(".env file updated with:")
print(f"  AGENT_ID={AGENT_ID}")
print(f"  AGENT_ALIAS_ID={alias_id}")
print()
print("Next steps:")
print("  1. npm run deploy")
print("  2. Test agent endpoint")
print()
