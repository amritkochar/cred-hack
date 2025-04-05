import boto3
import uuid
import datetime
from botocore.exceptions import ClientError
from app.core.auth import hash_password

# Initialize the DynamoDB resource
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

# Table names
USER_PERSONA_TABLE = 'UserPersona'
INTERACTION_HISTORY_TABLE = 'InteractionHistory'
BANK_TRANSACTIONS_TABLE = 'BankTransactions'

# Fetch the user by email (to check if user already exists)
def get_user_by_email(email: str):
    table = dynamodb.Table(USER_PERSONA_TABLE)
    try:
        # Use scan with a filter expression since email is not the primary key
        response = table.scan(
            FilterExpression="email = :email",
            ExpressionAttributeValues={":email": email}
        )
        items = response.get('Items', [])
        return items[0] if items else None
    except ClientError as e:
        print(f"Error fetching user by email: {e}")
        return None

# Create a new user
def create_user(email: str, password: str, username: str):
    table = dynamodb.Table(USER_PERSONA_TABLE)
    hashed_password = hash_password(password)  # Hash the password
    user_id = str(uuid.uuid4())  # Generate a unique user ID
    try:
        # Insert a new user record into DynamoDB
        response = table.put_item(
            Item={
                'user_id': user_id,
                'email': email,
                'username': username,
                'password': hashed_password,
                'risk_profile': 'moderate', # Default profile
                'investment_goals': [],
                'spending_pattern': {},
            }
        )
        return response
    except ClientError as e:
        print(f"Error creating user: {e}")
        return None


# Fetch the user persona from DynamoDB
def get_user_persona(user_id):
    table = dynamodb.Table(USER_PERSONA_TABLE)
    try:
        response = table.get_item(Key={'user_id': user_id})
        return response.get('Item', None)  # Return None if item doesn't exist
    except ClientError as e:
        print(f"Error fetching user persona: {e}")
        return None

# Fetch interaction history from DynamoDB
def get_interaction_history(user_id):
    table = dynamodb.Table(INTERACTION_HISTORY_TABLE)
    try:
        response = table.query(KeyConditionExpression="user_id = :user_id",
                               ExpressionAttributeValues={":user_id": user_id})
        return response.get('Items', [])
    except ClientError as e:
        print(f"Error fetching interaction history: {e}")
        return []

# Fetch interaction history by interaction_id from DynamoDB
def get_interaction_by_id(user_id, interaction_id):
    table = dynamodb.Table(INTERACTION_HISTORY_TABLE)
    try:
        # Use begins_with to find all items with the given interaction_id in the sort_id
        response = table.query(
            KeyConditionExpression="user_id = :user_id AND begins_with(sort_id, :interaction_prefix)",
            ExpressionAttributeValues={
                ":user_id": user_id,
                ":interaction_prefix": f"{interaction_id}#"
            }
        )
        return response.get('Items', [])
    except ClientError as e:
        print(f"Error fetching interaction by ID: {e}")
        return []

# Fetch bank transactions from DynamoDB
def get_bank_transactions(user_id):
    table = dynamodb.Table(BANK_TRANSACTIONS_TABLE)
    try:
        response = table.query(KeyConditionExpression="user_id = :user_id",
                               ExpressionAttributeValues={":user_id": user_id})
        return response.get('Items', [])
    except ClientError as e:
        print(f"Error fetching bank transactions: {e}")
        return []

