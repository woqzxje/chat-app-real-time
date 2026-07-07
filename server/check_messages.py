import asyncio
import json
from dotenv import load_dotenv
load_dotenv()
from app.database import connect_db
from app.models import User, Message, ChatGroup

async def run():
    await connect_db()
    users = await User.find_all().to_list()
    msgs = await Message.find_all().to_list()
    out = {
        'users': [{'id': str(u.id), 'name': u.fullName} for u in users],
        'messages': [{'id': str(m.id), 'sender': m.senderId, 'receiver': m.receiverId, 'text': m.text, 'deleted': m.isDeleted, 'system': m.isSystemMessage} for m in msgs]
    }
    with open("messages_output.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    asyncio.run(run())
