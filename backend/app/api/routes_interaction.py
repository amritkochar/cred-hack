from fastapi import APIRouter, Depends, HTTPException, Body, Query
import uuid
import datetime
from app.core.dependencies import get_current_user
from app.db.dynamo_client import get_interaction_history, upsert_interaction, get_interaction_by_id
from app.db.interaction_table import store_interactions
from app.services.persona_update import update_user_persona_from_transcript

router = APIRouter()

@router.post("/interactions/transcript")
async def save_conversation_transcript(
    transcript: list = Body(...), 
    current_user: dict = Depends(get_current_user)
):
    """
    Save the conversation transcript when a connection is disconnected.
    Creates a unique interaction_id for all messages and saves them to the interactions table.
    """
    user_id = current_user["sub"]
    
    # Generate a unique interaction_id for this conversation
    interaction_id = str(uuid.uuid4())
    
    # Filter for message items only
    message_items = [item for item in transcript if item.get("type") == "MESSAGE"]
    
    # Print for debugging
    print(f"Saving conversation transcript for user {user_id}, interaction_id: {interaction_id}")
    print(f"Total messages: {len(message_items)}")
    
    # Prepare messages for batch saving
    messages_to_save = []
    for item in message_items:
        # Extract required fields
        message_id = item.get("itemId")
        role = item.get("role")
        content = item.get("content")
        
        # Skip if missing required fields
        if not message_id or not role or not content:
            continue
        
        # Convert createdAtMs (milliseconds since epoch) to standard datetime format
        created_at_ms = item.get("createdAtMs")
        created_at = None
        if created_at_ms:
            try:
                # Convert milliseconds to seconds
                timestamp_seconds = created_at_ms / 1000
                # Convert to datetime object
                dt = datetime.datetime.fromtimestamp(timestamp_seconds)
                # Format as string in standard format
                created_at = dt.strftime("%Y-%m-%d %H:%M:%S")
            except (ValueError, TypeError) as e:
                print(f"Error converting timestamp: {e}")
                # Use current time as fallback
                created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        else:
            # Use current time if createdAtMs is not available
            created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Prepare data for saving
        message_data = {
            "message_id": message_id,
            "role": role,
            "content": content,
            "created_at": created_at
        }
        
        messages_to_save.append(message_data)
    
    # Batch save all messages to DynamoDB
    num_saved = 0
    if messages_to_save:
        num_saved = store_interactions(user_id, interaction_id, messages_to_save)
        print(f"Successfully batch saved {num_saved} messages")
        
        # Update user persona based on conversation
        try:
            updated_persona = await update_user_persona_from_transcript(user_id, messages_to_save)
            if updated_persona:
                print(f"Successfully updated user persona for user {user_id}")
        except Exception as e:
            print(f"Error updating user persona: {e}")
    
    return {
        "status": "success", 
        "message": f"Saved {num_saved} messages to interaction {interaction_id}",
        "interaction_id": interaction_id
    }

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
