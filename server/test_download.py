import httpx
import asyncio

async def test():
    url = "https://res.cloudinary.com/duu47eyhb/raw/upload/v1782979492/chat_files/7db0b02673c244d58ed5c818ad5ed11f_TracNghiemJava.pdf"
    headers = {"User-Agent": "Mozilla/5.0"}
    async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
        res = await client.get(url, headers=headers)
        print("STATUS:", res.status_code)
        print("LENGTH:", len(res.content))

if __name__ == "__main__":
    asyncio.run(test())
