#!/usr/bin/env python3

"""
Setup Bedrock Agent with Action Groups - Version 3
Uses functionSchema instead of apiSchema
"""

import boto3
import json
import time

# Colors
GREEN = '\033[0;32m'
BLUE = '\033[0;34m'
NC = '\033[0m'

def print_step(msg):
    print(f"{BLUE}{msg}{NC}")

def print_success(msg):
    print(f"{GREEN}✅ {msg}{NC}")

# Configuration
REGION = 'ap-south-1'
AGENT_ID = 'UZ4BBKGOJB'

bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
sts = boto3.client('sts', region_name=REGION)

print("🚀 Setting up Bedrock Agent with Function Schema")
print("=" * 50)
print()

account_id = sts.get_caller_identity()['Account']

# Define functions with functionSchema
functions = [
    {
        'name': 'web_tools',
        'description': 'Search web for live information',
        'lambda_arn': f'arn:aws:lambda:{REGION}:{account_id}:function:farmer-voice-ai-web-search',
        'functions': [
            {
                'name': 'web_search',
                'description': 'Search web for government schemes and prices',
                'parameters': {
                    'query': {
                        'description': 'Search query',
                        'required': True,
                        'type': 'string'
                    }
                }
            }
        ]
    },
    {
        'name': 'farmer_database_tools',
        'description': 'Query farmer database',
        'lambda_arn': f'arn:aws:lambda:{REGION}:{account_id}:function:farmer-voice-ai-dev-dynamoToolLambda',
        'functions': [
            {
                'name': 'query_farmer_database',
                'description': 'Query farmer records',
                'parameters': {
                    'keyword': {
                        'description': 'Search keyword',
                        'required': True,
                        'type': 'string'
                    }
                }
            }
        ]
    },
    {
        'name': 'youtube_tools',
        'description': 'Search YouTube videos',
        'lambda_arn': f'arn:aws:lambda:{REGION}:{account_id}:function:farmer-voice-ai-dev-youtubeToolLambda',
        'functions': [
            {
                'name': 'search_youtube_videos',
                'description': 'Search YouTube for farming videos',
                'parameters': {
                    'query': {
                        'description': 'Video search query',
                        'required': True,
                        'type': 'string'
                    },
                    'max_results': {
                        'description': 'Max videos to return',
                        'required': False,
                        'type': 'integer'
                    }
                }
            }
        ]
    }
]

for i, func_group in enumerate(functions, 1):
    print_step(f"Step {i}: Adding {func_group['name']}...")
    
    try:
        response = bedrock_agent.create_agent_action_group(
            agentId=AGENT_ID,
            agentVersion='DRAFT',
            actionGroupName=func_group['name'],
            description=func_group['description'],
            actionGroupExecutor={
                'lambda': func_group['lambda_arn']
            },
            functionSchema={
                'functions': func_group['functions']
            }
        )
        
        print_success(f"{func_group['name']} added")
        
    except Exception as e:
        if 'ConflictException' in str(e):
            print(f"  ⚠️  {func_group['name']} already exists, updating...")
            # Try to update
            try:
                # Get action group ID
                list_response = bedrock_agent.list_agent_action_groups(
                    agentId=AGENT_ID,
                    agentVersion='DRAFT'
                )
                
                action_group_id = None
                for ag in list_response.get('actionGroupSummaries', []):
                    if ag['actionGroupName'] == func_group['name']:
                        action_group_id = ag['actionGroupId']
                        break
                
                if action_group_id:
                    bedrock_agent.update_agent_action_group(
                        agentId=AGENT_ID,
                        agentVersion='DRAFT',
                        actionGroupId=action_group_id,
                        actionGroupName=func_group['name'],
                        description=func_group['description'],
                        actionGroupExecutor={
                            'lambda': func_group['lambda_arn']
                        },
                        functionSchema={
                            'functions': func_group['functions']
                        }
                    )
                    print_success(f"{func_group['name']} updated")
            except Exception as e2:
                print(f"  ❌ Update failed: {str(e2)}")
        else:
            print(f"  ❌ Failed: {str(e)}")
    
    print()

# Prepare agent
print_step("Preparing Agent...")
try:
    bedrock_agent.prepare_agent(agentId=AGENT_ID)
    print_success("Agent prepared")
    time.sleep(25)
except Exception as e:
    print(f"❌ {str(e)}")

print()

# List action groups
print_step("Verifying action groups...")
try:
    response = bedrock_agent.list_agent_action_groups(
        agentId=AGENT_ID,
        agentVersion='DRAFT'
    )
    
    if response['actionGroupSummaries']:
        print_success(f"Found {len(response['actionGroupSummaries'])} action groups:")
        for ag in response['actionGroupSummaries']:
            print(f"  ✅ {ag['actionGroupName']}")
    else:
        print("  ⚠️  No action groups found")
        
except Exception as e:
    print(f"❌ {str(e)}")

print()
print("=" * 50)
print(f"{GREEN}🎉 Setup Complete!{NC}")
print("=" * 50)
print()
print("Agent Details:")
print(f"  Agent ID: {AGENT_ID}")
print(f"  Alias ID: ZVMIVC4HHV")
print()
print("Next: npm run deploy")
print()
