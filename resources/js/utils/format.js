/**
 * Format a number as Vietnamese Dong currency string.
 */
export const formatPrice = (price) => {
    if (price === undefined || price === null || price === '') return '';
    return new Intl.NumberFormat('vi-VN').format(price);
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const capitalizeWords = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
