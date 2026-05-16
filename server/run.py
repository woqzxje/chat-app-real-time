"""
Entry point for local development.
Run with:  python run.py
Or:        uvicorn main:socket_app --host 0.0.0.0 --port 5000 --reload
"""
import os
from dotenv import load_dotenv

load_dotenv()

import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "main:socket_app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
