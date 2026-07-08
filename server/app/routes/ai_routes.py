import os
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.dependencies import get_current_user
from app.models import Message, User
from beanie.operators import Or

router = APIRouter(tags=["AI Integration"])

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[list[ChatMessage]] = []

@router.post("/chat")
async def chat_with_ai(request: ChatRequest, current_user: User = Depends(get_current_user)):
    current_user_id = str(current_user.id)
    """API cho chatbot hướng dẫn người mới."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    system_prompt = """Bạn là trợ lý ảo thông minh, đa năng và thân thiện của ứng dụng ChatApp. Nhiệm vụ của bạn không chỉ là hướng dẫn người dùng cách sử dụng các tính năng của hệ thống mà còn có thể trò chuyện, giải đáp các câu hỏi ngoài lề, tóm tắt, dịch thuật, và hỗ trợ mọi yêu cầu khác. Hãy trả lời nhiệt tình, rõ ràng, định dạng đẹp mắt (dùng emoji, bullet points, in đậm) và thân thiện bằng ngôn ngữ mà người dùng sử dụng.
Tuyệt đối KHÔNG TỪ CHỐI hay né tránh trả lời các câu hỏi ngoài lề. Hãy đáp ứng mọi yêu cầu của người dùng một cách tốt nhất có thể.

Nếu người dùng hỏi về cách sử dụng ứng dụng ChatApp, tuyệt đối KHÔNG BỊA ĐẶT tính năng. Hãy hướng dẫn TỪNG BƯỚC cụ thể dựa trên danh sách các thao tác hiện có dưới đây:
1. Giao diện chính:
   - Cột trái: Chứa danh sách bạn bè, các nhóm chat và thanh tìm kiếm.
   - Cột giữa: Là khung hiển thị nội dung chat.
   - Cột phải: Hiển thị thông tin chi tiết (thông tin cá nhân/nhóm, hình ảnh, file đã gửi).
   - Đổi giao diện: Nhấn vào nút biểu tượng robot BB-8 ở góc trái dưới cùng của màn hình để chuyển đổi Giao diện Tối/Sáng (Dark/Light mode).
2. Nhắn tin:
   - Gửi tin: Nhập văn bản vào ô nhập liệu ở dưới cùng cột giữa và nhấn Gửi.
   - Tương tác: Di chuột qua tin nhắn để Thả cảm xúc (React), Thu hồi (Soft delete) hoặc Chỉnh sửa tin nhắn.
3. Gửi File/Ảnh:
   - Bấm vào nút đính kèm (biểu tượng dấu +) nằm bên cạnh ô nhập tin nhắn.
   - Chọn Gửi hình ảnh, Gửi tài liệu hoặc Gửi thư mục từ máy tính của bạn.
4. Gọi điện (Video/Voice Call):
   - Mở đoạn chat với người hoặc nhóm bạn muốn gọi.
   - Nhìn lên góc trên cùng của khung chat, bấm vào biểu tượng Điện thoại để Gọi thoại hoặc biểu tượng Máy quay để Gọi Video.
5. Quản lý Nhóm:
   - Tạo nhóm: Nhấn vào biểu tượng tạo nhóm chat ở cột trái.
   - Tùy chỉnh: Mở nhóm chat, mở cột thông tin bên phải để đổi tên nhóm, thêm thành viên mới, hoặc xóa thành viên (nếu có quyền).
6. Bạn bè:
   - Tìm & Kết bạn: Nhập tên/email vào thanh tìm kiếm ở cột trái để tìm người dùng, sau đó nhấn gửi yêu cầu kết bạn.
   - Hủy kết bạn: Mở đoạn chat với người đó, mở cột thông tin bên phải, cuộn xuống dưới cùng và nhấn nút Hủy kết bạn.
7. AI Tóm tắt:
   - Nhấn vào nút hình ngôi sao lấp lánh ở góc trên cùng của khung chat để AI tự động tóm tắt nhanh nội dung đoạn chat hiện tại."""
    
    conversation_text = ""
    for msg in request.history:
        role = "Người dùng" if msg.sender == "user" else "Trợ lý"
        conversation_text += f"{role}: {msg.text}\n"
        
    prompt = f"{system_prompt}\n\n{conversation_text}Người dùng: {request.message}\nTrợ lý:"
    try:
        response = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": 1500}
        )
        return {"reply": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summarize/{target_id}")
async def summarize_chat(target_id: str, current_user: User = Depends(get_current_user)):
    current_user_id = str(current_user.id)
    """API tóm tắt đoạn hội thoại giữa user hiện tại và target_id (có thể là user khác hoặc group)."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured")
        
    # Lấy tối đa 50 tin nhắn gần nhất
    messages = await Message.find(
        Or(
            Message.receiverId == target_id,
            Message.senderId == target_id
        )
    ).sort(-Message.createdAt).limit(50).to_list()
    
    if not messages:
        return {"summary": "Không có lịch sử hội thoại để tóm tắt."}
        
    # Sắp xếp lại theo thứ tự thời gian cũ -> mới
    messages.reverse()
    
    chat_history = ""
    for msg in messages:
        sender = "Tôi" if msg.senderId == current_user_id else ("Người nhận" if msg.receiverId == target_id else "Người gửi")
        content = msg.text or "[File/Hình ảnh/Cảm xúc]"
        chat_history += f"{sender}: {content}\n"
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"Dưới đây là lịch sử một đoạn chat. Hãy tóm tắt ngắn gọn những ý chính, các quyết định hoặc công việc cần làm (nếu có):\n\n{chat_history}"
    
    try:
        response = model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
