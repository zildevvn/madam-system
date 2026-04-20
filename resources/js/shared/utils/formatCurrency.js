/**
 * Format a number as Vietnamese Dong currency string.
 */
export const formatPrice = (price) => {
    if (price === undefined || price === null || price === '') return '';
    const num = Number(price);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US').format(num);
};

export const formatCurrency = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return '0 VND';
    return new Intl.NumberFormat('en-US').format(num) + ' VND';
};

export const capitalizeWords = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
