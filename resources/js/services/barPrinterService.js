import qz from 'qz-tray';
import { setupQzSecurity } from './qzSecurityService.js';

/**
 * Identify if an item has product type exactly 'drink'.
 * Handles both cart items (product object or flat type) and backend order items.
 *
 * @param {Object} item
 * @returns {boolean}
 */
export const isDrinkItem = (item) => {
    if (!item) return false;
    const type = item.product?.type || item.type;
    return type === 'drink';
};

/**
 * Identify and extract only newly added drinks or increased drink quantities
 * between the original saved order snapshot and the current cart items.
 *
 * - For new orders (wasConfirmed = false), all current drinks are returned.
 * - For existing orders (wasConfirmed = true):
 *   - Completely new drink items (not present in original snapshot) are returned with their full quantity.
 *   - Existing drinks with increased quantity are returned with only the newly added delta (currentQty - originalQty).
 *   - Unchanged drinks, decreased quantity drinks, and removed drinks are omitted.
 *
 * @param {Array} currentDrinks - Array of drink items currently in cart
 * @param {Object} originalItemsSnapshot - Map of [itemId]: { quantity, note, type } from Redux orderSlice
 * @param {boolean} [wasConfirmed=true] - Whether the order was previously saved/confirmed
 * @returns {Array} Array of drink items to be printed with adjusted quantities
 */
export const getNewlyAddedDrinks = (currentDrinks = [], originalItemsSnapshot = {}, wasConfirmed = true) => {
    if (!wasConfirmed || !originalItemsSnapshot || Object.keys(originalItemsSnapshot).length === 0) {
        return currentDrinks.filter(isDrinkItem);
    }

    const newlyAdded = [];

    for (const item of currentDrinks) {
        if (!isDrinkItem(item)) continue;

        const original = originalItemsSnapshot[item.id];
        if (!original) {
            // New drink item added to cart that was not present in original order snapshot
            const qty = Number(item.quantity) || 0;
            if (qty > 0) {
                newlyAdded.push({ ...item, quantity: qty });
            }
        } else {
            const originalQty = Number(original.quantity) || 0;
            const currentQty = Number(item.quantity) || 0;
            const deltaQty = currentQty - originalQty;

            // Existing drink item whose quantity has increased
            if (deltaQty > 0) {
                newlyAdded.push({
                    ...item,
                    quantity: deltaQty
                });
            }
        }
    }

    return newlyAdded;
};

/**
 * Format bilingual item name in 'Tên tiếng Việt - English Name' format.
 * Matches Cashier Payment Receipt naming convention while deduplicating
 * identical names across languages.
 *
 * @param {Object} item
 * @returns {string}
 */
export const formatBilingualItemName = (item) => {
    if (!item) return 'Món nước';

    const viName = (item.name_vi || item.product?.name_vi || '').trim();
    const enName = (item.name || item.product?.name || '').trim();

    if (viName && enName) {
        if (viName.toLowerCase() === enName.toLowerCase()) {
            return viName;
        }
        return `${viName} - ${enName}`;
    }

    return viName || enName || 'Món nước';
};

/**
 * HTML escaper to prevent formatting corruption.
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Format drink receipt HTML for 80mm continuous thermal paper (K80).
 * Styled consistently with the Cashier Payment Receipt (Receipt.jsx & _management.scss).
 *
 * @param {Object} params
 * @param {string|number} params.orderId
 * @param {string} params.tableName
 * @param {Date} params.time
 * @param {Array} params.items
 * @param {string} [params.orderNote]
 * @param {string} [params.title]
 * @param {string} [params.staffName]
 * @param {Object} [params.order]
 * @returns {string}
 */
