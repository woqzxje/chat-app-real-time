import { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime, formatTimeAgo } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Video, Phone, Send, PanelRight, Image as ImageIcon, Pencil, Trash2, SmilePlus, Check, CheckCheck, PhoneOff, PhoneMissed, MoreVertical, UserPlus, Mic, Square, LogOut, Share2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesText } from './ui/SparklesText';
import { ShinyButton } from './ui/ShinyButton';
import FloatingActionMenu from './ui/floating-action-menu';
import { Paperclip, FolderPlus } from 'lucide-react';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

// ── Hiển thị icon tương ứng với loại file ────────────────────────────────────
const FileIcon = ({ type }) => {
  const icons = {
    image: '🖼️',
    video: '🎬',
    document: '📄',
    archive: '🗜️',
    folder: '📁',
    audio: '🎤',
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
  } catch {
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
          className="max-w-[280px] rounded-2xl cursor-pointer hover:opacity-90 transition-opacity mb-1"
        />
      </a>
    );
  }

  // Nếu là audio → hiển thị audio player
  if (file_type === 'audio') {
    return (
      <div className="bg-white/10 p-2 rounded-2xl mb-1 flex items-center min-w-[240px] max-w-[280px]">
        <audio
          src={url}
          controls
          onLoadedData={onMediaLoad}
          className="w-full h-10 outline-none"
        />
      </div>
    );
  }

  // Nếu là video đơn → hiển thị video player
  if (file_type === 'video') {
    return (
      <video
        src={url}
        controls
        onLoadedData={onMediaLoad}
        className="max-w-[280px] sm:max-w-[320px] rounded-2xl mb-1 outline-none bg-black/20"
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
            className="flex-shrink-0 p-1.5 rounded-lg bg-orange-500/30 hover:bg-orange-500/50 dark:bg-cyan-500/30 dark:hover:bg-cyan-500/50 text-white transition-colors disabled:opacity-40 cursor-pointer"
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
  <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 dark:bg-cyan-500/20 dark:border-cyan-400/30 rounded-2xl px-3 py-2 mb-2">
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

const CallBubble = ({ callInfo, createdAt }) => {
  if (!callInfo) return null;
  const { call_type, duration, is_video } = callInfo;

  const configs = {
    completed: {
      icon: is_video === false ? <Phone className="w-5 h-5" /> : <Video className="w-5 h-5" />,
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      label: is_video === false ? 'Cuộc gọi thoại' : 'Cuộc gọi video',
      detail: formatCallDuration(duration),
      textColor: 'text-emerald-400',
    },
    missed: {
      icon: <PhoneMissed className="w-5 h-5" />,
      bg: 'bg-red-500/15 border-red-500/30',
      label: 'Cuộc gọi nhỡ',
      detail: '',
      textColor: 'text-red-400',
    },
    rejected: {
      icon: <PhoneOff className="w-5 h-5" />,
      bg: 'bg-orange-500/15 border-orange-500/30',
      label: 'Cuộc gọi bị từ chối',
      detail: '',
      textColor: 'text-orange-400',
    },
  };
  const cfg = configs[call_type] || configs.missed;

  return (
    <div className={`flex items-center gap-3 ${cfg.bg} border rounded-2xl px-4 py-3 mx-auto min-w-[220px] max-w-[300px]`}>
      <span className={`flex items-center justify-center p-2 rounded-full ${cfg.bg.split(' ')[0].replace('/15', '/30')} ${cfg.textColor}`}>
        {cfg.icon}
      </span>
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

// ── Component MessageItem (Tin nhắn đơn lẻ) ──────────────────────────────────
const MessageItem = ({ msg, authUser, selectedUser, reactMessage, editMessage, revokeMessage, scrollToBottom, onForward }) => {
  const isOwn = msg.senderId === authUser._id;
  const [showOptions, setShowOptions] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const timerRef = useRef(null);

  // Xử lý sự kiện đè (Long press) trên Mobile
  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      setShowEmojis(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEndOrMove = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div 
      className={`flex items-end gap-3 justify-end group ${!isOwn ? 'flex-row-reverse' : ''}`}
      onMouseLeave={() => {
        if (showOptions) setShowOptions(false);
        if (showEmojis) setShowEmojis(false);
      }}
    >
      {/* ── Action Menu (Emoji & Tùy chọn) ── */}
      {!msg.isDeleted && (
        <div className={`relative flex items-center gap-1 transition-opacity md:opacity-0 group-hover:opacity-100 opacity-100 ${isOwn ? 'mr-1' : 'ml-1 flex-row-reverse'}`}>
          
          {/* Nút thả Emoji (Chỉ hiện trên Desktop / Hover) */}
          <div className="relative group/react hidden md:flex items-center">
            <button title="Thả cảm xúc" className="text-gray-400 hover:text-yellow-400 cursor-pointer p-1">
              <SmilePlus className="w-4 h-4" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 translate-y-2 pb-2 hidden group-hover/react:flex z-50">
              <div className="bg-gray-800 rounded-full px-2 py-1 shadow-lg border border-gray-600 gap-1.5 flex items-center">
                {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                  <button key={emoji} onClick={() => reactMessage(msg._id, emoji)} className="hover:scale-125 transition-transform text-base cursor-pointer">{emoji}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Nút 3 chấm (Chỉ hiện trên Mobile) */}
          {!msg.isDeleted && (
            <div className="relative md:hidden">
              <button 
                onClick={() => setShowOptions(!showOptions)} 
                className="text-gray-400 hover:text-white p-1 cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {/* Dropdown Options */}
              {showOptions && (
                <div className="absolute bottom-full mb-1 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px] animate-in fade-in zoom-in-95 duration-100">
                  {(isOwn && !msg.image && !msg.attachment) && (
                    <button 
                      onClick={() => {
                        setShowOptions(false);
                        const newText = prompt('Chỉnh sửa tin nhắn:', msg.text || '');
                        if (newText !== null && newText.trim() !== '' && newText.trim() !== msg.text) {
                            editMessage(msg._id, newText.trim());
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" /> Chỉnh sửa
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setShowOptions(false);
                      onForward(msg);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-white/10 hover:text-green-300 flex items-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> Chuyển tiếp
                  </button>
                  {isOwn && (
                    <button 
                      onClick={() => {
                        setShowOptions(false);
                        if(window.confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) {
                            revokeMessage(msg._id);
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 hover:text-red-300 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Thu hồi
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nút Chỉnh sửa (Chỉ hiện trên Desktop / Hover) */}
          {isOwn && (!msg.image && !msg.attachment) && (
            <button 
              onClick={() => {
                const newText = prompt('Chỉnh sửa tin nhắn:', msg.text || '');
                if (newText !== null && newText.trim() !== '' && newText.trim() !== msg.text) {
                    editMessage(msg._id, newText.trim());
                }
              }} 
              title="Chỉnh sửa" 
              className="hidden md:block text-gray-400 hover:text-orange-500 dark:hover:text-cyan-400 cursor-pointer p-1"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          {/* Nút Forward (Chỉ hiện trên Desktop / Hover) */}
          {!msg.isDeleted && (
            <button 
              onClick={() => onForward(msg)} 
              title="Chuyển tiếp" 
              className="hidden md:block text-gray-400 hover:text-green-400 cursor-pointer p-1"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          
          {/* Nút Thu hồi (Chỉ hiện trên Desktop / Hover) */}
          {isOwn && (
            <button 
              onClick={() => {
                if(window.confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) {
                    revokeMessage(msg._id);
                }
              }} 
              title="Thu hồi" 
              className="hidden md:block text-gray-400 hover:text-red-400 cursor-pointer p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Nội dung tin nhắn ── */}
      <div 
        className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} relative`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchEndOrMove}
        onTouchEnd={handleTouchEndOrMove}
        onTouchCancel={handleTouchEndOrMove}
      >
        {/* Tên người gửi (chỉ hiển thị cho tin nhắn nhận trong nhóm) */}
        {!isOwn && selectedUser?.isGroup && msg.senderInfo?.fullName && !msg.isSystemMessage && (
          <span className="text-xs text-slate-500 dark:text-gray-400 mb-1 ml-1">{msg.senderInfo.fullName}</span>
        )}
        
        {/* Thanh Emoji nổi lên trên Mobile khi Long Press */}
        {showEmojis && !msg.isDeleted && (
          <div className="absolute bottom-full mb-2 z-50">
            <div className="bg-gray-800 rounded-full px-3 py-2 shadow-2xl border border-gray-600 gap-3 flex items-center animate-in fade-in zoom-in duration-200">
              {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                <button 
                  key={emoji} 
                  onClick={(e) => {
                    e.stopPropagation();
                    reactMessage(msg._id, emoji);
                    setShowEmojis(false);
                  }} 
                  className="hover:scale-125 transition-transform text-2xl cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {/* Overlay ảo để chạm ra ngoài tự đóng Emoji */}
            <div className="fixed inset-0 z-[-1]" onTouchStart={(e) => { e.stopPropagation(); setShowEmojis(false); }} onClick={(e) => { e.stopPropagation(); setShowEmojis(false); }} />
          </div>
        )}
        
        {msg.isDeleted ? (
            <p className="px-4 py-3 text-sm italic text-slate-500 dark:text-gray-500 bg-black/5 dark:bg-white/5 rounded-2xl mb-1 border border-slate-300 dark:border-white/10">Tin nhắn đã bị thu hồi</p>
        ) : (
            <div className="relative">
                {msg.attachment && <AttachmentBubble attachment={msg.attachment} onMediaLoad={scrollToBottom} />}
                {msg.image && (
                  <div className="relative mb-1">
                    <img 
                      src={msg.image} 
                      alt="Sent content" 
                      onLoad={scrollToBottom} 
                      className={`max-w-[320px] rounded-2xl overflow-hidden transition-all duration-300 ${msg.is_nsfw ? 'blur-xl hover:blur-none cursor-pointer' : ''}`} 
                    />
                    {msg.is_nsfw && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none hover:opacity-0 transition-opacity duration-300">
                        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded font-medium">Nhạy cảm</span>
                      </div>
                    )}
                  </div>
                )}
                {msg.text && (
                  <p className={`p-4 max-w-85 text-base font-medium rounded-2xl mb-1 break-all bg-orange-500/30 dark:bg-cyan-500/30 text-slate-900 dark:text-white ${isOwn ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                    {msg.text}
                    {msg.isEdited && <span className="block text-[10px] text-slate-600 dark:text-white/50 text-right mt-1">(Đã chỉnh sửa)</span>}
                  </p>
                )}
                {/* Reactions Bubble */}
                {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`absolute -bottom-2 flex bg-white dark:bg-[#1e293b] rounded-full px-1.5 py-0.5 shadow-md border border-slate-200 dark:border-white/10 gap-1 z-10 text-[10px] ${isOwn ? 'right-2' : 'left-2'}`}>
                        {Object.entries(msg.reactions.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).map(([emoji, count]) => (
                            <span key={emoji} className="flex items-center gap-0.5 cursor-pointer" onClick={() => reactMessage(msg._id, emoji)} title="Bấm để thả/hủy cảm xúc này">
                                {emoji} {count > 1 && <span className="text-slate-700 dark:text-gray-300 font-semibold">{count}</span>}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        )}
        
        {/* Avatars những người đã xem (Nhóm chat) */}
        {isOwn && selectedUser?.isGroup && msg.seenByUsers && msg.seenByUsers.length > 0 && (
            <div className="flex -space-x-1 mt-1 mr-1 justify-end w-full">
                {msg.seenByUsers.map((u, i) => (
                    <img 
                        key={i} 
                        src={u.profilePic || assets.avatar_icon} 
                        onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }}
                        title={`Đã xem bởi ${u.fullName}`} 
                        className="w-4 h-4 rounded-full border border-[#0f172a] object-cover relative z-10 hover:z-20 hover:scale-125 transition-transform" 
                    />
                ))}
            </div>
        )}
      </div>

      {/* ── Avatar và Thời gian ── */}
      <div className="text-center text-xs md:text-sm flex-shrink-0">
        <img
          src={isOwn ? authUser?.profilePic || assets.avatar_icon : (msg.senderInfo?.profilePic || selectedUser?.profilePic || assets.avatar_icon)}
          onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }}
          alt="User"
          title={!isOwn ? msg.senderInfo?.fullName : authUser?.fullName}
          className="rounded-full w-9 h-9 object-cover"
        />
        <div className="flex items-center justify-center gap-1 mt-1">
          <p className="text-gray-400 text-[10px]">{formatMessageTime(msg.createdAt)}</p>
          {isOwn && !selectedUser?.isGroup && (
            msg.seen ? <CheckCheck className="w-3.5 h-3.5 text-orange-500 dark:text-cyan-400" /> : <Check className="w-3 h-3 text-gray-500" />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Component chính ───────────────────────────────────────────────────────────
const ChatContainer = ({ startCall }) => {

  // Lấy dữ liệu tin nhắn, người dùng đang chọn và các hàm xử lý từ ChatContext
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, showRightSidebar, setShowRightSidebar, editMessage, revokeMessage, reactMessage, forwardMessage, users } = useContext(ChatContext);

  // Lấy thông tin người dùng hiện tại và danh sách online từ AuthContext
  const { authUser, onlineUser } = useContext(AuthContext);
  const isBanned = authUser?.banned_until && new Date(authUser.banned_until) > new Date();

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

  // --- Trạng thái và ref cho Ghi âm (Voice Message) ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // --- Các hàm xử lý Ghi âm ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_message_${Date.now()}.webm`, { type: 'audio/webm' });
        
        const fd = new FormData();
        fd.append('file', file);
        uploadFile(fd, '/api/files/upload');
        
        // Cleanup stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Lỗi ghi âm:", err);
      toast.error("Không thể truy cập Micro!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Ghi đè hàm onstop để không upload file khi bị hủy
      mediaRecorderRef.current.onstop = () => {
        const stream = mediaRecorderRef.current.stream;
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
      setRecordingTime(0);
    }
  };

  const formatRecordingTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Gửi lời mời kết bạn (dành cho người lạ)
  const handleAddFriend = async () => {
    try {
      const { data } = await axios.post('/api/auth/send-friend-request', { friendId: selectedUser._id });
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Hàm xử lý gửi tin nhắn văn bản (có thể kèm file đính kèm)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' && !attachment) return; // Không gửi nếu cả hai đều trống

    // Ép cuộn xuống dưới cùng khi chính mình gửi tin nhắn
    setTimeout(scrollToBottom, 50);

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

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.');
      e.target.value = '';
      return;
    }

    setTimeout(scrollToBottom, 50);

    setUploading(true);
    
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1280;
            const MAX_HEIGHT = 1280;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL(file.type || "image/jpeg", 0.8));
          };
          img.onerror = reject;
          img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await sendMessage({ image: dataUrl, is_nsfw: false });
    } catch (err) {
      console.error(err);
      toast.error("Không thể đọc hoặc gửi ảnh");
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input file
    }
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file vượt quá 10MB. Vui lòng chọn file nhỏ hơn.');
      e.target.value = '';
      return;
    }

    // Nếu người dùng chọn ảnh qua nút file → dùng flow ảnh cũ để preview đẹp hơn
    if (file.type.startsWith('image/')) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result;
          await sendMessage({ image: dataUrl, is_nsfw: false });
        } finally {
          setUploading(false);
          e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
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

    const hasLargeFile = files.some(f => f.size > 10 * 1024 * 1024);
    if (hasLargeFile) {
        toast.error('Trong thư mục có chứa file vượt quá 10MB. Vui lòng kiểm tra lại.');
        e.target.value = '';
        return;
    }

    const fd = new FormData();
    // Giữ nguyên đường dẫn tương đối (webkitRelativePath) để zip đúng cấu trúc folder
    files.forEach((f) => fd.append('files', f, f.webkitRelativePath || f.name));

    uploadFile(fd, '/api/files/upload-folder');
    e.target.value = '';
  };

  // Lấy danh sách tin nhắn
  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  // Ref để kiểm tra xem có đang ở cuối danh sách hay không
  const isNearBottomRef = useRef(true);

  const [selectedMessageToForward, setSelectedMessageToForward] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardTargets, setForwardTargets] = useState([]);

  // --- Trạng thái cho tính năng AI Tóm tắt ---
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
      setShowSummaryModal(true);
      setIsSummarizing(true);
      setSummaryData('');
      try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${BACKEND_URL}/api/ai/summarize/${selectedUser._id}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setSummaryData(res.data.summary);
      } catch(err) {
          console.error(err);
          setSummaryData('Có lỗi xảy ra khi yêu cầu AI tóm tắt cuộc trò chuyện. Bạn đã cấu hình API Key chưa?');
      } finally {
          setIsSummarizing(false);
      }
  };

  const handleForwardMessage = async () => {
    if (forwardTargets.length === 0 || !selectedMessageToForward) return;
    const msgData = {
      text: selectedMessageToForward.text,
      image: selectedMessageToForward.image,
      attachment: selectedMessageToForward.attachment,
    };
    await forwardMessage(msgData, forwardTargets);
    setShowForwardModal(false);
    setSelectedMessageToForward(null);
    setForwardTargets([]);
  };

  const onForward = (msg) => {
    setSelectedMessageToForward(msg);
    setShowForwardModal(true);
  };

  // Theo dõi thao tác cuộn để biết người dùng có đang xem tin nhắn cũ không
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Ngưỡng 150px từ đáy được xem là "ở cuối"
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
  };

  // Hàm cuộn xuống cuối danh sách
  const scrollToBottom = () => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' });
    }
    isNearBottomRef.current = true;
  };

  // Tự động cuộn xuống cuối danh sách (Chỉ khi người dùng ĐANG Ở CUỐI)
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Nếu đã chọn người dùng để chat, hiển thị khung chat
  return (
    <AnimatePresence mode="wait">
      {selectedUser ? (
        <motion.div
          key="chat-view"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col flex-1 w-full overflow-hidden relative"
        >

      {/* ------------ Phần tiêu đề Chat (Header) ------------- */}
      <div className="flex items-center gap-4 py-4 mx-5 border-b border-stone-500 shrink-0">
        <img src={selectedUser.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} alt="Avatar" className="w-12 h-12 aspect-square rounded-full object-cover" />
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-xl md:text-2xl text-slate-900 dark:text-white flex items-center gap-3">
            {selectedUser.fullName}
            {/* Hiển thị chấm xanh nếu người dùng này đang online */}
            {onlineUser.includes(selectedUser._id) && (
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            )}
            
            {/* Nút Thêm Bạn (chỉ hiển thị nếu chưa phải là bạn bè) */}
            {!selectedUser.isFriend && (
              <button 
                onClick={handleAddFriend}
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500 border-orange-500/20 dark:bg-cyan-500/10 dark:text-cyan-500 dark:hover:bg-cyan-500 hover:text-white dark:hover:text-white rounded-full transition-colors text-xs font-medium border dark:border-cyan-500/20"
                title="Thêm bạn"
              >
                 <UserPlus className="w-3.5 h-3.5" />
                 <span className="hidden sm:inline">Kết bạn</span>
              </button>
            )}
          </p>
          {/* Last seen time if offline and not group */}
          {!selectedUser.isGroup && !onlineUser.includes(selectedUser._id) && selectedUser.lastSeen && (
            <span className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Truy cập {formatTimeAgo(selectedUser.lastSeen)}</span>
          )}
        </div>
        {/* Nút đóng khung chat trên thiết bị di động */}
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt="Đóng"
          className="md:hidden w-8 cursor-pointer"
        />
        {/* Nút gọi Thoại */}
        <button
          onClick={() => startCall(selectedUser, false)}
          className="text-slate-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-cyan-400 p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          title="Cuộc gọi thoại"
        >
          <Phone className="w-6 h-6" />
        </button>
        {/* Nút gọi Video */}
        <button
          onClick={() => startCall(selectedUser, true)}
          className="text-slate-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-cyan-400 p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          title="Cuộc gọi Video"
        >
          <Video className="w-6 h-6" />
        </button>
        {/* Nút Tóm tắt AI */}
        <button
          onClick={handleSummarize}
          className="text-slate-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          title="Tóm tắt hội thoại bằng AI"
        >
          <Sparkles className="w-6 h-6" />
        </button>
        {/* Nút bật tắt Sidebar Phải */}
        <button
          onClick={() => setShowRightSidebar(prev => !prev)}
          className={`hidden md:flex p-2 rounded-lg transition-colors cursor-pointer ${showRightSidebar ? 'bg-orange-100 text-orange-600 dark:bg-cyan-500/20 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'}`}
          title="Thông tin chi tiết"
        >
          <PanelRight className="w-6 h-6" />
        </button>
      </div>

      {/* ------------ Khu vực hiển thị tin nhắn (Chat Area) ------------- */}
      <div 
        className="flex flex-col flex-1 overflow-y-auto p-4 pb-28 gap-4 min-h-0"
        onScroll={handleScroll}
      >
        {messages.map((msg, index) => (
          // ── Tin nhắn hệ thống (Rời nhóm, ...) ──
          msg.isSystemMessage ? (
            <div key={index} className="flex justify-center my-2">
              <div className="flex items-center gap-3 bg-gray-500/15 border border-gray-500/30 rounded-2xl px-4 py-3 mx-auto min-w-[220px] max-w-[300px]">
                <span className="flex items-center justify-center p-2 rounded-full bg-gray-500/30 text-gray-300">
                  {msg.text.includes('thêm') ? <UserPlus className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-300">{msg.text}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {msg.createdAt && formatMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ) :
          // ── Tin nhắn lịch sử cuộc gọi → hiển thị giữa, không có avatar ──
          msg.callInfo ? (
            <div key={index} className="flex justify-center my-2">
              <CallBubble
                callInfo={msg.callInfo}
                createdAt={msg.createdAt}
              />
            </div>
          ) : (
          // ── Tin nhắn bình thường ──────────────────────────────────────
          <MessageItem
            key={index}
            msg={msg}
            authUser={authUser}
            selectedUser={selectedUser}
            reactMessage={reactMessage}
            editMessage={editMessage}
            revokeMessage={revokeMessage}
            scrollToBottom={scrollToBottom}
            onForward={onForward}
          />
          )
        ))}
        {/* Điểm neo để tự động cuộn xuống */}
        <div ref={scrollEnd} />
      </div>

      {/* ----------- Khu vực nhập tin nhắn ở dưới cùng (Bottom Area) ------------ */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col px-4 pb-4 pt-2 bg-transparent">
        {isBanned ? (
          <div className="flex items-center justify-center p-4 bg-red-500/10 border border-red-500/30 rounded-2xl w-full text-center">
            <p className="text-red-400 font-medium text-sm md:text-base">
              🚫 Bạn đã bị cấm chat đến {new Date(authUser.banned_until).toLocaleString()} do vi phạm quy tắc.
            </p>
          </div>
        ) : (
          <>
            {/* Hiển thị preview file đang chờ gửi — chỉ xuất hiện khi đã chọn file */}
            {attachment && (
              <AttachmentPreview
                attachment={attachment}
                onClear={() => setAttachment(null)}
              />
            )}

            {/* Hàng input chính */}
            <div className="flex items-center gap-4">
              {isRecording ? (
                <div className="flex-1 flex items-center bg-red-500/10 border border-red-500/30 px-5 rounded-full gap-3 h-[52px] animate-in slide-in-from-right-4 duration-300">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 font-medium flex-1">{formatRecordingTime(recordingTime)}</span>
                  <button onClick={cancelRecording} title="Hủy ghi âm" className="text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white p-1.5 transition-colors cursor-pointer">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={stopRecording} title="Gửi ghi âm" className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1.5 transition-colors cursor-pointer ml-1">
                    <Square className="w-5 h-5" fill="currentColor" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center bg-slate-200/50 dark:bg-gray-100/12 px-4 rounded-full gap-2 min-w-0">
                  <input
                    onChange={(e) => setInput(e.target.value)}
                    value={input}
                    onKeyDown={(e) => e.key === 'Enter' ? handleSendMessage(e) : null}
                    type="text"
                    placeholder={attachment ? 'Thêm lời nhắn (tuỳ chọn)...' : 'Nhập tin nhắn...'}
                    className="flex-1 text-base p-4 border-none rounded-full outline-none text-slate-900 placeholder-slate-500 dark:text-white dark:placeholder-gray-400 bg-transparent min-w-0"
                  />

                  {/* Nút ghi âm */}
                  <button
                    onClick={startRecording}
                    title="Ghi âm"
                    disabled={uploading}
                    className="cursor-pointer text-slate-500 hover:text-orange-500 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors disabled:opacity-40 mr-2 flex items-center"
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  {/* Các input file ẩn */}
                  <input onChange={handleSendImage} type="file" id="image" accept="image/png, image/jpeg" hidden />
                  <input ref={fileRef} type="file" hidden onChange={handleFileChange} />
                  <input ref={folderRef} type="file" hidden webkitdirectory="true" multiple onChange={handleFolderChange} />

                  {/* Tích hợp FloatingActionMenu thay cho 3 nút cũ */}
                  <FloatingActionMenu
                    disabled={uploading}
                    className="mr-1"
                    options={[
                      {
                        label: "Hình ảnh",
                        Icon: <ImageIcon className="w-4 h-4" />,
                        onClick: () => document.getElementById('image').click(),
                      },
                      {
                        label: "Tệp tin",
                        Icon: <Paperclip className="w-4 h-4" />,
                        onClick: () => fileRef.current.click(),
                      },
                      {
                        label: "Thư mục",
                        Icon: <FolderPlus className="w-4 h-4" />,
                        onClick: () => folderRef.current.click(),
                      }
                    ]}
                  />
                </div>
              )}

              {/* Nút gửi tin nhắn — hiện spinner khi đang upload file */}
              {uploading ? (
                <div className="w-9 h-9 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-500 dark:text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
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
          </>
        )}
      </div>

        </motion.div>
      ) : (
        /* Hiển thị màn hình chờ khi chưa chọn ai để chat */
        <motion.div
          key="empty-state"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="w-full flex-1 flex flex-col items-center justify-center gap-4 text-gray-500 bg-white/5 max-md:hidden"
        >
          <SparklesText text={<>
            <span className="transition-all duration-700 ease-in-out bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-700 dark:from-white dark:to-gray-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">Chat</span>
            <span className="transition-all duration-700 ease-in-out bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500 dark:from-cyan-400 dark:to-blue-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)] dark:drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">ITC</span>
          </>} className="text-5xl" sparklesCount={7} />
          <p className="text-lg font-medium text-white bg-red-500 px-4 py-1.5 shadow-lg">Chat mọi lúc, mọi nơi</p>
        </motion.div>
      )}
      {/* ── Forward Modal ── */}
      <AnimatePresence>
        {showForwardModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { e.stopPropagation(); setShowForwardModal(false); setSelectedMessageToForward(null); setForwardTargets([]); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <h2 className="text-xl font-bold text-white mb-4">Chuyển tiếp tin nhắn</h2>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 flex flex-col gap-2 pr-2">
                {users.map(u => (
                  <div 
                    key={u._id} 
                    onClick={() => setForwardTargets(prev => prev.includes(u._id) ? prev.filter(id => id !== u._id) : [...prev, u._id])}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${forwardTargets.includes(u._id) ? 'bg-orange-500/20 border border-orange-500/50 dark:bg-cyan-500/20 dark:border-cyan-500/50' : 'bg-[#0f172a] border border-[#334155] hover:border-orange-500/50 dark:hover:border-cyan-500/50'}`}
                  >
                    <img src={u.profilePic || assets.avatar_icon} onError={(e) => { e.target.onerror = null; e.target.src = assets.avatar_icon; }} className="w-10 h-10 rounded-full object-cover" />
                    <span className="flex-1 text-sm font-medium text-white">{u.fullName}</span>
                    {forwardTargets.includes(u._id) && <Check className="w-5 h-5 text-orange-500 dark:text-cyan-400" />}
                  </div>
                ))}
                {users.length === 0 && <p className="text-center text-gray-400 py-4">Không có người dùng nào để chuyển tiếp.</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#334155]">
                <button 
                  onClick={() => {
                    setShowForwardModal(false);
                    setSelectedMessageToForward(null);
                    setForwardTargets([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-white/5"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleForwardMessage}
                  disabled={forwardTargets.length === 0}
                  className="px-6 py-2 bg-orange-500 dark:bg-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-orange-500/30 dark:shadow-cyan-500/30 hover:bg-orange-400 dark:hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Gửi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── AI Summary Modal ── */}
      <AnimatePresence>
        {showSummaryModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowSummaryModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155] rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-purple-500" /> AI Tóm tắt hội thoại
                  </h2>
                  <button onClick={() => setShowSummaryModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-[#0f172a] rounded-xl p-5 border border-gray-100 dark:border-white/5">
                  {isSummarizing ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4 text-purple-500">
                          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <p className="font-medium animate-pulse">AI đang đọc và phân tích tin nhắn...</p>
                      </div>
                  ) : (
                      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-[15px] leading-relaxed">
                          {summaryData}
                      </div>
                  )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default ChatContainer;