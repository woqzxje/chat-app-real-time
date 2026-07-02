import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Video, Send, PanelRight, Image as ImageIcon, Pencil, Trash2, SmilePlus, Check, CheckCheck } from 'lucide-react';
import FlickerSpinner from './ui/FlickerSpinner';
import { ShinyButton } from './ui/ShinyButton';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

// ── Hiển thị icon tương ứng với loại file ────────────────────────────────────
const FileIcon = ({ type }) => {
  const icons = {
    image: '🖼️',
    video: '🎬',
    document: '📄',
    archive: '🗜️',
    folder: '📁',
    other: '📎',
  };
  return <span className="text-xl leading-none">{icons[type] || icons.other}</span>;
};

// Định dạng kích thước file sang B / KB / MB cho dễ đọc
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Hàm tải file qua proxy backend hoặc trực tiếp (dùng chung) ────────────────
const proxyDownload = async (fileUrl, fileName) => {
  const toastId = toast.loading('Đang xử lý tải xuống...');
  
  try {
    // 1. Dùng CORS Proxy để tải file ở Client (Mượt nhất, vượt CORS, không cần backend)
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fileUrl)}`;
    const directRes = await fetch(corsProxyUrl);
    
    if (directRes.ok) {
      const blob = await directRes.blob();
      const forceBlob = new Blob([blob], { type: 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(forceBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success('Tải xuống thành công!', { id: toastId });
      return;
    }
  } catch (e) {
    // Nếu proxy chết, tiếp tục thử qua Backend của mình
  }

  try {
    // 2. Dùng Backend Proxy (Backend tải file rồi stream cho Frontend)
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ url: fileUrl, name: fileName });
    const res = await fetch(`${BACKEND_URL}/api/files/download?${params}`, {
      headers: { token },
    });
    
    if (!res.ok) {
       throw new Error(`Lỗi máy chủ (${res.status})`);
    }
    
    const blob = await res.blob();
    const forceBlob = new Blob([blob], { type: 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(forceBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    toast.success('Tải xuống thành công!', { id: toastId });
    
  } catch (err) {
    toast.error(`Không thể tải file: ${err.message}`, { id: toastId, duration: 4000 });
    
    // 3. Chấp nhận mở tab mới (vì không ép tải được)
    let dlUrl = fileUrl;
    if (fileUrl.includes('/image/upload/') || fileUrl.includes('/video/upload/')) {
      dlUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
    }
    
    toast('Đang mở file trên trình duyệt...', { id: toastId, icon: '📄' });
    setTimeout(() => {
      window.open(dlUrl, '_blank');
    }, 1500);
  }
};
// ── Hàm tải toàn bộ folder (backend nén zip → tải thẳng về Downloads) ────────
const downloadFolder = async (folderName, files) => {
  if (!files || files.length === 0) {
    toast.error('Không có file nào trong folder!');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_URL}/api/files/download-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token },
      body: JSON.stringify({
        folder_name: folderName,
        files: files.map((f) => ({ url: f.url, file_name: f.file_name })),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rawBlob = await res.blob();
    const zipBlob = new Blob([rawBlob], { type: 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    console.error('Download folder error:', err);
    toast.error('Tải folder thất bại, vui lòng thử lại!');
  }
};

// ── Lấy tên file ngắn từ đường dẫn ──────────────────────────────────────────
const basename = (path) => path?.replace(/\\/g, '/').split('/').pop() || path;

// ── Hiển thị file đính kèm bên trong bubble tin nhắn ─────────────────────────
const AttachmentBubble = ({ attachment, onMediaLoad }) => {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  if (!attachment) return null;
  const { url, file_name, file_type, file_size, file_count, files } = attachment;

  const handleDownloadAll = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadFolder(file_name, files);
    } finally {
      setDownloading(false);
    }
  };

  // Nếu là ảnh đơn → hiển thị preview
  if (file_type === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt={file_name}
          onLoad={onMediaLoad}
          className="max-w-[280px] rounded-2xl border border-white/10 cursor-pointer hover:opacity-90 transition-opacity mb-1"
        />
      </a>
    );
  }

  // Nếu là video đơn → hiển thị video player
  if (file_type === 'video') {
    return (
      <video
        src={url}
        controls
        onLoadedData={onMediaLoad}
        className="max-w-[280px] sm:max-w-[320px] rounded-2xl border border-white/10 mb-1 outline-none bg-black/20"
      />
    );
  }

  // ── Nếu là FOLDER → hiển thị danh sách file mở rộng ────────────────────────
  if (file_type === 'folder' && files && files.length > 0) {

    return (
      <div className="bg-white/10 rounded-2xl mb-1 min-w-[220px] max-w-[320px] overflow-hidden">
        {/* Header folder — click để mở rộng */}
        <div className="flex items-center gap-3 w-full px-4 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-3 flex-1 min-w-0 hover:bg-white/5 transition-colors cursor-pointer text-left"
          >
            <span className="text-xl">📁</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{file_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatFileSize(file_size)} · {file_count || files.length} file
              </p>
            </div>
            {/* Mũi tên expand/collapse */}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Nút tải toàn bộ folder */}
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            title="Tải toàn bộ folder"
            className="flex-shrink-0 p-1.5 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/50 text-white transition-colors disabled:opacity-40 cursor-pointer"
          >
            {downloading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
        </div>

        {/* Danh sách file bên trong */}
        {expanded && (
          <div className="border-t border-white/10 max-h-[200px] overflow-y-auto">
            {files.map((f, i) => (
              <button
                key={i}
                onClick={() => proxyDownload(f.url, basename(f.file_name))}
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-white/10 transition-colors cursor-pointer text-left"
              >
                <FileIcon type={f.file_type} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate" title={f.file_name}>
                    {basename(f.file_name)}
                  </p>
                  <p className="text-[10px] text-gray-500">{formatFileSize(f.file_size)}</p>
                </div>
                <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── File đơn (document, archive, video...) → card tải xuống ─────────────────
  return (
    <button
      onClick={() => proxyDownload(url, file_name)}
      className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl px-4 py-3 mb-1 min-w-[200px] max-w-[280px] cursor-pointer text-left"
    >
      <FileIcon type={file_type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{file_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatFileSize(file_size)}
          {file_count && ` · ${file_count} file`}
        </p>
      </div>
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </button>
  );
};

// ── Hiển thị preview file đang chờ gửi (phía trên ô nhập) ───────────────────
const AttachmentPreview = ({ attachment, onClear }) => (
  <div className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-400/30 rounded-2xl px-3 py-2 mb-2">
    <FileIcon type={attachment.file_type} />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-white truncate">{attachment.file_name}</p>
      <p className="text-xs text-gray-400">{formatFileSize(attachment.file_size)}</p>
    </div>
    {/* Nút xoá file đính kèm trước khi gửi */}
    <button
      onClick={onClear}
      className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-1"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

// ── Hiển thị lịch sử cuộc gọi trong chat ────────────────────────────────────
const formatCallDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const CallBubble = ({ callInfo, isSender, createdAt }) => {
  if (!callInfo) return null;
  const { call_type, duration } = callInfo;

  const configs = {
    completed: {
      icon: '📞',
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      label: 'Cuộc gọi video',
      detail: formatCallDuration(duration),
      textColor: 'text-emerald-400',
    },
    missed: {
      icon: '📵',
      bg: 'bg-red-500/15 border-red-500/30',
      label: 'Cuộc gọi nhỡ',
      detail: '',
      textColor: 'text-red-400',
    },
    rejected: {
      icon: '🚫',
      bg: 'bg-orange-500/15 border-orange-500/30',
      label: 'Cuộc gọi bị từ chối',
      detail: '',
      textColor: 'text-orange-400',
    },
  };
  const cfg = configs[call_type] || configs.missed;

  return (
    <div className={`flex items-center gap-3 ${cfg.bg} border rounded-2xl px-4 py-3 mx-auto min-w-[220px] max-w-[300px]`}>
      <span className="text-2xl">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${cfg.textColor}`}>{cfg.label}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {cfg.detail && <span className="mr-2">{cfg.detail}</span>}
          {createdAt && formatMessageTime(createdAt)}
        </p>
      </div>
    </div>
  );
};

