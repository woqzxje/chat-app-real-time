export function formatMessageTime(date) {
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    })
}

// Simple cn utility — merges class names (falsy values are filtered out)
export function cn(...classes) {
    return classes.filter(Boolean).join(' ')
}