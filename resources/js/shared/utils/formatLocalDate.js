import dayjs from 'dayjs';

/**
 * formatLocalDate
 * [WHY] Formats a Date object, string, or number strictly in the user's local timezone to 'YYYY-MM-DD'.
 * [RULE] Avoids UTC/ISO timezone conversion errors.
 */
export const formatLocalDate = (date) => {
    return dayjs(date).format('YYYY-MM-DD');
};
