import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')

def create_providers_table():
    """Create HH_Providers table with GSI for service type and rating"""
    try:
        table = dynamodb.create_table(
            TableName='HH_Providers',
            KeySchema=[
                {'AttributeName': 'provider_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'provider_id', 'AttributeType': 'S'},
                {'AttributeName': 'service_type', 'AttributeType': 'S'},
                {'AttributeName': 'rating', 'AttributeType': 'N'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'ServiceType-Rating-Index',
                    'KeySchema': [
                        {'AttributeName': 'service_type', 'KeyType': 'HASH'},
                        {'AttributeName': 'rating', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"Creating {table.table_name}...")
        table.wait_until_exists()
        print(f"✓ {table.table_name} created")
        return table
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"✓ HH_Providers already exists")
        else:
            raise

def create_requests_table():
    """Create HH_Requests table"""
    try:
        table = dynamodb.create_table(
            TableName='HH_Requests',
            KeySchema=[
                {'AttributeName': 'request_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'request_id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"Creating {table.table_name}...")
        table.wait_until_exists()
        print(f"✓ {table.table_name} created")
        return table
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"✓ HH_Requests already exists")
        else:
            raise

def create_pincode_mappings_table():
    """Create HH_PincodeMappings table"""
    try:
        table = dynamodb.create_table(
            TableName='HH_PincodeMappings',
            KeySchema=[
                {'AttributeName': 'pincode', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'pincode', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"Creating {table.table_name}...")
        table.wait_until_exists()
        print(f"✓ {table.table_name} created")
        return table
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"✓ HH_PincodeMappings already exists")
        else:
            raise

if __name__ == '__main__':
    print("Creating DynamoDB tables...")
    create_providers_table()
    create_requests_table()
    create_pincode_mappings_table()
    print("\n✓ All tables created successfully")
