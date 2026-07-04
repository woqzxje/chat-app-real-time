import asyncio
import sys
import os
from dotenv import load_dotenv
import pprint

sys.path.append(os.getcwd())
from app.database import connect_db
from app.models import User

async def list_users():
    load_dotenv()
    await connect_db()
    users = await User.find_all().to_list()
    for u in users:
        print(u.email, u.fullName, u.isAdmin)

if __name__ == "__main__":
    asyncio.run(list_users())
