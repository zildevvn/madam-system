import { parseISO } from 'date-fns';

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
