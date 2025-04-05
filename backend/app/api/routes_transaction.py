from fastapi import APIRouter, Depends, HTTPException, Body
from app.core.dependencies import get_current_user
from app.db.dynamo_client import get_bank_transactions, upsert_transaction

router = APIRouter()

@router.get("/transactions")
async def get_user_transactions(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    
    transactions = get_bank_transactions(user_id)
    if not transactions:
        raise HTTPException(status_code=404, detail="Bank transactions not found")
    return transactions

@router.post("/transactions")
async def update_user_transaction(
    data: dict = Body(...), 
    current_user: dict = Depends(get_current_user)
):
    """
    Update or create transaction data.
    Only updates fields provided in the request, preserving existing fields.
    """
    user_id = current_user["sub"]
    
    # Upsert the transaction data
    result = upsert_transaction(user_id, data)
    
    return result
