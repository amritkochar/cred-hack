# app/db/transaction_table.py

import boto3
from botocore.exceptions import ClientError
import os
from datetime import datetime

# Initialize DynamoDB client
BANK_TRANSACTIONS_TABLE = 'BankTransactions'
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
table = dynamodb.Table(BANK_TRANSACTIONS_TABLE)

def store_transactions(user_id: str, transactions: list[dict]) -> int:
    """
    Stores a batch of transactions for a user.
    Returns the number of transactions successfully queued.
    """
    try:
        with table.batch_writer(overwrite_by_pkeys=["user_id", "transaction_id"]) as batch:
            for txn in transactions:
                item = {
                    "user_id": user_id,
                    "transaction_id": txn["transaction_id"],
                    "timestamp": txn["timestamp"],
                    "narration": txn.get("narration", ""),
                    "amount": txn["amount"],
                    "type": txn["type"],
                    "category": txn.get("category", "misc")
                }
                batch.put_item(Item=item)
        return len(transactions)
    except ClientError as e:
        print(f"❌ Error in batch writing transactions for user {user_id}: {e}")
        return 0
