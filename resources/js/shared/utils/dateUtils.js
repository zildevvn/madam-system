import dayjs from 'dayjs';
import { parseISO } from 'date-fns';

// [WHY] Centralized date/time handling to ensure all date processing, parsing, comparisons,
// and formatting are strictly timezone-safe and follow a single source of truth.

/**
 * Robustly parses a date input (Date object or string) into a Date object.
 * Handles Laravel's default datetime format and ensures UTC assumption if no offset is present.
 */
export const safeParseDate = (dateVal) => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    
    // Ensure standard ISO format (YYYY-MM-DDTHH:mm:ssZ)
    let str = dateVal.toString().trim().replace(' ', 'T');
    
    // Check if it already has an offset or Z
    const hasOffset = str.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(str);
    
    if (!hasOffset) {
        str += 'Z'; // Assume UTC for API strings without offset
    }
    
    const parsed = parseISO(str);
    
    // Fallback to native Date if parseISO fails
    return isNaN(parsed.getTime()) ? new Date(dateVal) : parsed;
};

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in local timezone.
 */
export const getTodayDateString = () => {
    return dayjs().format('YYYY-MM-DD');
};

/**
 * Normalizes any date (Date object, string, timestamp) to 'YYYY-MM-DD'.
 */
export const formatToLocalDateStr = (date) => {
    if (!date) return '';
    return dayjs(date).format('YYYY-MM-DD');
};

/**
 * Checks if a given date string ('YYYY-MM-DD') is in the past (before today).
 */
export const isPastDate = (dateStr) => {
    const todayStr = getTodayDateString();
    return dateStr < todayStr;
};

/**
 * Checks if a given date string ('YYYY-MM-DD') falls inclusively between startStr and endStr.
 */
export const isDateInRange = (dateStr, startStr, endStr) => {
    const d = dayjs(dateStr).startOf('day');
    const start = dayjs(startStr).startOf('day');
    const end = dayjs(endStr).startOf('day');
    return (d.isSame(start) || d.isAfter(start)) && 
           (d.isSame(end) || d.isBefore(end));
};

/**
 * Formats a date cleanly to Vietnamese visual standard: 'DD/MM/YYYY'.
 */
export const formatDateToVietnamese = (date) => {
    if (!date) return 'Chưa cập nhật';
    return dayjs(date).format('DD/MM/YYYY');
};

/**
 * Formats a date to Month/Year heading, e.g., '05/2026'.
 */
export const getMonthYearHeading = (date) => {
    return dayjs(date).format('MM/YYYY');
};

/**
 * Generates all Date objects for a given month.
 */
export const getMonthDatesList = (dateInput = new Date()) => {
    const startOfMonth = dayjs(dateInput).startOf('month');
    const daysInMonth = startOfMonth.daysInMonth();
    const dates = [];
    for (let i = 0; i < daysInMonth; i++) {
        dates.push(startOfMonth.add(i, 'day').toDate());
    }
    return dates;
};

/**
 * Computes prepended weekday padding (0-indexed where Monday=0, Sunday=6)
 * for aligning the 1st of the month in the calendar grid correctly.
 */
export const getMonthWeekdayPadding = (dateInput = new Date()) => {
    const firstDay = dayjs(dateInput).startOf('month');
    const dayOfWeek = firstDay.day(); // 0 is Sunday, 1 is Monday, etc.
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
};

/**
 * Formats a datetime string/object strictly into the Asia/Ho_Chi_Minh system timezone.
 * Returns: 'HH:mm:ss DD/MM/YYYY'
 */
export const formatDateTimeToSystemTimezone = (dateVal) => {
    if (!dateVal) return '';
    try {
        let cleanStr = dateVal;
        if (typeof dateVal === 'string' && !dateVal.includes('T') && dateVal.includes(' ')) {
            if (!dateVal.includes('+') && !dateVal.endsWith('Z')) {
                cleanStr = dateVal.replace(' ', 'T') + '+07:00';
            } else {
                cleanStr = dateVal.replace(' ', 'T');
            }
        }
        
        const date = new Date(cleanStr);
        if (isNaN(date.getTime())) return dateVal.toString();

        const formatter = new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const parts = formatter.formatToParts(date);
        const partObj = {};
        parts.forEach(p => {
            partObj[p.type] = p.value;
        });
        
        return `${partObj.hour}:${partObj.minute}:${partObj.second} ${partObj.day}/${partObj.month}/${partObj.year}`;
    } catch (e) {
        return dateVal.toString();
    }
};

