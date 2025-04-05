import jwt
import datetime
import aiohttp
import ssl
from passlib.context import CryptContext
from typing import Optional

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# JWT Secret Key (use environment variables in production)
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Token expires after 30 minutes

# Create password hash context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Function to hash passwords
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Function to verify passwords
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Function to create access token
def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Generate JWT token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Function to verify JWT token
def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.JWTError:
        raise Exception("Invalid token")

# Function to create OpenAI ephemeral token
async def create_openai_ephemeral_token():
    """
    Creates an ephemeral token for OpenAI's realtime API.
    Returns the response data containing the token.
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise Exception("OPENAI_API_KEY not found in environment variables")
    
    # Create a ClientSession with SSL verification disabled
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    connector = aiohttp.TCPConnector(ssl=ssl_context)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.post(
            "https://api.openai.com/v1/realtime/sessions",
            headers={
                "Authorization": f"Bearer {openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-realtime-preview-2024-12-17",
                "modalities": ["audio", "text"],
                "voice": "echo"
            }
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                raise Exception(f"Failed to create OpenAI ephemeral token: {error_text}")
            
            data = await response.json()
            if not data or "client_secret" not in data or "value" not in data["client_secret"] or not data["client_secret"]["value"]:
                raise Exception("Invalid response: 'client_secret.value' not found or empty in the response data")
            return data["client_secret"]["value"]
            return data
