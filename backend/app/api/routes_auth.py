from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import create_access_token, verify_password, hash_password
from app.db.dynamo_client import get_user_persona, create_user, get_user_by_email

router = APIRouter()

# Pydantic model for register request
class RegisterRequest(BaseModel):
    email: str
    password: str
    username: str

# Pydantic model for login request
class LoginRequest(BaseModel):
    email: str
    password: str


# Route to register a new user
@router.post("/register")
async def register(request: RegisterRequest):
    # Check if user with the same email already exists
    existing_user = get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create the new user
    user_creation_response = create_user(request.email, request.password, request.username)
    if user_creation_response:
        return {"message": "User created successfully!"}
    else:
        raise HTTPException(status_code=500, detail="Error creating user")


# Route to login and generate token
@router.post("/token")
async def login(request: LoginRequest):
    # Fetch user by email
    user = get_user_by_email(request.email)
    if not user or not verify_password(request.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token with user_id as subject
    access_token = create_access_token(data={"sub": user['user_id']})
    
    # Pre-cache the user persona
    from app.core.cache import fetch_and_cache_user_persona
    await fetch_and_cache_user_persona(user['user_id'])
    
    return {"access_token": access_token, "token_type": "bearer"}
