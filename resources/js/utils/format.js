/**
 * Format a number as Vietnamese Dong currency string.
 */
export const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
};
