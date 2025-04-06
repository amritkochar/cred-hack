import aiocache
import json
from decimal import Decimal
from aiocache import Cache
from aiocache.serializers import JsonSerializer

# Custom JSON encoder to handle Decimal objects
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            # Convert Decimal to float or int based on whether it has a fractional part
            return float(obj) if obj % 1 else int(obj)
        return super(DecimalEncoder, self).default(obj)

# Custom JsonSerializer with our DecimalEncoder
class CustomJsonSerializer(JsonSerializer):
    def dumps(self, value):
        return json.dumps(value, cls=DecimalEncoder)
    
    def loads(self, value):
        if value is None:
            return None
        # Check if value is bytes or str
        if isinstance(value, bytes):
            return json.loads(value.decode())
        return json.loads(value)

# Initialize Redis cache

# Use Redis with proper setup
cache = Cache(
    Cache.REDIS,
    endpoint="localhost",
    port=6379,
    serializer=CustomJsonSerializer(),
    namespace="main"
)

# Function to fetch user persona with caching
async def get_cached_user_persona(user_id):
    cache_key = f"user_persona:{user_id}"
    cached_data = await cache.get(cache_key)
    
    if cached_data:
        print("Cache hit!")
        return cached_data
    else:
        print("Cache miss!")
        # Fetch from DynamoDB if cache miss
        user_persona = await fetch_and_cache_user_persona(user_id)
        return user_persona

# Function to fetch user persona and store it in the cache
async def fetch_and_cache_user_persona(user_id):
    # Fetch from DynamoDB
    from app.db.dynamo_client import get_user_persona
    user_persona = get_user_persona(user_id)
    # Remove sensitive fields before caching
    if "username" in user_persona:
        del user_persona["username"]
    if "password" in user_persona:
        del user_persona["password"]
    if "email" in user_persona:
        del user_persona["email"]  
    if "user_id" in user_persona:
        del user_persona["user_id"]    

    if user_persona:
        # Set data in cache with 30-minute TTL
        await cache.set(f"user_persona:{user_id}", user_persona, ttl=60)  # TTL is 1800 seconds (30 mins)
    
    return user_persona

# Function to update the cache with new user persona data
async def update_user_persona_cache(user_id, user_persona):
    """
    Update the cache with new user persona data after an upsert operation.
    """
    if user_persona:
        # Set data in cache with 30-minute TTL
        await cache.set(f"user_persona:{user_id}", user_persona, ttl=1800)  # TTL is 1800 seconds (30 mins)
    
    return user_persona


async def test_cache():
    await cache.set("test_key", {"hello": "world"}, ttl=60)
    value = await cache.get("test_key")
    print("Test cache fetch:", value)
