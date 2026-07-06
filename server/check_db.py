import asyncio
from dotenv import load_dotenv
load_dotenv()
from app.database import connect_db
from app.models import Report

async def check():
    await connect_db()
    reports = await Report.find_all().to_list()
    for r in reports:
        print(r.id, r.status, getattr(r, 'decision', 'NO_DECISION_FIELD'))

if __name__ == "__main__":
    asyncio.run(check())
