/**
 * Safe date formatting utilities to prevent "Invalid Date" errors
 */

export function formatDate(dateValue, options = {}) {
    if (!dateValue) {
        return 'N/A';
    }
    
    // Handle different date formats
    let date;
    if (dateValue instanceof Date) {
        date = dateValue;
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        date = new Date(dateValue);
    } else {
        return 'N/A';
    }
    
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

export function formatTime(dateValue, options = {}) {
    if (!dateValue) return 'N/A';
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    
    const defaultOptions = {
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleTimeString('en-US', { ...defaultOptions, ...options });
}

export function formatDateTime(dateValue) {
    if (!dateValue) return 'N/A';
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return `${formatDate(dateValue)} at ${formatTime(dateValue)}`;
}

export function isValidDate(dateValue) {
    if (!dateValue) return false;
    const date = new Date(dateValue);
    return !isNaN(date.getTime());
}