// ── Component chính ───────────────────────────────────────────────────────────
const ChatContainer = ({ startCall }) => {

  // Lấy dữ liệu tin nhắn, người dùng đang chọn và các hàm xử lý từ ChatContext
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, showRightSidebar, setShowRightSidebar, editMessage, revokeMessage, reactMessage } = useContext(ChatContext);

  // Lấy thông tin người dùng hiện tại và danh sách online từ AuthContext
  const { authUser, onlineUser } = useContext(AuthContext);

  // Tham chiếu đến phần tử cuối cùng của danh sách tin nhắn để tự động cuộn xuống
  const scrollEnd = useRef();

  // Tham chiếu đến input ẩn cho file đơn và folder
  const fileRef = useRef();
  const folderRef = useRef();

  // Trạng thái lưu trữ văn bản tin nhắn đang nhập
  const [input, setInput] = useState('');

  // Trạng thái lưu thông tin file đính kèm sau khi đã upload lên Cloudinary
  // Cấu trúc: { url, file_name, file_type, file_size, resource_type, file_count? }
  const [attachment, setAttachment] = useState(null);

  // Trạng thái theo dõi quá trình upload file lên server
  const [uploading, setUploading] = useState(false);

  // Hàm xử lý gửi tin nhắn văn bản (có thể kèm file đính kèm)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' && !attachment) return; // Không gửi nếu cả hai đều trống

    await sendMessage({
      text: input.trim() || null,
      attachment: attachment || null,
    });

    setInput('');
    setAttachment(null); // Xoá file đính kèm sau khi gửi
  };

  // Hàm xử lý gửi tin nhắn hình ảnh (giữ nguyên logic gốc — base64 → Cloudinary)
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn một file hình ảnh hợp lệ');
      return;
    }

    // Đọc file ảnh dưới dạng base64 để gửi lên server
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = ''; // Reset input file
    };
    reader.readAsDataURL(file);
  };

  // Hàm dùng chung để upload file/folder lên backend rồi lưu kết quả vào state
  const uploadFile = async (formData, endpoint = '/api/files/upload') => {
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${BACKEND_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setAttachment(res.data); // Lưu thông tin file đã upload để gửi kèm tin nhắn
      toast.success('Đã đính kèm file!');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Upload thất bại, thử lại nhé!');
    } finally {
      setUploading(false);
    }
  };

  // Hàm xử lý khi người dùng chọn một file đơn
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Nếu người dùng chọn ảnh qua nút file → dùng flow ảnh cũ để preview đẹp hơn
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await sendMessage({ image: reader.result });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
      return;
    }

    // Các loại file khác → upload lên Cloudinary qua backend
    const fd = new FormData();
    fd.append('file', file);
    uploadFile(fd, '/api/files/upload');
    e.target.value = '';
  };

  // Hàm xử lý khi người dùng chọn một folder
  // Từng file trong folder sẽ được upload riêng lẻ lên Cloudinary
  const handleFolderChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const fd = new FormData();
    // Giữ nguyên đường dẫn tương đối (webkitRelativePath) để zip đúng cấu trúc folder
    files.forEach((f) => fd.append('files', f, f.webkitRelativePath || f.name));

    uploadFile(fd, '/api/files/upload-folder');
    e.target.value = '';
  };

  // Tải lịch sử tin nhắn mỗi khi người dùng đang chat cùng (selectedUser) thay đổi
  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
  }, [selectedUser]);

  // Hàm cuộn xuống cuối danh sách
  const scrollToBottom = () => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Tự động cuộn xuống cuối danh sách mỗi khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Nếu đã chọn người dùng để chat, hiển thị khung chat
  return selectedUser ? (
    <div className="flex flex-col h-full overflow-hidden relative">

      {/* ------------ Phần tiêu đề Chat (Header) ------------- */}
      <div className="flex items-center gap-4 py-4 mx-5 border-b border-stone-500">
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="Avatar" className="w-12 rounded-full" />
        <p className="flex-1 text-xl md:text-2xl text-white flex items-center gap-3">
          {selectedUser.fullName}
          {/* Hiển thị chấm xanh nếu người dùng này đang online */}
          {onlineUser.includes(selectedUser._id) && (
            <span className="w-3 h-3 rounded-full bg-green-500" />
          )}
        </p>
        {/* Nút đóng khung chat trên thiết bị di động */}
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt="Đóng"
          className="md:hidden w-8 cursor-pointer"
        />
        {/* Nút gọi Video */}
        <button
          onClick={() => startCall(selectedUser)}
          className="text-gray-400 hover:text-cyan-400 p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          title="Cuộc gọi Video"
        >
          <Video className="w-6 h-6" />
        </button>
        {/* Nút bật tắt Sidebar Phải */}
        <button
          onClick={() => setShowRightSidebar(prev => !prev)}
          className={`hidden md:flex p-2 rounded-lg transition-colors cursor-pointer ${showRightSidebar ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          title="Thông tin chi tiết"
        >
          <PanelRight className="w-6 h-6" />
        </button>
      </div>

      {/* ------------ Khu vực hiển thị tin nhắn (Chat Area) ------------- */}
      <div className="flex flex-col flex-1 overflow-y-auto p-4 pb-28 gap-4 min-h-0">
        {messages.map((msg, index) => (
          // ── Tin nhắn lịch sử cuộc gọi → hiển thị giữa, không có avatar ──
          msg.callInfo ? (
            <div key={index} className="flex justify-center my-2">
              <CallBubble
                callInfo={msg.callInfo}
                isSender={msg.senderId === authUser._id}
                createdAt={msg.createdAt}
              />
            </div>
          ) : (
          // ── Tin nhắn bình thường ──────────────────────────────────────
          <div
            key={index}
            className={`flex items-end gap-3 justify-end group ${msg.senderId !== authUser._id ? 'flex-row-reverse' : ''}`}
          >
            {/* Action Menu */}
            {!msg.isDeleted && (
               <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center mb-3 ${msg.senderId === authUser._id ? 'mr-1' : 'ml-1 flex-row-reverse'}`}>
                  
                  {/* Menu thả cảm xúc */}
                  <div className="relative group/react flex items-center">
                      <button title="Thả cảm xúc" className="text-gray-400 hover:text-yellow-400 cursor-pointer"><SmilePlus className="w-4 h-4" /></button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-2 pb-4 hidden group-hover/react:flex z-50">
                          <div className="bg-gray-800 rounded-full px-2 py-1 shadow-lg border border-gray-600 gap-1.5 flex items-center">
                              {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                                  <button key={emoji} onClick={() => reactMessage(msg._id, emoji)} className="hover:scale-125 transition-transform text-base cursor-pointer">{emoji}</button>
                              ))}
                          </div>
                      </div>
                  </div>

                  {msg.senderId === authUser._id && (!msg.image && !msg.attachment) && (
                      <button onClick={() => {
                          const newText = prompt('Chỉnh sửa tin nhắn:', msg.text || '');
                          if (newText !== null && newText.trim() !== '' && newText.trim() !== msg.text) {
                              editMessage(msg._id, newText.trim());
                          }
                      }} title="Chỉnh sửa" className="text-gray-400 hover:text-cyan-400 cursor-pointer"><Pencil className="w-4 h-4" /></button>
                  )}
                  
                  {msg.senderId === authUser._id && (
                      <button onClick={() => {
                          if(window.confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) {
                              revokeMessage(msg._id);
                          }
                      }} title="Thu hồi" className="text-gray-400 hover:text-red-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  )}
               </div>
            )}

            {/* Nội dung tin nhắn — bao gồm file đính kèm, ảnh và văn bản */}
            <div className={`flex flex-col ${msg.senderId === authUser._id ? 'items-end' : 'items-start'}`}>
              {msg.isDeleted ? (
                  <p className="px-4 py-3 text-sm italic text-gray-500 bg-white/5 rounded-2xl mb-1 border border-white/10">Tin nhắn đã bị thu hồi</p>
              ) : (
                  <div className="relative">
                      {/* Hiển thị file/folder đính kèm nếu có */}
                      {msg.attachment && <AttachmentBubble attachment={msg.attachment} onMediaLoad={scrollToBottom} />}

                      {/* Hiển thị ảnh nếu tin nhắn có ảnh (flow gốc) */}
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Sent content"
                          onLoad={scrollToBottom}
                          className="max-w-[320px] border border-gray-700 rounded-2xl overflow-hidden mb-1"
                        />
                      )}

                      {/* Hiển thị văn bản tin nhắn */}
                      {msg.text && (
                        <p className={`p-4 max-w-85 text-base font-medium rounded-2xl mb-1 break-all bg-cyan-500/30 text-white ${msg.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                          {msg.text}
                          {msg.isEdited && <span className="block text-[10px] text-white/50 text-right mt-1">(Đã chỉnh sửa)</span>}
                        </p>
                      )}
                      
                      {/* Hiển thị cảm xúc */}
                      {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`absolute -bottom-2 flex bg-[#1e293b] rounded-full px-1.5 py-0.5 shadow-md border border-white/10 gap-1 z-10 text-[10px] ${msg.senderId === authUser._id ? 'right-2' : 'left-2'}`}>
                              {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).map(([emoji, count]) => (
                                  <span key={emoji} className="flex items-center gap-0.5 cursor-pointer" onClick={() => reactMessage(msg._id, emoji)} title="Bấm để thả/hủy cảm xúc này">
                                      {emoji} {count > 1 && <span className="text-gray-300 font-semibold">{count}</span>}
                                  </span>
                              ))}
                          </div>
                      )}
                  </div>
              )}
            </div>

            {/* Hiển thị ảnh đại diện nhỏ và thời gian gửi */}
            <div className="text-center text-xs md:text-sm flex-shrink-0">
              <img
                src={msg.senderId === authUser._id
                  ? authUser?.profilePic || assets.avatar_icon
                  : selectedUser?.profilePic || assets.avatar_icon}
                alt="User"
                className="rounded-full w-9"
              />
              <div className="flex items-center justify-center gap-1 mt-1">
                <p className="text-gray-400 text-[10px]">{formatMessageTime(msg.createdAt)}</p>
                {msg.senderId === authUser._id && (
                  msg.seen ? (
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Check className="w-3 h-3 text-gray-500" />
                  )
                )}
              </div>
            </div>
          </div>
          )
        ))}
        {/* Điểm neo để tự động cuộn xuống */}
        <div ref={scrollEnd} />
      </div>

      {/* ----------- Khu vực nhập tin nhắn ở dưới cùng (Bottom Area) ------------ */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col px-4 pb-4 pt-2 bg-[#0b0b17]/70">

        {/* Hiển thị preview file đang chờ gửi — chỉ xuất hiện khi đã chọn file */}
        {attachment && (
          <AttachmentPreview
            attachment={attachment}
            onClear={() => setAttachment(null)}
          />
        )}

        {/* Hàng input chính */}
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center bg-gray-100/12 px-4 rounded-full gap-2">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={(e) => e.key === 'Enter' ? handleSendMessage(e) : null}
              type="text"
              placeholder={attachment ? 'Thêm lời nhắn (tuỳ chọn)...' : 'Nhập tin nhắn...'}
              className="flex-1 text-base p-4 border-none rounded-full outline-none text-white placeholder-gray-400 bg-transparent"
            />

            {/* Nút chọn và gửi ảnh */}
            <input onChange={handleSendImage} type="file" id="image" accept="image/png, image/jpeg" hidden />
            <label htmlFor="image" title="Gửi ảnh" className="cursor-pointer text-gray-400 hover:text-white transition-colors mr-3 flex items-center">
              <ImageIcon className="w-5 h-5" />
            </label>

            {/* Nút đính kèm file (pdf, docx, zip...) */}
            <input ref={fileRef} type="file" hidden onChange={handleFileChange} />
            <button
              onClick={() => fileRef.current.click()}
              title="Gửi file"
              disabled={uploading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-40 mr-1"
            >
              {/* Icon paperclip — biểu tượng đính kèm file */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Nút đính kèm folder — toàn bộ folder sẽ được zip lại trước khi gửi */}
            <input ref={folderRef} type="file" hidden webkitdirectory="true" multiple onChange={handleFolderChange} />
            <button
              onClick={() => folderRef.current.click()}
              title="Gửi folder"
              disabled={uploading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-40 mr-2"
            >
              {/* Icon folder */}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </button>
          </div>

          {/* Nút gửi tin nhắn — hiện spinner khi đang upload file */}
          {uploading ? (
            <div className="w-9 h-9 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <ShinyButton
              onClick={handleSendMessage}
              className="w-10 h-10 shrink-0"
            >
              <Send className="w-[18px] h-[18px] -ml-[2px] mt-[1px]" />
            </ShinyButton>
          )}
        </div>
      </div>

    </div>
  ) : (
    /* Hiển thị màn hình chờ khi chưa chọn ai để chat */
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-500 bg-white/5 max-md:hidden">
      <FlickerSpinner size={64} />
      <p className="text-lg font-medium text-white">Chat mọi lúc, mọi nơi</p>
    </div>
  );
};

export default ChatContainer;