from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.models import Report, User, Message
from app.socket_manager import sio, user_socket_map
from datetime import datetime, timedelta
from bson import ObjectId

router = APIRouter()

class ReportCreate(BaseModel):
    reporterId: str
    reportedId: str
    messageId: str
    reason: str

class BanRequest(BaseModel):
    banDurationDays: int

# Danh sách admin email
ADMIN_EMAIL = "quynh0369505599@gmail.com"

@router.post("/")
async def create_report(report_data: ReportCreate):
    # Check if message exists
    try:
        msg = await Message.get(report_data.messageId)
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
    except Exception:
        pass # Beanie get might throw if invalid id format, but let's just proceed

    new_report = Report(
        reporterId=report_data.reporterId,
        reportedId=report_data.reportedId,
        messageId=report_data.messageId,
        reason=report_data.reason,
    )
    await new_report.insert()

    # Emit socket event to admin
    # Find admin user by email
    admin = await User.find_one(User.email == ADMIN_EMAIL)
    if admin:
        admin_sid = user_socket_map.get(str(admin.id))
        if admin_sid:
            # Emit notification
            report_dict = {
                "id": str(new_report.id),
                "reporterId": new_report.reporterId,
                "reportedId": new_report.reportedId,
                "messageId": new_report.messageId,
                "reason": new_report.reason,
                "status": new_report.status,
                "createdAt": new_report.createdAt.isoformat()
            }
            await sio.emit("newReport", report_dict, to=admin_sid)

    return {"message": "Report created successfully", "report_id": str(new_report.id)}


@router.get("/")
async def get_reports(email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    reports = await Report.find_all().to_list()
    # Sort descending by createdAt in Python (or use Beanie sort, but reverse is fine)
    reports.reverse()
    # Thêm thông tin người gửi, người bị report, và nội dung tin nhắn để admin dễ nhìn
    result = []
    for r in reports:
        reporter = None
        if ObjectId.is_valid(r.reporterId):
            reporter = await User.get(r.reporterId)
            
        reported = None
        if ObjectId.is_valid(r.reportedId):
            reported = await User.get(r.reportedId)
            
        msg = None
        if ObjectId.is_valid(r.messageId):
            msg = await Message.get(r.messageId)
        
        result.append({
            "id": str(r.id),
            "reporterName": reporter.fullName if reporter else "Unknown",
            "reportedName": reported.fullName if reported else "Unknown",
            "messageText": msg.text if msg else "[File/Image/Deleted]",
            "reason": r.reason,
            "status": r.status,
            "decision": getattr(r, 'decision', None),
            "createdAt": r.createdAt.isoformat()
        })
    
    return result

@router.post("/{report_id}/ban")
async def ban_user(report_id: str, ban_data: BanRequest, email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    reported_user = await User.get(report.reportedId)
    if not reported_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Set ban duration
    ban_until = datetime.utcnow() + timedelta(days=ban_data.banDurationDays)
    await reported_user.set({"banned_until": ban_until})
    
    # Mark report as resolved
    decision_text = f"Đã cấm chat {ban_data.banDurationDays} ngày" if ban_data.banDurationDays != 365 else "Đã cấm chat vĩnh viễn"
    await report.set({"status": "resolved", "decision": decision_text})
    
    return {"message": "User banned successfully", "banned_until": ban_until.isoformat()}

@router.post("/{report_id}/cancel")
async def cancel_report(report_id: str, email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Mark report as resolved without banning
    await report.set({"status": "resolved", "decision": "Đã hủy bỏ báo cáo"})
    
    return {"message": "Report cancelled successfully"}
