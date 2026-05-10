from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
import bcrypt

from app.models import User
from app.utils import generate_token
from app.cloudinary_client import upload_image
from app.dependencies import get_current_user

user_router = APIRouter()


# ── Request schemas ──────────────────────────────────────────────────────────

class SignupBody(BaseModel):
    fullName: str
    email: str
    password: str
    bio: Optional[str] = None


class LoginBody(BaseModel):
    email: str
    password: str


class UpdateProfileBody(BaseModel):
    profilePic: Optional[str] = None
    bio: Optional[str] = None
    fullName: Optional[str] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _user_dict(user: User, exclude_password: bool = True) -> dict:
    """Serialize a User Beanie document to a plain dict."""
    data = {
        "_id": str(user.id),
        "fullName": user.fullName,
        "email": user.email,
        "profilePic": user.profilePic,
        "bio": user.bio,
        "createdAt": user.createdAt.isoformat(),
        "updatedAt": user.updatedAt.isoformat(),
    }
    if not exclude_password:
        data["password"] = user.password
    return data


# ── POST /api/auth/signup ────────────────────────────────────────────────────

@user_router.post("/signup")
async def signup(body: SignupBody):
    if not body.fullName or not body.email or not body.password:
        return {"success": False, "message": "Missing Details"}

    existing = await User.find_one(User.email == body.email)
    if existing:
        return {"success": False, "message": "Account already exists"}

    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    new_user = User(
        fullName=body.fullName,
        email=body.email,
        password=hashed,
        bio=body.bio or "",
    )
    await new_user.insert()

    token = generate_token(str(new_user.id))
    return {
        "success": True,
        "userData": _user_dict(new_user),
        "token": token,
        "message": "Account created successfully",
    }


# ── POST /api/auth/login ─────────────────────────────────────────────────────

@user_router.post("/login")
async def login(body: LoginBody):
    user = await User.find_one(User.email == body.email)
    if not user:
        return {"success": False, "message": "Invalid credentials"}

    if not bcrypt.checkpw(body.password.encode(), user.password.encode()):
        return {"success": False, "message": "Invalid credentials"}

    token = generate_token(str(user.id))
    return {
        "success": True,
        "userData": _user_dict(user),
        "token": token,
        "message": "Login successful",
    }


# ── GET /api/auth/check ──────────────────────────────────────────────────────

@user_router.get("/check")
async def check_auth(current_user: User = Depends(get_current_user)):
    return {"success": True, "user": _user_dict(current_user)}


# ── PUT /api/auth/update-profile ─────────────────────────────────────────────

@user_router.put("/update-profile")
async def update_profile(
    body: UpdateProfileBody,
    current_user: User = Depends(get_current_user),
):
    update_data: dict = {}

    if body.bio is not None:
        update_data["bio"] = body.bio
    if body.fullName is not None:
        update_data["fullName"] = body.fullName
    if body.profilePic:
        url = await upload_image(body.profilePic)
        update_data["profilePic"] = url

    if update_data:
        from datetime import datetime
        update_data["updatedAt"] = datetime.utcnow()
        await current_user.set(update_data)

    return {"success": True, "user": _user_dict(current_user)}
