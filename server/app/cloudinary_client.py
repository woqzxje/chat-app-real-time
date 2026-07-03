import os
import base64
import cloudinary
import cloudinary.uploader
from fastapi import HTTPException

# Cau hinh Cloudinary bang cach lay thong tin tu bien moi truong
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

# Gioi han kich thuoc anh base64 (mac dinh 10MB) de tranh lam nghen bo nho/server.
MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE", str(10 * 1024 * 1024)))


def _estimate_base64_bytes(data_uri: str) -> int:
    """Uoc luong so byte thuc te tu chuoi base64 (bo phan header 'data:...;base64,')."""
    if not data_uri:
        return 0
    b64 = data_uri.split(",", 1)[1] if "," in data_uri else data_uri
    # Moi 4 ky tu base64 ~ 3 byte
    return (len(b64) * 3) // 4


async def upload_image(data_uri: str) -> str:
    """
    Tai mot chuoi anh (dang base64 data URI) len Cloudinary.
    Chay bat dong bo de khong lam treo server trong khi cho tai anh.
    BAO MAT/ON DINH: chan anh vuot qua MAX_IMAGE_SIZE truoc khi upload.
    Tra ve: URL an toan (secure_url) cua anh sau khi tai len thanh cong.
    """
    if _estimate_base64_bytes(data_uri) > MAX_IMAGE_SIZE:
        limit_mb = MAX_IMAGE_SIZE // (1024 * 1024)
        raise HTTPException(status_code=400, detail=f"Anh qua lon (toi da {limit_mb}MB)")

    import asyncio
    loop = asyncio.get_event_loop()
    # Thu vien cloudinary chua ho tro async goc, dung run_in_executor de chay o luong rieng
    result = await loop.run_in_executor(
        None, lambda: cloudinary.uploader.upload(data_uri)
    )
    return result["secure_url"]
