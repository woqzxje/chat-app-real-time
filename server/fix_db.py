import asyncio
from dotenv import load_dotenv
load_dotenv()
from app.database import connect_db
from app.models import Report

async def fix():
    await connect_db()
    reports = await Report.find(Report.status == "resolved").to_list()
    for r in reports:
        if getattr(r, 'decision', None) is None:
            await r.set({Report.decision: "Đã cấm chat 1 ngày (dữ liệu cũ)"})
            print(f"Fixed {r.id}")

if __name__ == "__main__":
    asyncio.run(fix())
