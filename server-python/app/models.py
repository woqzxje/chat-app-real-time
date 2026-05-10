from typing import Optional
from datetime import datetime
from beanie import Document
from pydantic import Field


class User(Document):
    """Mirrors the Mongoose User schema."""
    email: str
    fullName: str
    password: str
    profilePic: str = ""
    bio: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"


class Message(Document):
    """Mirrors the Mongoose Message schema."""
    senderId: str       # stored as string ObjectId
    receiverId: str
    text: Optional[str] = None
    image: Optional[str] = None
    seen: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "messages"
