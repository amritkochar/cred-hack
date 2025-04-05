from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from fastapi.responses import JSONResponse
from app.core.dependencies import get_current_user
from app.core.cache import get_cached_user_persona, update_user_persona_cache, DecimalEncoder
from app.db.dynamo_client import upsert_user_persona
from app.services.bank_statement_ingestion import process_bank_statement
from io import BytesIO
import json


router = APIRouter()

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    # Return the current user's information
    response_content = {"user_id": current_user["sub"], "message": "Authenticated successfully"}
    # Convert to JSON string using our custom encoder
    json_str = json.dumps(response_content, cls=DecimalEncoder)
    # Return JSONResponse with the pre-encoded JSON string
    return JSONResponse(content=json.loads(json_str))

@router.get("/persona")
async def get_user_persona(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    
    user_persona = await get_cached_user_persona(user_id)
    if not user_persona:
        raise HTTPException(status_code=404, detail="User persona not found")
    
    # Convert to JSON string using our custom encoder
    json_str = json.dumps(user_persona, cls=DecimalEncoder)
    # Return JSONResponse with the pre-encoded JSON string
    return JSONResponse(content=json.loads(json_str))

@router.post("/persona")
async def update_user_persona(
    data: dict = Body(...), 
    current_user: dict = Depends(get_current_user)
):
    """
    Update or create user persona data.
    Only updates fields provided in the request, preserving existing fields.
    """
    user_id = current_user["sub"]
    
    # Upsert the user persona data
    result = upsert_user_persona(user_id, data)
    
    # Update the cache
    await update_user_persona_cache(user_id, result)
    
    # Convert to JSON string using our custom encoder
    json_str = json.dumps(result, cls=DecimalEncoder)
    # Return JSONResponse with the pre-encoded JSON string
    return JSONResponse(content=json.loads(json_str))


@router.post("/onboard-banking")
async def onboard_with_bank_statement(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported.")

    try:
        contents = await file.read()
        summary = process_bank_statement(user_id, file=BytesIO(contents))
        response_content = {"message": "Bank statement processed successfully.", "summary": summary}
        # Convert to JSON string using our custom encoder
        json_str = json.dumps(response_content, cls=DecimalEncoder)
        # Return JSONResponse with the pre-encoded JSON string
        return JSONResponse(content=json.loads(json_str))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process bank statement: {str(e)}")
