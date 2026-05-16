import os
import jwt as pyjwt

# Lấy khóa bí mật JWT từ biến môi trường (mặc định là "secret" nếu không tìm thấy)
JWT_SECRET = os.getenv("JWT_SECRET", "secret")


def generate_token(user_id: str) -> str:
    """
    Tạo một mã thông báo JWT cho user_id được cung cấp.
    Mã này được sử dụng để xác thực người dùng trong các yêu cầu sau này.
    """
    payload = {"userId": user_id}
    # Mã hóa payload bằng thuật toán HS256 và khóa bí mật
    token = pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token


def decode_token(token: str) -> dict:
    """
    Giải mã và xác minh mã thông báo JWT. 
    Nếu mã không hợp lệ hoặc đã hết hạn, hàm sẽ ném ra lỗi jwt.InvalidTokenError.
    """
    return pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
