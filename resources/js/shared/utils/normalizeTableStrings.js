/**
 * normalizeTableStrings.js
 * [WHY] Standardizes merged table strings (e.g., "9-10-11") across the app.
 * [RULE] Shared utility for predictable table UI representing multi-table orders.
 */

/**
 * cleanMergedString
 * [WHY] Removes internal suffixes (-indiv, -group) and ensures sorted numeric ranges.
 * @param {string} str - The raw merged_tables string from DB
 * @returns {string|null} - Normalized string (e.g., "7-8-9") or null
 */
export const cleanMergedString = (str) => {
    if (!str) return null;
    
    // [RULE] Treat both "-" and "," as separators to be safe
    return str.split(/[- ,]/)
        .map(p => p.toString().replace(/[^0-9]/g, ''))
        .filter(Boolean)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .join('-');
};

/**
 * generateTableRange
 * [WHY] Aggregates a set/array of IDs into a normalized range string.
 * @param {Array|Set} tableIds - Collection of table IDs
 * @returns {string|null}
 */
export const generateTableRange = (tableIds) => {
    const ids = Array.from(tableIds)
        .filter(Boolean)
        .map(id => parseInt(id.toString().replace(/[^0-9]/g, '')))
        .sort((a, b) => a - b);

    if (ids.length === 0) return null;
    return ids.join('-');
};
