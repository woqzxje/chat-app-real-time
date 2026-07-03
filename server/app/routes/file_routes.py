# server/app/routes/file_routes.py
import os
import uuid
import io
import re
import zipfile
from typing import List
from urllib.parse import unquote, urlparse

import httpx
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import cloudinary.uploader

from app.dependencies import get_current_user
from app.models import User

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024
MAX_FOLDER_SIZE = 200 * 1024 * 1024

# â”€â”€ BAO MAT (chong SSRF): chi cho phep tai file tu cac domain Cloudinary tin cay â”€â”€
# Co the mo rong qua bien moi truong ALLOWED_DOWNLOAD_HOSTS (ngan cach dau phay).
_DEFAULT_ALLOWED_HOSTS = "res.cloudinary.com"
ALLOWED_DOWNLOAD_HOSTS = {
    h.strip().lower()
    for h in os.getenv("ALLOWED_DOWNLOAD_HOSTS", _DEFAULT_ALLOWED_HOSTS).split(",")
    if h.strip()
}


def _is_allowed_url(raw_url: str) -> bool:
    """Kiem tra URL co host nam trong allow-list Cloudinary hay khong."""
    try:
        parsed = urlparse(raw_url)
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.hostname or "").lower()
    if not host:
        return False
    # Cho phep host chinh xac hoac subdomain cua host duoc phep
    return any(host == allowed or host.endswith("." + allowed) for allowed in ALLOWED_DOWNLOAD_HOSTS)


def _sanitize_filename(name: str) -> str:
    """Loai bo CR/LF va dau nhay de tranh header injection trong Content-Disposition."""
    if not name:
        return "file"
    # Bo ky tu xuong dong va nhay kep/nhay don, gioi han do dai
    cleaned = re.sub(r'[\r\n"\'\\]', "", name).strip()
    cleaned = cleaned.replace("/", "_").replace("\\", "_")
    return cleaned[:255] or "file"


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


def _basename(path: str) -> str:
    """Trich ten file tu duong dan (ho tro ca / va \\)."""
    return path.replace("\\", "/").rsplit("/", 1)[-1]


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File qua lon (toi da 50MB)")

    file_type = get_file_type(file.filename)
    resource_type = (
        "image" if file_type == "image"
        else "video" if file_type == "video"
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
        raise HTTPException(status_code=500, detail=f"Upload that bai: {str(e)}")


@router.post("/upload-folder")
async def upload_folder(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload tung file rieng le trong folder len Cloudinary (khong nen ZIP)."""
    uploaded_files = []
    total_size = 0
    folder_name = ""

    for f in files:
        content = await f.read()
        total_size += len(content)

        if total_size > MAX_FOLDER_SIZE:
            raise HTTPException(status_code=400, detail="Folder qua lon (toi da 200MB)")

        if not folder_name and f.filename:
            parts = f.filename.replace("\\", "/").split("/")
            folder_name = parts[0] if len(parts) > 1 else "folder"

        basename = _basename(f.filename)
        file_type = get_file_type(basename)
        resource_type = (
            "image" if file_type == "image"
            else "video" if file_type == "video"
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
                "file_name": f.filename,
                "file_type": file_type,
                "file_size": len(content),
                "resource_type": resource_type,
            })
        except Exception as e:
            print(f"[upload-folder] Bo qua file loi {f.filename}: {e}")
            continue

    if not uploaded_files:
        raise HTTPException(status_code=500, detail="Khong the upload bat ky file nao trong folder")

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
    url: str = Query(..., description="URL file tren Cloudinary can tai"),
    name: str = Query("file", description="Ten file khi tai ve"),
    current_user: User = Depends(get_current_user),
):
    """
    Proxy download: Tai file tu Cloudinary roi stream ve cho client.
    Ly do can proxy: Thuoc tinh HTML `download` khong hoat dong voi cross-origin URL.
    BAO MAT: chi cho phep tai tu domain Cloudinary trong allow-list (chong SSRF),
    va bat xac thuc TLS (khong dung verify=False).
    """
    target_url = unquote(url)
    if not _is_allowed_url(target_url):
        raise HTTPException(status_code=400, detail="URL khong hop le hoac khong duoc phep")

    safe_name = _sanitize_filename(name)
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        async with httpx.AsyncClient(follow_redirects=True, timeout=120.0) as client:
            resp = await client.get(target_url, headers=headers)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Khong the tai file tu nguon")

            # Luon dung application/octet-stream de browser trigger download
            content_type = "application/octet-stream"

            return StreamingResponse(
                iter([resp.content]),
                media_type=content_type,
                headers={
                    "Content-Disposition": f'attachment; filename="{safe_name}"',
                    "Content-Length": str(len(resp.content)),
                    "Access-Control-Expose-Headers": "Content-Disposition",
                },
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Loi ket noi tai file: {str(e)}")


# â”€â”€ Model cho download folder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class FolderFileItem(BaseModel):
    url: str
    file_name: str


class FolderDownloadRequest(BaseModel):
    folder_name: str
    files: List[FolderFileItem]


@router.post("/download-folder")
async def download_folder(
    body: FolderDownloadRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Tai tat ca file cua folder tu Cloudinary, nen thanh ZIP giu nguyen
    cau truc thu muc roi stream ve cho client.
    BAO MAT: moi URL phai thuoc allow-list Cloudinary (chong SSRF), bat xac thuc TLS.
    """
    if not body.files:
        raise HTTPException(status_code=400, detail="Danh sach file trong")

    # Kiem tra tat ca URL truoc khi tai
    for item in body.files:
        if not _is_allowed_url(unquote(item.url)):
            raise HTTPException(status_code=400, detail="Danh sach file chua URL khong hop le")

    buf = io.BytesIO()

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=120.0) as client:
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for item in body.files:
                    target_url = unquote(item.url)
                    resp = await client.get(target_url)
                    if resp.status_code != 200:
                        print(f"[download-folder] Bo qua file loi: {item.file_name}")
                        continue
                    # Dung duong dan tuong doi goc lam ten entry trong ZIP (chong path traversal)
                    entry_name = item.file_name.replace("\\", "/").lstrip("/")
                    entry_name = entry_name.replace("../", "")
                    zf.writestr(entry_name or _basename(item.file_name), resp.content)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Loi ket noi: {str(e)}")

    buf.seek(0)
    zip_name = _sanitize_filename(f"{body.folder_name}.zip")

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{zip_name}"',
            "Content-Length": str(buf.getbuffer().nbytes),
        },
    )
