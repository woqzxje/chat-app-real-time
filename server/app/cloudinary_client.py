import os
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


async def upload_image(data_uri: str) -> str:
    """Upload a base64 data URI to Cloudinary and return the secure_url."""
    import asyncio
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, lambda: cloudinary.uploader.upload(data_uri)
    )
    return result["secure_url"]
