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

/**
 * resolveTableName
 * [WHY] Resolves a formatted display name for a table or order, handling merged tables.
 * @param {Object} order - The order object
 * @param {Array} allTables - List of all tables in system
 * @param {Object} tableMap - Optional O(1) table lookup map
 * @returns {string} - Formatted table name
 */
export const resolveTableName = (order, allTables = [], tableMap = null) => {
    if (!order) return 'Mang đi';

    if (order.merged_tables) {
        const ids = order.merged_tables.split('-').filter(Boolean);
        const names = ids.map(id => {
            const t = tableMap ? tableMap[id.toString()] : allTables.find(tbl => tbl.id.toString() === id.toString());
            return (t?.name || id).toString().replace(/^Bàn\s+/i, '');
        });
        return `Bàn ${names.join('-')}`;
    }

    const table = order.table || (tableMap ? tableMap[order.table_id?.toString()] : allTables.find(t => t.id === order.table_id));
    if (!table) return 'Mang đi';

    const name = (table.name || table.id).toString();
    return name.startsWith('Bàn') ? name : `Bàn ${name}`;
};
