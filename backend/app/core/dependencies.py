from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.core.auth import verify_token

# OAuth2PasswordBearer is used to extract the token from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency to get the current user from the JWT token
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        user_data = verify_token(token)
        return user_data
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
