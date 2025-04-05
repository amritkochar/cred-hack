from fastapi import APIRouter, Depends, HTTPException, Body, Query
import uuid
from app.core.dependencies import get_current_user
from app.db.dynamo_client import get_interaction_history, upsert_interaction, get_interaction_by_id

router = APIRouter()

@router.get("/interactions")
async def get_user_interactions(current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    
    interactions = get_interaction_history(user_id)
    if not interactions:
        raise HTTPException(status_code=404, detail="Interaction history not found")
    return interactions

@router.get("/interactions/{interaction_id}")
async def get_interaction_messages(
    interaction_id: str, 
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["sub"]
    
    messages = get_interaction_by_id(user_id, interaction_id)
    if not messages:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return messages

@router.post("/interactions")
async def update_user_interaction(
    data: dict = Body(...), 
    current_user: dict = Depends(get_current_user)
):
    """
    Update or create interaction data.
    Only updates fields provided in the request, preserving existing fields.
    Ensures that user_id, sort_id, interaction_id, message_id, created_at, updated_at are always present.
    For a given user and interaction, multiple messages make up an interaction.
    """
    user_id = current_user["sub"]
    
    # Ensure interaction_id is present
    if not data.get("interaction_id"):
        data["interaction_id"] = str(uuid.uuid4())
    
    # Ensure message_id is present
    if not data.get("message_id"):
        data["message_id"] = str(uuid.uuid4())
    
    # Upsert the interaction data
    result = upsert_interaction(user_id, data)
    
    return result
