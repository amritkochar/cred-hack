import os
import json
import ssl
import aiohttp
from app.db.dynamo_client import get_user_persona, upsert_user_persona
from app.core.cache import update_user_persona_cache, DecimalEncoder

# Get OpenAI API key from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("WARNING: OPENAI_API_KEY environment variable not set")

async def update_user_persona_from_transcript(user_id: str, messages: list) -> dict:
    """
    Update user persona based on conversation transcript.
    
    Args:
        user_id: The user's ID
        messages: List of conversation messages
        
    Returns:
        Updated user persona
    """
    # 1. Fetch current user persona
    current_persona = get_user_persona(user_id)
    if not current_persona:
        print(f"No user persona found for user {user_id}")
        return None
    
    # 2. Format conversation transcript for OpenAI
    formatted_messages = []
    for msg in messages:
        if msg.get("role") and msg.get("content"):
            formatted_messages.append({
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["content"]
            })
    
    # Skip if no valid messages
    if not formatted_messages:
        print("No valid messages to process")
        return current_persona
    
    # 3. Create system prompt with context and instructions
    system_prompt = create_system_prompt(current_persona)
    
    # 4. Call OpenAI API
    try:
        # Prepare the messages for the API call
        api_messages = [
            {"role": "system", "content": system_prompt},
            *formatted_messages,
            {"role": "user", "content": "Based on this conversation, update the user persona."}
        ]
        
        # Make the API call with SSL verification disabled
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4",
                    "messages": api_messages,
                    "temperature": 0.2,
                    "max_tokens": 1000
                }
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    print(f"OpenAI API error: {error_text}")
                    return current_persona
                
                response_data = await response.json()
        
        # 5. Parse response
        updated_persona = parse_openai_response(response_data, current_persona)
        
        # 6. Save updated persona
        if updated_persona:
            result = upsert_user_persona(user_id, updated_persona)
            await update_user_persona_cache(user_id, result)
            return result
            
    except Exception as e:
        print(f"Error updating user persona: {e}")
        return current_persona
    
    return current_persona

def create_system_prompt(current_persona: dict) -> str:
    """
    Create system prompt with context and instructions.
    """
    return f"""
    You are an AI financial advisor analyzing conversations to update a user's financial profile.
    
    CONTEXT:
    This is a financial advisory application that helps users manage their finances, set investment goals, and track spending patterns.
    
    USER PERSONA SCHEMA:
    ```
    {{
      "firstName": string,  // User's first name
      "lastName": string,   // User's last name
      "risk_profile": string,  // Conservative, Moderate, Aggressive, etc.
      "investment_goals": [
        {{
          "id": string,
          "name": string,
          "description": string,
          "targetAmount": number,
          "targetDate": string,
          "priority": string,
          "progress": number
        }}
      ],
      "spending_pattern": {{
        "monthly_avg_spend": number,
        "monthly_savings_rate": number,
        "monthly_avg_categories": {{ [category: string]: number }},
        "monthly_avg_surplus": number,
        "monthly_avg_income": number
      }},
      "financial_summary": {{
        "monthly_historic": {{ [month: string]: {{ "income": number, "surplus": number, "spends": number }} }},
        "total_cumulative": {{
          "income": number,
          "spends": number,
          "categories": {{ [category: string]: number }},
          "surplus": number
        }}
      }},
      "personal_context": [string]  // Array of strings with personal financial context
    }}
    ```
    
    CURRENT USER PERSONA:
    ```
    {json.dumps(current_persona, indent=2, cls=DecimalEncoder)}
    ```
    
    TASK:
    1. Analyze the conversation transcript
    2. Extract relevant financial information, goals, preferences, and behaviors
    3. Update the user persona fields based on the conversation
    4. IMPORTANT: If the user's name is mentioned in the conversation:
       - Extract the firstName and lastName if provided
       - If only a full name is given, split it appropriately into firstName and lastName
       - Only update these fields if they are not already populated in the current persona
       - Store the name with proper capitalization
    5. IMPORTANT: For the "risk_profile" field:
       - If it's empty or null, assign the most appropriate value based on the conversation
       - If it already has a value, evaluate if it should be changed based on the current conversation
       - Valid values include: "Conservative", "Moderate", "Balanced", "Growth", "Aggressive"
       - Always ensure this field has a value, even if you need to make a best guess
    5. Pay special attention to capturing user preferences such as:
       - Preferred language(s)
       - Geographic location
       - Cultural background
       - Communication style preferences
       - Financial literacy level
       - Risk tolerance details
       - Time horizon for investments
       - Family situation (married, children, etc.)
       - Employment status and industry
       - Special financial circumstances
       - Any other important personal details mentioned
    6. Store these preferences and contextual information in the "personal_context" array as individual items
    7. Perform sentiment analysis on the conversation to determine:
       - User's emotional state (e.g., anxious, confident, frustrated, optimistic)
       - Overall tone of the conversation (e.g., formal, casual, urgent, relaxed)
       - Mood patterns throughout the interaction
       - Any emotional triggers related to financial topics
    8. Add sentiment analysis insights to the "personal_context" array with a prefix like "SENTIMENT:" 
       For example: "SENTIMENT: User exhibits anxiety when discussing long-term investments"
    9. Return the COMPLETE updated user persona in the same JSON format
    10. Only modify fields where you have new information from the conversation
    11. For personal_context, add new insights as new items in the array, don't remove existing items
    
    IMPORTANT: Return ONLY the updated JSON object with no additional text or explanation.
    """

def parse_openai_response(response_data, current_persona: dict) -> dict:
    """
    Parse OpenAI response and extract updated user persona.
    """
    try:
        content = response_data["choices"][0]["message"]["content"].strip()
        
        # Try to extract JSON from the response
        try:
            # First try to parse the entire response as JSON
            updated_persona = json.loads(content)
        except json.JSONDecodeError:
            # If that fails, try to extract JSON from markdown code blocks
            import re
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
            if json_match:
                updated_persona = json.loads(json_match.group(1))
            else:
                print("Failed to extract JSON from response")
                return current_persona
        
        # Validate the updated persona has the required fields
        if not all(key in updated_persona for key in ["risk_profile", "investment_goals", "spending_pattern", "financial_summary", "personal_context"]):
            print("Updated persona is missing required fields")
            return current_persona
        
        # Remove key fields that should not be updated
        if "user_id" in updated_persona:
            del updated_persona["user_id"]
        
        # Only keep the fields we want to update
        filtered_persona = {
            "risk_profile": updated_persona["risk_profile"],
            "investment_goals": updated_persona["investment_goals"],
            "spending_pattern": updated_persona["spending_pattern"],
            "financial_summary": updated_persona["financial_summary"],
            "personal_context": updated_persona["personal_context"]
        }
        
        # Add firstName and lastName if they exist in the updated persona
        # and are not already in the current persona
        if "firstName" in updated_persona and (not current_persona.get("firstName") or current_persona.get("firstName") == ""):
            filtered_persona["firstName"] = updated_persona["firstName"]
            
        if "lastName" in updated_persona and (not current_persona.get("lastName") or current_persona.get("lastName") == ""):
            filtered_persona["lastName"] = updated_persona["lastName"]
            
        return filtered_persona
        
    except Exception as e:
        print(f"Error parsing OpenAI response: {e}")
        return current_persona
