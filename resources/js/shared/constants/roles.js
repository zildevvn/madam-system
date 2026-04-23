/**
 * User Role Constants
 * [WHY] Centralized role definitions to prevent typos and ensure consistency across the app.
 * [RULE] Must match the roles defined in the backend (User model/migrations).
 */
export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    ORDER_STAFF: 'order_staff',
    CASHIER: 'cashier',
    KITCHEN: 'kitchen',
    BAR: 'bar',
    BILL: 'bill',
    SELLER: 'seller'
};
