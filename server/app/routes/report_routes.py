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
    if email == ADMIN_EMAIL:
        reports = await Report.find_all().to_list()
    else:
        user = await User.find_one(User.email == email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        reports = await Report.find(Report.reporterId == str(user.id)).to_list()
        
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
            "createdAt": r.createdAt.isoformat(),
            "banned_until": reported.banned_until.isoformat() if reported and getattr(reported, 'banned_until', None) else None
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
    
    # Thu hồi (soft-delete) tin nhắn bị báo cáo
    if ObjectId.is_valid(report.messageId):
        msg = await Message.get(report.messageId)
        if msg and not msg.isDeleted:
            await msg.set({"isDeleted": True, "deletedByAdmin": True, "text": None, "image": None, "attachment": None})
    
    # Mark report as resolved
    decision_text = f"Đã cấm chat {ban_data.banDurationDays} ngày" if ban_data.banDurationDays != 365 else "Đã cấm chat vĩnh viễn"
    await report.set({"status": "resolved", "decision": decision_text})
    
    # Notify reporter
    reporter_sid = user_socket_map.get(report.reporterId)
    if reporter_sid:
        await sio.emit("reportResolved", {"reportId": report_id, "decision": decision_text}, to=reporter_sid)
    
    # Notify reported user's chat partner to refresh messages (so revoked msg disappears)
    # Emit to all connected clients of the reported user
    reported_sid = user_socket_map.get(report.reportedId)
    if reported_sid:
        await sio.emit("messageRevoked", {"messageId": report.messageId}, to=reported_sid)
    
    return {"message": "User banned successfully", "banned_until": ban_until.isoformat()}

@router.post("/{report_id}/cancel")
async def cancel_report(report_id: str, email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Mark report as resolved without banning
    decision_text = "Đã hủy bỏ báo cáo"
    await report.set({"status": "resolved", "decision": decision_text})
    
    # Notify reporter
    reporter_sid = user_socket_map.get(report.reporterId)
    if reporter_sid:
        await sio.emit("reportResolved", {"reportId": report_id, "decision": decision_text}, to=reporter_sid)
    
    return {"message": "Report cancelled successfully"}

@router.post("/{report_id}/unban")
async def unban_user(report_id: str, email: str):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    reported_user = await User.get(report.reportedId)
    if not reported_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Remove ban
    await reported_user.set({"banned_until": None})
    
    # Update report decision
    decision_text = "Đã gỡ cấm chat"
    await report.set({"decision": decision_text})
    
    return {"message": "User unbanned successfully"}
