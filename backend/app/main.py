from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import logging
from app.api.routes_auth import router as auth_router
from app.api.routes_user import router as user_router
from app.api.routes_interaction import router as interaction_router
from app.api.routes_transaction import router as transaction_router
from app.core.dependencies import get_current_user

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Get the path
    path = request.url.path
    
    # Skip logging for health check endpoints
    if path == "/health":
        return await call_next(request)
    
    # Log the request
    logger.info(f"Request path: {path}")
    
    # Process the request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    logger.info(f"Request completed in {process_time:.4f}s")
    
    return response

# Add JWT authentication middleware
@app.middleware("http")
async def jwt_auth_middleware(request: Request, call_next):
    # Get the path
    path = request.url.path
    
    # Skip authentication for auth routes and OPTIONS requests (for CORS)
    if path.startswith("/auth") or request.method == "OPTIONS":
        return await call_next(request)
    
    # For all other routes, check for JWT token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=401,
            content={"detail": "Missing or invalid authentication token"}
        )
    
    # Extract the token
    token = auth_header.replace("Bearer ", "")
    
    try:
        # Validate the token
        from app.core.auth import verify_token
        verify_token(token)
        
        # Continue with the request
        return await call_next(request)
    except Exception as e:
        # Return 401 Unauthorized if token validation fails
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=401,
            content={"detail": str(e)}
        )

# Include the auth router (register and login routes) - no authentication required
app.include_router(auth_router, prefix="/auth", tags=["auth"])

# Include the user router with authentication
app.include_router(
    user_router, 
    prefix="/users", 
    tags=["users"],
    dependencies=[Depends(get_current_user)]  # Apply authentication to all routes in this router
)

# Include the interaction router with authentication
# No need to include user_id in the path as it's extracted from the token
app.include_router(
    interaction_router,
    prefix="/users",
    tags=["interactions"],
    dependencies=[Depends(get_current_user)]
)

# Include the transaction router with authentication
# No need to include user_id in the path as it's extracted from the token
app.include_router(
    transaction_router,
    prefix="/users",
    tags=["transactions"],
    dependencies=[Depends(get_current_user)]
)
