import os
from dotenv import load_dotenv
# Phai nap cac bien moi truong tu file .env dau tien de cac module khac co the su dung (vi du: MONGODB_URL)
load_dotenv()

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import cac ham va router tu cac module trong thu muc app
from app.database import connect_db
from app.routes import user_router, message_router
from app.socket_manager import sio, ALLOWED_ORIGINS
from app.routes.file_routes import router as file_router


# â”€â”€ Lifespan: Xu ly cac su kien khi ung dung khoi chay va ket thuc â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ket noi den Database MongoDB ngay khi server bat dau chay
    await connect_db()
    yield
    # Co the them cac tac vu don dep o day neu can

# â”€â”€ Khoi tao ung dung FastAPI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app = FastAPI(title="Chat App API", lifespan=lifespan)

# Cau hinh Middleware CORS.
# BAO MAT: Chi cho phep cac origin trong allow-list (doc tu ALLOWED_ORIGINS),
# khong dung "*" khi allow_credentials=True.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# â”€â”€ Dang ky cac Routes (Duong dan API) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.include_router(user_router,    prefix="/api/auth")
app.include_router(message_router, prefix="/api/messages")
app.include_router(file_router,    prefix="/api/files")

# Route kiem tra trang thai hoat dong cua server
@app.get("/api/status")
async def status():
    return {"message": "Server is live"}

# â”€â”€ Gan Socket.IO vao FastAPI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
