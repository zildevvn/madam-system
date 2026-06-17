export const normalizeString = (str) => {
    if (!str) return '';
    return str
        .normalize('NFD') // Decompose combined characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd') // Replace specific Vietnamese characters
        .replace(/Đ/g, 'D')
        .toLowerCase();
};
