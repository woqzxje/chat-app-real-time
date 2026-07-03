# server/app/routes/file_routes.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import List
from pydantic import BaseModel
import uuid, httpx, zipfile, io
from urllib.parse import unquote

import cloudinary.uploader

from app.dependencies import get_current_user
from app.models import User

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024
MAX_FOLDER_SIZE = 200 * 1024 * 1024


def get_file_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in ["jpg", "jpeg", "png", "gif", "webp"]:
        return "image"
    if ext in ["mp4", "mov", "avi", "mkv"]:
        return "video"
    if ext in ["mp3", "wav", "ogg", "m4a", "webm"]:
        return "audio"
    if ext in ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"]:
        return "document"
    if ext in ["zip", "rar", "7z", "tar", "gz"]:
        return "archive"
    return "other"


def _basename(path: str) -> str:
    """Trích tên file từ đường dẫn (hỗ trợ cả / và \\)."""
    return path.replace("\\", "/").rsplit("/", 1)[-1]


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
        else "video" if file_type in ["video", "audio"]
        else "raw"
    )

    try:
        public_id = f"chat_files/{uuid.uuid4().hex}_{file.filename}"
        if resource_type == "raw":
            public_id += ".dat"

        result = cloudinary.uploader.upload(
            content,
            resource_type=resource_type,
            public_id=public_id,
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
    """Upload từng file riêng lẻ trong folder lên Cloudinary (không nén ZIP)."""
    uploaded_files = []
    total_size = 0
    folder_name = ""

    for f in files:
        content = await f.read()
        total_size += len(content)

        if total_size > MAX_FOLDER_SIZE:
            raise HTTPException(status_code=400, detail="Folder quá lớn (tối đa 200MB)")

        # Lấy tên folder gốc từ file đầu tiên (webkitRelativePath dạng "folder/file.txt")
        if not folder_name and f.filename:
            parts = f.filename.replace("\\", "/").split("/")
            folder_name = parts[0] if len(parts) > 1 else "folder"

        basename = _basename(f.filename)
        file_type = get_file_type(basename)
        resource_type = (
            "image" if file_type == "image"
            else "video" if file_type in ["video", "audio"]
            else "raw"
        )

        try:
            public_id = f"chat_files/{uuid.uuid4().hex}_{basename}"
            if resource_type == "raw":
                public_id += ".dat"

            result = cloudinary.uploader.upload(
                content,
                resource_type=resource_type,
                public_id=public_id,
            )
            uploaded_files.append({
                "url": result["secure_url"],
                "file_name": f.filename,      # Đường dẫn tương đối gốc
                "file_type": file_type,
                "file_size": len(content),
                "resource_type": resource_type,
            })
        except Exception as e:
            print(f"[upload-folder] Bỏ qua file lỗi {f.filename}: {e}")
            continue

    if not uploaded_files:
        raise HTTPException(status_code=500, detail="Không thể upload bất kỳ file nào trong folder")

    return {
        "url": uploaded_files[0]["url"],
        "file_name": folder_name,
        "file_type": "folder",
        "file_size": total_size,
        "resource_type": "raw",
        "file_count": len(uploaded_files),
        "files": uploaded_files,
    }


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
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
        target_url = unquote(url)
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=120.0) as client:
            resp = await client.get(target_url, headers=headers)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Không thể tải file từ nguồn")

            # Luôn dùng application/octet-stream để browser trigger download
            # (đặc biệt quan trọng cho .zip, .rar, .7z... mà browser có thể
            # cố hiển thị inline hoặc chặn)
            content_type = "application/octet-stream"

            return StreamingResponse(
                iter([resp.content]),
                media_type=content_type,
                headers={
                    "Content-Disposition": f'attachment; filename="{name}"',
                    "Content-Length": str(len(resp.content)),
                    "Access-Control-Expose-Headers": "Content-Disposition",
                },
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Lỗi kết nối tải file: {str(e)}")


# ── Model cho download folder ────────────────────────────────────────────────
class FolderFileItem(BaseModel):
    url: str        # URL Cloudinary
    file_name: str  # Đường dẫn tương đối (ví dụ: folder/sub/file.txt)


class FolderDownloadRequest(BaseModel):
    folder_name: str              # Tên folder gốc
    files: List[FolderFileItem]   # Danh sách file trong folder


@router.post("/download-folder")
async def download_folder(
    body: FolderDownloadRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Tải tất cả file của folder từ Cloudinary, nén thành ZIP giữ nguyên
    cấu trúc thư mục rồi stream về cho client.
    """
    if not body.files:
        raise HTTPException(status_code=400, detail="Danh sách file trống")

    buf = io.BytesIO()

    try:
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=120.0) as client:
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for item in body.files:
                    target_url = unquote(item.url)
                    resp = await client.get(target_url)
                    if resp.status_code != 200:
                        print(f"[download-folder] Bỏ qua file lỗi: {item.file_name}")
                        continue
                    # Dùng đường dẫn tương đối gốc làm tên entry trong ZIP
                    zf.writestr(item.file_name, resp.content)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Lỗi kết nối: {str(e)}")

    buf.seek(0)
    zip_name = f"{body.folder_name}.zip"

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_name}"',
            "Content-Length": str(buf.getbuffer().nbytes),
        },
    )