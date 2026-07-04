import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(date) {
    // Đảm bảo chuỗi ngày tháng được coi là giờ UTC (do backend trả về datetime naive)
    let dateStr = date;
    if (typeof dateStr === 'string') {
        // Cắt bỏ phần microsecond (nếu có) để tránh lỗi parse Date trên một số trình duyệt
        if (dateStr.includes('.')) {
            dateStr = dateStr.split('.')[0];
        }
        if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
            dateStr += 'Z';
        }
    }
    return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  let dateStr = dateString;
  if (typeof dateStr === 'string' && dateStr.includes('.') && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr = dateStr.split('.')[0] + 'Z';
  } else if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr += 'Z';
  }
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `vài giây trước`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} tuần trước`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
}