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
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    system_prompt = "Bạn là trợ lý ảo thân thiện của ứng dụng ChatApp. Nhiệm vụ của bạn là hướng dẫn người dùng mới cách sử dụng các tính năng như: nhắn tin, gửi file, tạo nhóm, gọi video. Hãy trả lời ngắn gọn, súc tích và thân thiện bằng tiếng Việt."
    
    conversation_text = ""
    for msg in request.history:
        role = "Người dùng" if msg.sender == "user" else "Trợ lý"
        conversation_text += f"{role}: {msg.text}\n"
        
    prompt = f"{system_prompt}\n\n{conversation_text}Người dùng: {request.message}\nTrợ lý:"
    try:
        response = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": 300}
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
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"Dưới đây là lịch sử một đoạn chat. Hãy tóm tắt ngắn gọn những ý chính, các quyết định hoặc công việc cần làm (nếu có):\n\n{chat_history}"
    
    try:
        response = model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