export const formatDrinkReceiptHtml = ({
    orderId,
    tableName,
    time = new Date(),
    items = [],
    orderNote = '',
    title = 'PHIẾU PHA CHẾ',
    staffName = '',
    order = null
}) => {
    const resolvedStaffName = staffName || order?.server?.name || order?.staffName || '';

    const formatReceiptDate = (date) => {
        if (!date) return '-';
        return new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        }).format(new Date(date)).replace(',', '');
    };

    const timeString = formatReceiptDate(time);
    const displayTableName = tableName ? tableName.toString().replace(/^Bàn\s+/i, '') : '-';
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    const itemsRowsHtml = items.map((item) => {
        const qty = String(item.quantity).padStart(2, '0');
        const name = formatBilingualItemName(item);
        const note = item.note ? escapeHtml(item.note) : '';

        return `
            <tr style="border-bottom: 1px dashed #e0e0e0;">
                <td align="left" width="75%" class="receipt-col-name" style="padding: 6px 0; vertical-align: top; text-align: left; word-break: break-word; overflow-wrap: break-word; white-space: normal;">
                    <div class="receipt-item-name" style="font-weight: 900; font-size: 10pt; line-height: 1.3; word-break: break-word; overflow-wrap: break-word;">
                        ${escapeHtml(name)}
                    </div>
                    ${note ? `
                    <div class="receipt-item-note" style="font-size: 8pt; font-style: italic; font-weight: normal; margin-top: 2px; padding-left: 14px;">
                        - ${note}
                    </div>` : ''}
                </td>
                <td align="center" width="25%" class="receipt-col-qty" style="padding: 6px 0; vertical-align: top; text-align: center; white-space: nowrap; font-size: 10pt; font-weight: 900;">
                    ${qty}
                </td>
            </tr>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            size: auto;
            margin: 0;
        }
        *, *:before, *:after {
            box-sizing: border-box;
        }
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            background: #fff;
            color: #000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .receipt-print-only {
            display: block;
            position: relative;
            width: 100%;
            max-width: 80mm;
            margin: 0 auto;
            padding: 4mm 3mm;
            box-sizing: border-box;
            background: #fff;
            color: #000;
            font-family: "Courier New", Courier, Consolas, monospace;
            font-size: 10pt;
            line-height: 1.4;
            -webkit-font-smoothing: none;
            -moz-osx-font-smoothing: none;
            font-smooth: never;
            text-rendering: optimizeSpeed;
            font-synthesis: none;
        }
        .receipt-container {
            width: 100%;
        }
        .receipt-header {
            text-align: center;
            margin-bottom: 4mm;
            border-bottom: 1.5px solid #000;
            padding-bottom: 4mm;
        }
        .receipt-title {
            margin: 2mm 0 2px 0;
            font-size: 12pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .receipt-subtitle {
            margin: 1px 0 0;
            font-size: 9pt;
            font-weight: 700;
        }
        .receipt-meta {
            margin-bottom: 4mm;
            font-size: 9pt;
            line-height: 1.4;
        }
        .receipt-meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
            font-size: 9pt;
        }
        .receipt-note-block {
            margin-top: 2mm;
            padding-top: 2mm;
            border-top: 1.5px dashed #000;
            font-size: 9pt;
            line-height: 1.4;
            word-break: break-word;
        }
        .receipt-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4mm;
        }
        .receipt-table th {
            border-top: 1.5px dashed #000;
            border-bottom: 1.5px dashed #000;
            padding: 6px 0;
            text-transform: uppercase;
            font-size: 9.5pt;
            font-weight: 900;
        }
        .receipt-table td {
            padding: 6px 0;
            vertical-align: top;
            font-size: 10pt;
            font-weight: 700;
        }
        .receipt-col-name {
            text-align: left;
            word-break: break-word;
            overflow-wrap: break-word;
            white-space: normal;
        }
        .receipt-col-qty {
            text-align: center;
            white-space: nowrap;
        }
        .receipt-item-name {
            font-weight: 900;
            line-height: 1.3;
            font-size: 10pt;
            word-break: break-word;
            overflow-wrap: break-word;
        }
        .receipt-item-note {
            font-size: 8pt;
            font-style: italic;
            font-weight: normal;
            margin-top: 2px;
            padding-left: 14px;
        }
        .receipt-total-row td {
            border-top: 1.5px dashed #000;
            padding-top: 6px;
            padding-bottom: 3.5px;
            font-size: 10pt;
            font-weight: 900;
        }
        .receipt-footer {
            text-align: center;
            margin-top: 6mm;
            font-size: 9pt;
            font-style: italic;
            border-top: 1.5px dashed #000;
            padding-top: 3mm;
        }
    </style>
</head>
<body>
    <div class="receipt-print-only" style="display: block; position: relative; width: 100%; max-width: 80mm; margin: 0 auto; padding: 4mm 3mm; box-sizing: border-box; background: #fff; color: #000; font-family: 'Courier New', Courier, Consolas, monospace; font-size: 10pt; line-height: 1.4; -webkit-font-smoothing: none; text-rendering: optimizeSpeed;">
        <div class="receipt-container" style="width: 100%;">
            <!-- Receipt Header -->
            <div class="receipt-header" style="text-align: center; margin-bottom: 4mm; border-bottom: 1.5px solid #000; padding-bottom: 4mm;">
                <div class="receipt-title" style="margin: 2mm 0 2px 0; font-size: 12pt; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
                    ${escapeHtml(title)}
                </div>
            </div>

            <!-- Receipt Meta -->
            <div class="receipt-meta" style="margin-bottom: 4mm; font-size: 9pt; line-height: 1.4;">
                <div class="receipt-meta-row" style="display: flex; justify-content: space-between; margin-bottom: 1mm; font-size: 9pt;">
                    <span>Table:</span>
                    <span style="font-weight: 900;">${escapeHtml(displayTableName)}</span>
                </div>
                <div class="receipt-meta-row" style="display: flex; justify-content: space-between; margin-bottom: 1mm; font-size: 9pt;">
                    <span>Printed Time:</span>
                    <span>${timeString}</span>
                </div>
                ${resolvedStaffName ? `
                <div class="receipt-meta-row" style="display: flex; justify-content: space-between; margin-bottom: 1mm; font-size: 9pt;">
                    <span>Order Staff:</span>
                    <span>${escapeHtml(resolvedStaffName)}</span>
                </div>` : ''}
                ${orderNote ? `
                <div class="receipt-note-block" style="margin-top: 2mm; padding-top: 2mm; border-top: 1.5px dashed #000; font-size: 9pt; line-height: 1.4; word-break: break-word;">
                    <span style="font-weight: 900;">* Note: </span>
                    <span>${escapeHtml(orderNote)}</span>
                </div>` : ''}
            </div>

            <!-- Table of Drink Items -->
            <table class="receipt-table" style="width: 100%; border-collapse: collapse; margin-bottom: 4mm;">
                <thead>
                    <tr>
                        <th align="left" width="75%" class="receipt-col-name" style="border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000; padding: 6px 0; text-align: left; text-transform: uppercase; font-size: 9.5pt; font-weight: 900;">
                            Item
                        </th>
                        <th align="center" width="25%" class="receipt-col-qty" style="border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000; padding: 6px 0; text-align: center; text-transform: uppercase; font-size: 9.5pt; font-weight: 900;">
                            Qty
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRowsHtml}
                    <tr class="receipt-total-row" style="border-top: 1.5px dashed #000;">
                        <td align="left" width="75%" class="receipt-col-name" style="border-top: 1.5px dashed #000; padding: 6px 0 3.5px 0; font-size: 10pt; font-weight: 900; text-align: left;">
                            Total Drinks (${totalQuantity})
                        </td>
                        <td align="center" width="25%" class="receipt-col-qty" style="border-top: 1.5px dashed #000; padding: 6px 0 3.5px 0; font-size: 10pt; font-weight: 900; text-align: center;">
                            ${totalQuantity}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
};

// Cache for recent prints to prevent accidental duplicate prints within a 10s cooldown
const recentPrints = new Map();
const inFlightPrints = new Set();
const DEDUPLICATION_WINDOW_MS = 10000;

/**
 * Automatically print drink items to Xprinter_Bar via QZ Tray.
 *
 * @param {Object} options
 * @param {string|number} [options.orderId]
 * @param {string} options.tableName
 * @param {Array} options.items
 * @param {string} [options.orderNote]
 * @param {string} [options.title]
 * @param {string} [options.printerName]
 * @param {string} [options.staffName]
 * @param {Object} [options.order]
 * @returns {Promise<{ success: boolean, reason?: string, error?: any }>}
 */
export const printDrinkTicket = async ({
    orderId,
    tableName,
    items = [],
    orderNote = '',
    title = 'PHIẾU PHA CHẾ',
    printerName,
    staffName = '',
    order = null,
    isReprint = false
}) => {
    // 1. Filter only items whose product type is strictly 'drink'
    const drinkItems = items.filter(isDrinkItem);

    // 2. If no drink items exist, do not trigger printing
    if (drinkItems.length === 0) {
        return { success: false, reason: 'no_drinks' };
    }

    const resolvedStaffName = staffName || order?.server?.name || order?.staffName || '';
    const resolvedOrderId = orderId || order?.id || 'new';

    // 3. Deduplication check: prevent concurrent calls and duplicate print within 10s
    const itemsSignature = drinkItems.map(i => `${i.id || i.product_id}:${i.quantity}:${i.note || ''}`).join('|');
    const printKey = `${resolvedOrderId}-${tableName || ''}-${itemsSignature}-${title}`;

    // 3a. In-flight check: Prevent concurrent or double-click calls for the exact same ticket
    if (inFlightPrints.has(printKey)) {
        console.warn('Bar print request already in-flight, ignoring concurrent call:', printKey);
        return { success: false, reason: 'in_flight' };
    }

    // 3b. Cooldown check: Prevent duplicate print within cooldown window (10s), unless explicitly forced via reprint
    const lastPrintedAt = recentPrints.get(printKey);
    const now = Date.now();
    if (!isReprint && lastPrintedAt && (now - lastPrintedAt) < DEDUPLICATION_WINDOW_MS) {
        console.warn('Duplicate bar print request ignored (cooldown):', printKey);
        return { success: false, reason: 'duplicate_prevented' };
    }

    // Lock the ticket as in-flight
    inFlightPrints.add(printKey);

    try {
        // 4. Ensure connection to QZ Tray with valid security certificate and signature
        setupQzSecurity();
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect();
        }

        const barPrinter = printerName || (typeof localStorage !== 'undefined' ? localStorage.getItem('bar_printer_name') : null) || 'Xprinter_Bar';

        // 5. Configure 80mm continuous thermal receipt matching Cashier Payment Receipt with auto-scaling disabled
        const config = qz.configs.create(barPrinter, {
            size: { width: 80 },
            units: 'mm',
            margins: 0,
            scaleContent: false
        });

        // 6. Generate HTML payload
        const html = formatDrinkReceiptHtml({
            orderId: resolvedOrderId,
            tableName,
            time: new Date(),
            items: drinkItems,
            orderNote,
            title,
            staffName: resolvedStaffName,
            order
        });

        const htmlData = [{
            type: 'html',
            format: 'plain',
            data: html
        }];

        // 7. Dispatch print job to QZ Tray
        await qz.print(config, htmlData);

        // Record successful print for deduplication only after qz.print resolves
        recentPrints.set(printKey, Date.now());

        // Cleanup old keys in cache
        for (const [key, timestamp] of recentPrints.entries()) {
            if (now - timestamp > DEDUPLICATION_WINDOW_MS * 2) {
                recentPrints.delete(key);
            }
        }

        return { success: true };
    } catch (error) {
        // Graceful error handling: log error without breaking caller execution
        console.error('Lỗi in máy quầy nước Xprinter_Bar via QZ Tray:', error);
        return { success: false, error: error.message || String(error) };
    } finally {
        // Always release in-flight lock, regardless of success or failure
        inFlightPrints.delete(printKey);
    }
};

export const _testHooks = {
    recentPrints,
    inFlightPrints,
    DEDUPLICATION_WINDOW_MS,
    clearCaches: () => {
        recentPrints.clear();
        inFlightPrints.clear();
    }
};

/**
 * Check if current device is designated as the Bar Printer station.
 * Waiters' mobile devices return false by default.
 * Only the designated POS station connected to Xprinter_Bar returns true.
 *
 * @returns {boolean}
 */
export const isBarPrinterStation = () => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('is_bar_printer_station') === 'true';
};

/**
 * Configure whether current device acts as the Bar Printer station.
 *
 * @param {boolean} enabled
 */
export const setBarPrinterStation = (enabled) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('is_bar_printer_station', enabled ? 'true' : 'false');
};

export default {
    isDrinkItem,
    getNewlyAddedDrinks,
    formatBilingualItemName,
    formatDrinkReceiptHtml,
    printDrinkTicket,
    isBarPrinterStation,
    setBarPrinterStation,
    _testHooks
};
