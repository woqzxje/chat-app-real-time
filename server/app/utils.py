import os
import jwt as pyjwt
from datetime import datetime, timedelta, timezone

# Lay khoa bi mat JWT tu bien moi truong.
# BAO MAT: Khong dung gia tri fallback doan duoc; neu thieu JWT_SECRET thi
# ung dung se dung khi khoi tao (fail loudly) thay vi chay voi secret yeu.
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET chua duoc thiet lap. Vui long dat bien moi truong JWT_SECRET "
        "truoc khi khoi chay server (khong duoc dung gia tri mac dinh)."
    )

# Thoi han token (ngay). Co the cau hinh qua bien moi truong JWT_EXPIRES_DAYS.
JWT_EXPIRES_DAYS = int(os.getenv("JWT_EXPIRES_DAYS", "7"))


def generate_token(user_id: str) -> str:
    """
    Tao mot ma thong bao JWT cho user_id duoc cung cap.
    Token co claim `exp` de tu dong het han sau JWT_EXPIRES_DAYS ngay.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "userId": user_id,
        "iat": now,
        "exp": now + timedelta(days=JWT_EXPIRES_DAYS),
    }
    token = pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token


def decode_token(token: str) -> dict:
    """
    Giai ma va xac minh ma thong bao JWT.
    Neu ma khong hop le hoac da het han, ham se nem ra loi jwt.InvalidTokenError
    (bao gom jwt.ExpiredSignatureError).
    """
    return pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
