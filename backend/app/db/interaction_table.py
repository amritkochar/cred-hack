# app/db/interaction_table.py

import boto3
from botocore.exceptions import ClientError
import os
from datetime import datetime

# Initialize DynamoDB client
INTERACTION_HISTORY_TABLE = 'InteractionHistory'
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
table = dynamodb.Table(INTERACTION_HISTORY_TABLE)

def store_interactions(user_id: str, interaction_id: str, messages: list[dict]) -> int:
    """
    Stores a batch of interaction messages for a user.
    All messages will have the same interaction_id.
    Returns the number of messages successfully queued.
    """
    try:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with table.batch_writer() as batch:
            for idx, msg in enumerate(messages):
                # Create sort_id as a concatenation of interaction_id, timestamp, and index
                # This ensures each item has a unique sort_id
                sort_id = f"{interaction_id}#{now}#{idx}"
                
                item = {
                    "user_id": user_id,
                    "sort_id": sort_id,
                    "interaction_id": interaction_id,
                    "message_id": msg["message_id"],
                    "role": msg["role"],
                    "content": msg["content"],
                    "created_at": msg.get("created_at", now),
                    "updated_at": now
                }
                batch.put_item(Item=item)
        
        return len(messages)
    except ClientError as e:
        print(f"❌ Error in batch writing interactions for user {user_id}: {e}")
        return 0
