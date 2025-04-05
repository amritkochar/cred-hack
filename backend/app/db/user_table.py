# app/db/user_table.py

import boto3
import os
from botocore.exceptions import ClientError

USER_PERSONA_TABLE = 'UserPersona'
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")
table = dynamodb.Table(USER_PERSONA_TABLE)

def update_user_persona_from_statement(user_id: str, summary: dict) -> bool:
    try:
        total_income = summary["total_income"]
        total_spent = summary["total_spent"]
        total_surplus = summary["total_surplus"]  # Using the pre-calculated surplus from summary
        # Convert savings_rate to an integer percentage to avoid float issues with DynamoDB
        savings_rate = int((total_surplus * 100) // total_income) if total_income > 0 else 0

        # Calculate average monthly income if monthly_summary exists
        num_months = len(summary["monthly_summary"]) if summary["monthly_summary"] else 1
        avg_monthly_income = int(total_income // num_months)
        avg_monthly_spend = int(total_spent // num_months)
        avg_monthly_savings = int(total_surplus // num_months)

        # Calculate monthly average spending across categories
        avg_category_spending = {}
        for category, total in summary["categories"].items():
            avg_category_spending[category] = int(total // num_months)

        # Enhanced financial summary with monthly historic numbers and cumulative totals
        financial_summary = {
            "monthly_historic": summary["monthly_summary"],
            "total_cumulative": {
                "income": total_income,
                "spends": total_spent,
                "surplus": total_surplus,
                "categories": summary["categories"]
            }
        }

        # Enhanced spending pattern with monthly averages
        spending_pattern = {
            "monthly_avg_income": avg_monthly_income,
            "monthly_avg_spend": avg_monthly_spend,
            "monthly_avg_surplus": avg_monthly_savings,
            "monthly_savings_rate": savings_rate,
            "monthly_avg_categories": avg_category_spending
        }

        # Update the user persona record without income_level and monthly_savings_amount
        update_expr = "SET spending_pattern = :pattern, financial_summary = :summary"
        expr_attr_vals = {
            ":pattern": spending_pattern,
            ":summary": financial_summary
        }

        table.update_item(
            Key={"user_id": user_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_attr_vals
        )
        return True
    except ClientError as e:
        print(f"❌ Error updating user persona for {user_id}: {e}")
        return False
