import asyncio
from dotenv import load_dotenv
load_dotenv()
from app.database import connect_db
from app.models import Message

async def check_messages():
    await connect_db()
    messages = await Message.find_all().to_list()
    with open("messages_output.txt", "w", encoding="utf-8") as f:
        if messages:
            for m in messages[-5:]:
                f.write(f"[{m.id}] text: {repr(m.text)}\n")

if __name__ == "__main__":
    asyncio.run(check_messages())
