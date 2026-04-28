/**
 * Centralized thresholds for order timing and delay warnings.
 * Following Shared Files Rules from README.md.
 */

export const THRESHOLD_BAR_CRITICAL = 5; // Bar items are considered critical after 5 mins
export const THRESHOLD_KITCHEN_CRITICAL = 20;
export const THRESHOLD_KITCHEN_WARNING = 10;
export const THRESHOLD_KITCHEN_ALERT = 5;

export const ADDITIONAL_ITEM_THRESHOLD_MS = 30000; // 30s buffer to detect additional items
export const NEW_ORDER_PULSING_TIMEOUT_S = 300;    // Pulsing animation duration (5 mins)
