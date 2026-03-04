#!/usr/bin/env python3

"""
Setup Bedrock Agent with Action Groups - Version 2
Uses parent action group without explicit schema
"""

import boto3
import json
import time
import sys

# Colors
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

print("🚀 Setting up Bedrock Agent - Simplified Approach")
print("=" * 50)
print()

# Get account ID
account_id = sts.get_caller_identity()['Account']
print(f"Account ID: {account_id}")
print(f"Agent ID: {AGENT_ID}")
print()

# Try creating action groups with parentActionGroupSignature
action_groups = [
    {
        'name': 'web_tools',
        'description': 'Search web for live information',
        'lambda_arn': f'arn:aws:lambda:{REGION}:{account_id}:function:farmer-voice-ai-web-search',
    },
    {
        'name': 'farmer_database_tools',
        'description': 'Query farmer database',
        'lambda_arn': f'arn:aws:lambda:{REGION}:{account_id}:function:farmer-voice-ai-dev-dynamoToolLambda',
    },
    {
        'name': 'youtube_tools',
        'description': 'Search YouTube videos',
        'lambda_arn': f'arn:aws:lambda:{REGION}:{account_id}:function:farmer-voice-ai-dev-youtubeToolLambda',
    }
]

# Try with AMAZON.UserInput parent action group
print_step("Attempting to create action groups with AMAZON.UserInput...")
print()

for i, ag in enumerate(action_groups, 1):
    print_step(f"Step {i}: Adding {ag['name']}...")
    
    try:
        response = bedrock_agent.create_agent_action_group(
            agentId=AGENT_ID,
            agentVersion='DRAFT',
            actionGroupName=ag['name'],
            description=ag['description'],
            parentActionGroupSignature='AMAZON.UserInput',
            actionGroupExecutor={
                'lambda': ag['lambda_arn']
            }
        )
        
        print_success(f"{ag['name']} added")
        
    except Exception as e:
        if 'ConflictException' in str(e):
            print_warning(f"{ag['name']} already exists")
        else:
            print_error(f"Failed: {str(e)}")
            # Try without parent signature
            print_step(f"  Retrying {ag['name']} without parent signature...")
            try:
                response = bedrock_agent.create_agent_action_group(
                    agentId=AGENT_ID,
                    agentVersion='DRAFT',
                    actionGroupName=ag['name'],
                    description=ag['description'],
                    actionGroupState='ENABLED',
                    actionGroupExecutor={
                        'lambda': ag['lambda_arn']
                    }
                )
                print_success(f"{ag['name']} added (without schema)")
            except Exception as e2:
                print_error(f"Still failed: {str(e2)}")
    
    print()

# Prepare agent
print_step("Preparing Agent...")
try:
    bedrock_agent.prepare_agent(agentId=AGENT_ID)
    print_success("Agent prepared")
    time.sleep(20)
except Exception as e:
    print_error(f"Preparation failed: {str(e)}")

print()

# Check agent status
print_step("Checking agent status...")
try:
    response = bedrock_agent.get_agent(agentId=AGENT_ID)
    status = response['agent']['agentStatus']
    print_success(f"Agent status: {status}")
except Exception as e:
    print_error(f"Failed to get status: {str(e)}")

print()

# List action groups
print_step("Listing action groups...")
try:
    response = bedrock_agent.list_agent_action_groups(
        agentId=AGENT_ID,
        agentVersion='DRAFT'
    )
    
    if response['actionGroupSummaries']:
        print_success(f"Found {len(response['actionGroupSummaries'])} action groups:")
        for ag in response['actionGroupSummaries']:
            print(f"  - {ag['actionGroupName']}: {ag['actionGroupState']}")
    else:
        print_warning("No action groups found")
        
except Exception as e:
    print_error(f"Failed to list: {str(e)}")

print()
print("=" * 50)
print(f"{GREEN}Setup attempt complete!{NC}")
print("=" * 50)
print()
print("Agent ID: UZ4BBKGOJB")
print("Alias ID: ZVMIVC4HHV")
print()
print("If action groups failed, we'll need to add them via console.")
print("The .env file is already updated and ready.")
print()