# Upsert user persona data
def upsert_user_persona(user_id: str, data: dict):
    """
    Update or insert user persona data.
    Only updates fields provided in the data dict, preserving existing fields.
    """
    table = dynamodb.Table(USER_PERSONA_TABLE)
    
    # Get current time in local timezone
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Check if record exists
    existing_item = get_user_persona(user_id)
    
    if existing_item:
        # Record exists, update only provided fields
        update_expression = "SET updated_at = :updated_at"
        expression_attribute_values = {":updated_at": now}
        
        # Add each field from data to the update expression
        for key, value in data.items():
            update_expression += f", #{key} = :{key}"
            expression_attribute_values[f":{key}"] = value
        
        # Create expression attribute names to handle reserved keywords
        expression_attribute_names = {f"#{key}": key for key in data.keys()}
        
        response = table.update_item(
            Key={"user_id": user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
            ReturnValues="ALL_NEW"
        )
        return response.get("Attributes")
    else:
        # Record doesn't exist, create new one
        data["user_id"] = user_id
        data["created_at"] = now
        data["updated_at"] = now
        
        response = table.put_item(Item=data)
        return data

# Upsert interaction data
def upsert_interaction(user_id: str, data: dict):
    """
    Update or insert interaction data.
    Only updates fields provided in the data dict, preserving existing fields.
    Ensures that user_id, sort_id, interaction_id, message_id, created_at, updated_at are always present.
    """
    table = dynamodb.Table(INTERACTION_HISTORY_TABLE)
    
    # Get current time in local timezone
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # For interactions, we need an interaction_id
    interaction_id = data.get("interaction_id")
    message_id = data.get("message_id", str(uuid.uuid4()))
    
    if not interaction_id:
        interaction_id = str(uuid.uuid4())
    
    # Create sort_id as a concatenation of interaction_id and created_at
    # This allows for easy querying of all messages in an interaction
    sort_id = f"{interaction_id}#{now}"
    
    # Try to get the existing interaction if sort_id is provided
    existing_item = None
    if data.get("sort_id"):
        try:
            response = table.get_item(Key={"user_id": user_id, "sort_id": data["sort_id"]})
            existing_item = response.get("Item")
        except ClientError as e:
            print(f"Error fetching interaction: {e}")
    
    if existing_item:
        # Record exists, update only provided fields
        update_expression = "SET updated_at = :updated_at"
        expression_attribute_values = {":updated_at": now}
        
        # Add each field from data to the update expression
        for key, value in data.items():
            if key not in ["user_id", "sort_id"]:  # Skip primary keys
                update_expression += f", #{key} = :{key}"
                expression_attribute_values[f":{key}"] = value
        
        # Create expression attribute names to handle reserved keywords
        expression_attribute_names = {f"#{key}": key for key in data.keys() if key not in ["user_id", "sort_id"]}
        
        response = table.update_item(
            Key={"user_id": user_id, "sort_id": data["sort_id"]},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
            ReturnValues="ALL_NEW"
        )
        return response.get("Attributes")
    
    # If record doesn't exist, create new one with all required fields
    new_item = {
        "user_id": user_id,
        "sort_id": sort_id,
        "interaction_id": interaction_id,
        "message_id": message_id,
        "created_at": now,
        "updated_at": now
    }
    
    # Add all other fields from data
    for key, value in data.items():
        if key not in new_item:  # Don't overwrite already set fields
            new_item[key] = value
    
    response = table.put_item(Item=new_item)
    return new_item

# Upsert transaction data
def upsert_transaction(user_id: str, data: dict):
    """
    Update or insert transaction data.
    Only updates fields provided in the data dict, preserving existing fields.
    Ensures that user_id, transaction_id, created_at, updated_at are always present.
    """
    table = dynamodb.Table(BANK_TRANSACTIONS_TABLE)
    
    # Get current time in local timezone
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # For transactions, we need a transaction_id
    transaction_id = data.get("transaction_id")
    
    if not transaction_id:
        transaction_id = str(uuid.uuid4())
    
    # Try to get the existing transaction
    try:
        response = table.get_item(Key={"user_id": user_id, "transaction_id": transaction_id})
        existing_item = response.get("Item")
    except ClientError as e:
        print(f"Error fetching transaction: {e}")
        existing_item = None
    
    if existing_item:
        # Record exists, update only provided fields
        update_expression = "SET updated_at = :updated_at"
        expression_attribute_values = {":updated_at": now}
        
        # Add each field from data to the update expression
        for key, value in data.items():
            if key not in ["user_id", "transaction_id"]:  # Skip primary keys
                update_expression += f", #{key} = :{key}"
                expression_attribute_values[f":{key}"] = value
        
        # Create expression attribute names to handle reserved keywords
        expression_attribute_names = {f"#{key}": key for key in data.keys() if key not in ["user_id", "transaction_id"]}
        
        response = table.update_item(
            Key={"user_id": user_id, "transaction_id": transaction_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
            ReturnValues="ALL_NEW"
        )
        return response.get("Attributes")
    
    # If record doesn't exist, create new one with all required fields
    new_item = {
        "user_id": user_id,
        "transaction_id": transaction_id,
        "created_at": now,
        "updated_at": now
    }
    
    # Add all other fields from data
    for key, value in data.items():
        if key not in new_item:  # Don't overwrite already set fields
            new_item[key] = value
    
    response = table.put_item(Item=new_item)
    return new_item
