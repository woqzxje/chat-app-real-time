import os
import jwt as pyjwt

JWT_SECRET = os.getenv("JWT_SECRET", "secret")


def generate_token(user_id: str) -> str:
    """Generate a JWT token for the given user_id (no expiry, matching original behaviour)."""
    payload = {"userId": user_id}
    token = pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token


def decode_token(token: str) -> dict:
    """Decode and verify a JWT token. Raises jwt.InvalidTokenError on failure."""
    return pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
