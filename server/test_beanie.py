import asyncio
from beanie import init_beanie, Document
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

class TestDoc(Document):
    name: str
    age: int
    lastSeen: Optional[str] = None
    class Settings:
        name = "test_docs"

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(database=client.chat_app, document_models=[TestDoc])
    
    # Insert
    doc = TestDoc(name="Test", age=20)
    await doc.insert()
    
    # Set
    await doc.set({"lastSeen": "now"})
    
    # Fetch again
    doc_fetched = await TestDoc.get(doc.id)
    print(f"Name: {doc_fetched.name}, Age: {doc_fetched.age}, LastSeen: {doc_fetched.lastSeen}")
    
    await doc.delete()

asyncio.run(main())
