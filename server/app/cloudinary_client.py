import os
import cloudinary
import cloudinary.uploader

# Cấu hình Cloudinary bằng cách lấy thông tin từ biến môi trường
# Các thông tin này dùng để xác thực quyền tải ảnh lên tài khoản Cloudinary của bạn
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


async def upload_image(data_uri: str) -> str:
    """
    Tải một chuỗi ảnh (dạng base64 data URI) lên Cloudinary.
    Hàm này chạy bất đồng bộ để không làm treo server trong khi chờ tải ảnh.
    Trả về: URL an toàn (secure_url) của ảnh sau khi đã tải lên thành công.
    """
    import asyncio
    loop = asyncio.get_event_loop()
    # Vì thư viện cloudinary chưa hỗ trợ async gốc, chúng ta dùng run_in_executor để chạy nó trong một luồng riêng
    result = await loop.run_in_executor(
        None, lambda: cloudinary.uploader.upload(data_uri)
    )
    return result["secure_url"]
