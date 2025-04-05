# app/services/bank_statement_ingestion.py

import pandas as pd
import uuid
import math
from datetime import datetime
from typing import List, Dict
from io import BytesIO

from app.db.transaction_table import store_transactions
from app.db.user_table import update_user_persona_from_statement
import json

# Category keywords mapping
CATEGORY_KEYWORDS = {
    "salary": ["salary", "credited by infosys", "neft infosys"],
    "rent": ["rent", "landlord"],
    "emi_home": ["home loan", "hdfc ltd"],
    "emi_car": ["car loan", "auto loan"],
    "credit_card": ["credit card", "card payment"],
    "food": ["zomato", "swiggy", "eating"],
    "fuel": ["fuel", "petrol", "shell"],
    "shopping": ["amazon", "flipkart", "shopping"],
    "utilities": ["electricity", "bescom", "water", "gas"],
    "insurance": ["insurance"],
    "entertainment": ["netflix", "hotstar", "entertainment"],
    "peer_payment": ["upi", "to", "from"],
    "misc": []
}

def categorize(narration: str) -> str:
    narration = narration.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in narration for kw in keywords):
            return category
    return "misc"

def parse_excel(file_bytes: BytesIO) -> pd.DataFrame:
    df = pd.read_excel(file_bytes)
    df = df.rename(columns=lambda col: col.strip())
    df = df[df["Date"].notna() & df["Narration"].notna()]
    df["Parsed Date"] = pd.to_datetime(df["Date"], format="%d/%m/%Y")
    df["Deposit Amt."] = pd.to_numeric(df["Deposit Amt."], errors="coerce").fillna(0)
    df["Withdrawal Amt."] = pd.to_numeric(df["Withdrawal Amt."], errors="coerce").fillna(0)
    return df

def process_bank_statement(user_id: str, file: BytesIO) -> Dict:
    df = parse_excel(file)

    summary = {
        "total_income": 0,
        "total_spent": 0,
        "total_surplus": 0,
        "categories": {},
        "monthly_summary": {},
    }

    txns_to_store = []

    for _, row in df.iterrows():
        date = row["Parsed Date"]
        amount_in = row["Deposit Amt."]
        amount_out = row["Withdrawal Amt."]
        narration = row["Narration"]

        amount = amount_in if amount_in > 0 else -amount_out
        txn_type = "credit" if amount > 0 else "debit"

        # Round up the amount to ensure it's an integer
        rounded_amount = math.ceil(abs(amount))
        if amount < 0:
            rounded_amount = -rounded_amount

        category = categorize(narration)
        summary["categories"].setdefault(category, 0)
        summary["categories"][category] += math.ceil(abs(amount))

        month_key = date.strftime("%Y-%m")
        if month_key not in summary["monthly_summary"]:
            summary["monthly_summary"][month_key] = {"income": 0, "spends": 0, "surplus": 0}
        if txn_type == "credit":
            summary["monthly_summary"][month_key]["income"] += math.ceil(amount)
            summary["total_income"] += math.ceil(amount)
        else:
            summary["monthly_summary"][month_key]["spends"] += math.ceil(-amount)
            summary["total_spent"] += math.ceil(-amount)
        # Update surplus for the month
        summary["monthly_summary"][month_key]["surplus"] = (
            summary["monthly_summary"][month_key]["income"] - 
            summary["monthly_summary"][month_key]["spends"]
        )

        transaction_id = f"{date.strftime('%m%y')}:{uuid.uuid4()}"
        txns_to_store.append({
            "transaction_id": transaction_id,
            "timestamp": date.isoformat(),
            "narration": narration,
            "amount": rounded_amount,
            "type": txn_type,
            "category": category,
        })

    # Calculate total surplus (already using rounded values)
    summary["total_surplus"] = summary["total_income"] - summary["total_spent"]
    
    # Pretty print the summary object
    # print(json.dumps(summary, indent=4))
    # print("hello")
    # print(len(txns_to_store))
    # print(json.dumps(txns_to_store, indent=4))

    store_transactions(user_id, txns_to_store)
    update_user_persona_from_statement(user_id, summary)
    return summary
