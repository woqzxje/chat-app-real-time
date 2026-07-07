import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmModal — Modal xác nhận tùy chỉnh thay thế window.confirm()
 * 
 * Props:
 *   open       : boolean — hiện/ẩn modal
 *   title      : string  — tiêu đề (mặc định: "Xác nhận")
 *   message    : string  — nội dung câu hỏi
 *   confirmText: string  — nội dung nút xác nhận (mặc định: "Xác nhận")
 *   cancelText : string  — nội dung nút hủy (mặc định: "Hủy")
 *   variant    : "danger" | "warning" | "info" — kiểu màu (mặc định: "danger")
 *   onConfirm  : () => void
 *   onCancel   : () => void
 */
const ConfirmModal = ({
  open,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Focus vào nút xác nhận khi modal mở
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const variants = {
    danger: {
      icon: 'bg-red-500/20 text-red-400',
      confirmBtn: 'bg-red-500 hover:bg-red-600 shadow-red-500/25',
    },
    warning: {
      icon: 'bg-yellow-500/20 text-yellow-400',
      confirmBtn: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/25',
    },
    info: {
      icon: 'bg-blue-500/20 text-blue-400',
      confirmBtn: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25',
    },
  };

  const v = variants[variant] || variants.danger;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-2">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${v.icon} flex-shrink-0`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`px-5 py-2.5 text-sm font-medium rounded-xl text-white shadow-lg transition-all cursor-pointer ${v.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
