/**
 * Evaluates whether the current user has permission to edit a payment history record.
 * [RULE] Only Admins, Accountants, or the Cashier who originally processed the payment can edit it.
 *
 * @param {Object} order - The historical order object.
 * @param {Object} user - The current authenticated user.
 * @returns {Object} { allowed: boolean, reason: string }
 */
export const getPaymentEditPermission = (order, user) => {
    if (!user) return { allowed: false, reason: 'Not logged in' };
    
    if (user.role === 'admin' || user.role === 'accountant') {
        return { allowed: true };
    }
    
    if (user.role === 'cashier') {
        if (order?.cashier_id && String(order.cashier_id) !== String(user.id)) {
            return { 
                allowed: false, 
                reason: 'Chỉ người lập hóa đơn mới có thể chỉnh sửa!' 
            };
        }
        
        return { allowed: true };
    }
    
    return { allowed: false, reason: 'Bạn không có quyền chỉnh sửa hóa đơn!' };
};
