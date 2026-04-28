import { safeParseDate } from './dateUtils';

/**
 * Calculate elapsed minutes/hours from a timestamp.
 * Returns a formatted string like "5 phút" or "1 giờ 10 phút".
 */
export const getElapsedString = (timestamp, now = new Date()) => {
    if (!timestamp) return 'Đang xử lý';
    const diffMs = safeParseDate(now).getTime() - safeParseDate(timestamp).getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMins < 60) return `${diffMins} phút`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} giờ ${mins} phút`;
};
