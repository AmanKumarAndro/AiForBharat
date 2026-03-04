#!/usr/bin/env python3
"""
Setup Bedrock Agent in us-east-1 with Claude 3 Haiku
This will create an agent with 4 tools that actually works!
"""

import boto3
import json
import time
import os

# Configuration
REGION = 'us-east-1'
AGENT_NAME = 'farmer-voice-ai-agent'
MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0'  # Claude 3 Haiku in us-east-1

# Initialize clients
bedrock_agent = boto3.client('bedrock-agent', region_name=REGION)
iam = boto3.client('iam', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

def get_lambda_arn(function_name):
    """Get Lambda function ARN"""
    try:
        response = lambda_client.get_function(FunctionName=function_name)
        return response['Configuration']['FunctionArn']
    except Exception as e:
        print(f"❌ Error getting Lambda ARN for {function_name}: {e}")
        return None

def create_agent_role():
    """Create IAM role for Bedrock Agent"""
    role_name = f'{AGENT_NAME}-role'
    
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "bedrock.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }
    
    try:
        response = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Role for Farmer Voice AI Bedrock Agent'
        )
        role_arn = response['Role']['Arn']
        print(f"✅ Created IAM role: {role_arn}")
        
        # Attach policies
        iam.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/AmazonBedrockFullAccess'
        )
        
        # Wait for role to be available
        time.sleep(10)
        
        return role_arn
    except iam.exceptions.EntityAlreadyExistsException:
        response = iam.get_role(RoleName=role_name)
        print(f"✅ Using existing IAM role: {response['Role']['Arn']}")
        return response['Role']['Arn']

def create_agent(role_arn):
    """Create Bedrock Agent"""
    instruction = """You are an agricultural advisor helping Indian farmers.
You have access to 4 tools:
1. Web search - for current information
2. YouTube search - for video tutorials
3. DynamoDB - for farmer database queries
4. Knowledge base - for verified ICAR/FSSAI data

Always:
- Answer in simple Hindi with numbered steps
- Use the most appropriate tool for each question
- Cite sources at the end
- Be helpful and practical"""

    try:
        response = bedrock_agent.create_agent(
            agentName=AGENT_NAME,
            agentResourceRoleArn=role_arn,
            foundationModel=MODEL_ID,
            instruction=instruction,
            description='AI assistant for Indian farmers with 4 tools'
        )
        
        agent_id = response['agent']['agentId']
        print(f"✅ Created agent: {agent_id}")
        return agent_id
    except Exception as e:
        print(f"❌ Error creating agent: {e}")
        return None

def create_action_group(agent_id, name, description, lambda_arn, api_schema):
    """Create action group for agent"""
    try:
        response = bedrock_agent.create_agent_action_group(
            agentId=agent_id,
            agentVersion='DRAFT',
            actionGroupName=name,
            description=description,
            actionGroupExecutor={
                'lambda': lambda_arn
            },
            apiSchema={
                'payload': json.dumps(api_schema)
            }
        )
        print(f"✅ Created action group: {name}")
        return response['agentActionGroup']['actionGroupId']
    except Exception as e:
        print(f"❌ Error creating action group {name}: {e}")
        return None

def prepare_agent(agent_id):
    """Prepare agent for use"""
    try:
        response = bedrock_agent.prepare_agent(agentId=agent_id)
        print(f"✅ Prepared agent")
        
        # Wait for preparation
        time.sleep(5)
        return True
    except Exception as e:
        print(f"❌ Error preparing agent: {e}")
        return False

def create_agent_alias(agent_id):
    """Create agent alias"""
    try:
        response = bedrock_agent.create_agent_alias(
            agentId=agent_id,
            agentAliasName='production',
            description='Production alias'
        )
        alias_id = response['agentAlias']['agentAliasId']
        print(f"✅ Created alias: {alias_id}")
        return alias_id
    except Exception as e:
        print(f"❌ Error creating alias: {e}")
        return None

