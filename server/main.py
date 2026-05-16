from dotenv import load_dotenv
load_dotenv()   # must be first — before any module that reads os.getenv()

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import connect_db
from app.routes import user_router, message_router
from app.socket_manager import sio

# ── Lifespan: connect DB on startup ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield

# ── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(title="Chat App API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST Routes ──────────────────────────────────────────────────────────────
app.include_router(user_router,    prefix="/api/auth")
app.include_router(message_router, prefix="/api/messages")

@app.get("/api/status")
async def status():
    return {"message": "Server is live"}

# ── Mount Socket.IO on top of FastAPI ────────────────────────────────────────
# All socket events are handled in socket_manager.py
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
