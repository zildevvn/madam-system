/**
 * priceCalculations.js
 * [WHY] Centralized price calculation logic used by both the Payment Modal (real-time)
 * and the Cashier History (aggregation). Ensures 100% synchronization and prevents logic drift.
 */

export const calculateItemDiscount = (item) => {
    const price = Number(item.price || 0);
    const qty = Number(item.quantity || 0);
    const disc = Number(item.discount || 0);
    const type = item.discount_type || item.discountType || 'fixed';
    
    if (disc <= 0) return 0;
    
    if (type === 'percent') {
        return (price * qty * disc) / 100;
    }
    return disc * qty;
};

export const calculateTotals = (items = [], globalDiscount = { type: 'fixed', value: 0 }) => {
    const grossTotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
    const itemDiscountsTotal = items.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
    
    const subtotalAfterItems = Math.max(0, grossTotal - itemDiscountsTotal);
    
    let globalDiscountAmount = 0;
    const gVal = Number(globalDiscount.value || 0);
    if (gVal > 0) {
        if (globalDiscount.type === 'percent') {
            globalDiscountAmount = (subtotalAfterItems * gVal) / 100;
        } else {
            globalDiscountAmount = gVal;
        }
    }
    
    globalDiscountAmount = Math.min(subtotalAfterItems, globalDiscountAmount);
    const finalTotal = Math.max(0, subtotalAfterItems - globalDiscountAmount);
    
    return {
        grossTotal,
        itemDiscountsTotal,
        subtotalAfterItems,
        globalDiscountAmount,
        finalTotal
    };
};