def main():
    print("=" * 50)
    print("🚀 Setting up Bedrock Agent in us-east-1")
    print("=" * 50)
    print()
    print(f"Region: {REGION}")
    print(f"Model: {MODEL_ID}")
    print()
    
    # Step 1: Create IAM role
    print("Step 1: Creating IAM role...")
    role_arn = create_agent_role()
    if not role_arn:
        print("❌ Failed to create role")
        return
    print()
    
    # Step 2: Create agent
    print("Step 2: Creating Bedrock Agent...")
    agent_id = create_agent(role_arn)
    if not agent_id:
        print("❌ Failed to create agent")
        return
    print()
    
    # Step 3: Get Lambda ARNs
    print("Step 3: Getting Lambda function ARNs...")
    dynamo_arn = get_lambda_arn('farmer-voice-ai-dev-dynamoToolLambda')
    youtube_arn = get_lambda_arn('farmer-voice-ai-dev-youtubeToolLambda')
    
    if not dynamo_arn or not youtube_arn:
        print("❌ Lambda functions not found. Deploy backend first!")
        return
    
    print(f"✅ DynamoDB Lambda: {dynamo_arn}")
    print(f"✅ YouTube Lambda: {youtube_arn}")
    print()
    
    # Step 4: Create action groups
    print("Step 4: Creating action groups...")
    
    # DynamoDB action group
    dynamo_schema = {
        "openapi": "3.0.0",
        "info": {"title": "Farmer Database API", "version": "1.0.0"},
        "paths": {
            "/query-farmers": {
                "post": {
                    "description": "Query farmer database",
                    "parameters": [{
                        "name": "query",
                        "in": "query",
                        "required": True,
                        "schema": {"type": "string"}
                    }]
                }
            }
        }
    }
    
    create_action_group(
        agent_id,
        'farmer_database',
        'Query farmer database',
        dynamo_arn,
        dynamo_schema
    )
    
    # YouTube action group
    youtube_schema = {
        "openapi": "3.0.0",
        "info": {"title": "YouTube Search API", "version": "1.0.0"},
        "paths": {
            "/search-videos": {
                "post": {
                    "description": "Search farming videos",
                    "parameters": [{
                        "name": "query",
                        "in": "query",
                        "required": True,
                        "schema": {"type": "string"}
                    }]
                }
            }
        }
    }
    
    create_action_group(
        agent_id,
        'youtube_search',
        'Search farming videos',
        youtube_arn,
        youtube_schema
    )
    
    print()
    
    # Step 5: Prepare agent
    print("Step 5: Preparing agent...")
    if not prepare_agent(agent_id):
        print("❌ Failed to prepare agent")
        return
    print()
    
    # Step 6: Create alias
    print("Step 6: Creating agent alias...")
    alias_id = create_agent_alias(agent_id)
    if not alias_id:
        print("❌ Failed to create alias")
        return
    print()
    
    # Step 7: Save to .env
    print("Step 7: Saving configuration...")
    env_content = f"""
# Bedrock Agent Configuration (us-east-1)
AGENT_ID={agent_id}
AGENT_ALIAS_ID={alias_id}
AWS_REGION={REGION}
MODEL_ID={MODEL_ID}
"""
    
    with open('.env', 'a') as f:
        f.write(env_content)
    
    print("✅ Configuration saved to .env")
    print()
    
    # Summary
    print("=" * 50)
    print("✅ SETUP COMPLETE!")
    print("=" * 50)
    print()
    print(f"Agent ID: {agent_id}")
    print(f"Alias ID: {alias_id}")
    print(f"Region: {REGION}")
    print(f"Model: {MODEL_ID}")
    print()
    print("Next steps:")
    print("1. Test the agent: curl -X POST [api-url]/agent-query")
    print("2. All 4 tools should work now!")
    print("3. Update your React Native app if needed")
    print()
    print("=" * 50)

if __name__ == '__main__':
    main()
