from fastapi import Header, HTTPException
from app.models import User
from app.utils import decode_token
import jwt


async def get_current_user(token: str = Header(...)) -> User:
    """
    FastAPI dependency that replaces the Express protectRoute middleware.
    Reads the 'token' header, verifies JWT, and returns the User document.
    """
    try:
        payload = decode_token(token)
        user_id = payload.get("userId")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await User.get(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=str(e))
