from fastapi import Header, HTTPException
from app.models import User
from app.utils import decode_token
import jwt


async def get_current_user(token: str = Header(...)) -> User:
    """
    Dependency của FastAPI đóng vai trò tương tự như middleware 'protectRoute' bên Express.
    Hàm này sẽ:
    1. Đọc mã thông báo 'token' từ Header của yêu cầu.
    2. Giải mã và xác thực JWT.
    3. Tìm kiếm và trả về thông tin người dùng từ cơ sở dữ liệu.
    """
    try:
        # Giải mã token để lấy thông tin bên trong
        payload = decode_token(token)
        user_id = payload.get("userId")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Mã xác thực không hợp lệ")

        # Tìm người dùng trong MongoDB bằng ID
        user = await User.get(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Không tìm thấy người dùng")

        return user
    except jwt.InvalidTokenError:
        # Trường hợp token bị sai, hết hạn hoặc không đúng định dạng
        raise HTTPException(status_code=401, detail="Mã xác thực không hợp lệ hoặc đã hết hạn")
