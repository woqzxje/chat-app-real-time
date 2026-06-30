# server/app/routes/file_routes.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import List
import uuid, zipfile, io, httpx

import cloudinary.uploader

from app.dependencies import get_current_user   # ← đúng theo project bạn
from app.models import User                     # ← đúng theo project bạn

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024
MAX_FOLDER_SIZE = 200 * 1024 * 1024


def get_file_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in ["jpg", "jpeg", "png", "gif", "webp"]:
        return "image"
    if ext in ["mp4", "mov", "avi", "mkv"]:
        return "video"
    if ext in ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"]:
        return "document"
    if ext in ["zip", "rar", "7z", "tar", "gz"]:
        return "archive"
    return "other"


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File quá lớn (tối đa 50MB)")

    file_type = get_file_type(file.filename)
    resource_type = (
        "image" if file_type == "image"
        else "video" if file_type == "video"
        else "raw"
    )

    try:
        result = cloudinary.uploader.upload(
            content,
            resource_type=resource_type,
            public_id=f"chat_files/{uuid.uuid4().hex}_{file.filename}",
            use_filename=True,
            unique_filename=False,
        )
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "file_name": file.filename,
            "file_type": file_type,
            "file_size": len(content),
            "resource_type": resource_type,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload thất bại: {str(e)}")


@router.post("/upload-folder")
async def upload_folder(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    zip_buffer = io.BytesIO()
    total_size = 0

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            content = await f.read()
            total_size += len(content)
            if total_size > MAX_FOLDER_SIZE:
                raise HTTPException(
                    status_code=400, detail="Folder quá lớn (tối đa 200MB)"
                )
            zf.writestr(f.filename, content)

    zip_buffer.seek(0)
    folder_zip_name = f"folder_{uuid.uuid4().hex[:8]}.zip"

    try:
        result = cloudinary.uploader.upload(
            zip_buffer.read(),
            resource_type="raw",
            public_id=f"chat_folders/{folder_zip_name}",
        )
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "file_name": folder_zip_name,
            "file_type": "folder",
            "file_size": total_size,
            "resource_type": "raw",
            "file_count": len(files),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload folder thất bại: {str(e)}")


@router.get("/download")
async def download_file(
    url: str = Query(..., description="URL file trên Cloudinary cần tải"),
    name: str = Query("file", description="Tên file khi tải về"),
    current_user: User = Depends(get_current_user),
):
    """
    Proxy download: Tải file từ Cloudinary rồi stream về cho client.
    Lý do cần proxy: Thuộc tính HTML `download` không hoạt động với cross-origin URL.
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Không thể tải file từ nguồn")

            # Xác định content-type từ response gốc
            content_type = resp.headers.get("content-type", "application/octet-stream")

            return StreamingResponse(
                iter([resp.content]),
                media_type=content_type,
                headers={
                    "Content-Disposition": f'attachment; filename="{name}"',
                    "Content-Length": str(len(resp.content)),
                },
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Lỗi kết nối tải file: {str(e)}")