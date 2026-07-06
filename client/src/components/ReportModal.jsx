import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export const ReportModal = ({ open, onOpenChange, message, authUser }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !message) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do báo cáo');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/reports', {
        reporterId: authUser._id,
        reportedId: message.senderId,
        messageId: message._id,
        reason: reason.trim()
      });
      
      toast.success('Đã gửi báo cáo thành công');
      setReason('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Lỗi khi gửi báo cáo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-yellow-500 w-6 h-6" />
            Báo cáo tin nhắn
          </h3>
          <button 
            onClick={() => onOpenChange(false)} 
            className="text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nội dung bị báo cáo:</p>
          <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 text-sm text-slate-600 dark:text-slate-400 italic max-h-24 overflow-y-auto">
            {message.text ? `"${message.text}"` : '[Hình ảnh/Tệp đính kèm/Ghi âm]'}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Lý do báo cáo:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Mô tả lý do bạn báo cáo tin nhắn này..."
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-black/30 text-slate-900 dark:text-white focus:outline-none focus:border-yellow-500 dark:focus:border-yellow-400 min-h-[100px] resize-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl font-medium bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Gửi Báo Cáo
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
