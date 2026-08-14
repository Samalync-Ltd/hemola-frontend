export const formatPrice = (amount) => {
    return new Intl.NumberFormat('ar-SA').format(amount) + ' ر.س';
};
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};
export const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);
};
