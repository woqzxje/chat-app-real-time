import os
import motor.motor_asyncio
from beanie import init_beanie
from app.models import User, Message

MONGODB_URL = os.getenv("MONGODB_URL")

async def connect_db():
    """Initialize Motor client and Beanie ODM."""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client["chat-app"]
    await init_beanie(database=db, document_models=[User, Message])
    print("Database Connected successfully")
