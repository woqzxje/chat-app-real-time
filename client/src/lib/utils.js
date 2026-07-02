export function formatMessageTime(date) {
    // Đảm bảo chuỗi ngày tháng được coi là giờ UTC (do backend trả về datetime naive)
    let dateStr = date;
    if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
        dateStr += 'Z';
    }
    return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}