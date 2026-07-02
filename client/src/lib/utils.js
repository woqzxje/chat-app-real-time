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