import { ROLES } from '../shared/constants/roles';

/**
 * Navigation Configuration
 * [WHY] Centralizing navigation items and their role permissions.
 */
export const NAVIGATION_ITEMS = [
    {
        name: 'Admin',
        href: '/admin',
        roles: [ROLES.ACCOUNTANT, ROLES.CASHIER], // Handled by ROLES.ADMIN logic
        children: [
            { name: 'Lịch Làm Việc', href: '/employee-schedule', roles: [ROLES.ADMIN, ROLES.CASHIER] },
            { name: 'Nhân sự', href: '/admin/personnel', roles: [ROLES.ACCOUNTANT, ROLES.CASHIER] },
            { name: 'Quản Lý Bàn', href: '/admin/tables', roles: [ROLES.ACCOUNTANT, ROLES.CASHIER] },
            { name: 'Quản Lý Menu', href: '/admin/products', roles: [ROLES.ADMIN, ROLES.CASHIER] },
            { name: 'Hiệu Suất Nhân Viên', href: '/admin/performance', roles: [ROLES.ADMIN, ROLES.CASHIER] },
        ]
    },
    { name: 'Chấm Công', href: '/attendance', roles: [ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.CASHIER] },
    { name: 'Staff Order', href: '/staff-order', roles: [ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER, ROLES.CASHIER] },
    { name: 'Kitchen', href: '/kitchen', roles: [ROLES.KITCHEN] },
    { name: 'Bar', href: '/bar', roles: [ROLES.BAR] },
    { name: 'Bills', href: '/bills', roles: [ROLES.BILL, ROLES.CASHIER] },
    { name: 'Cashier', href: '/cashier', roles: [ROLES.CASHIER, ROLES.ACCOUNTANT] },
    {
        name: 'Reservations',
        href: '/reservations',
        roles: [ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER, ROLES.ACCOUNTANT, ROLES.CASHIER],
        children: [
            { name: 'Danh Sách Đặt Chỗ', href: '/reservations', roles: [ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER, ROLES.CASHIER] },
            { name: 'Thống Kê Đặt Chỗ', href: '/reservations/stats', roles: [ROLES.ADMIN, ROLES.SELLER, ROLES.CASHIER] },
            { name: 'Đối Tác', href: '/reservations/partner-companies', roles: [ROLES.ADMIN, ROLES.SELLER, ROLES.CASHIER] },
        ]
    },
    { name: 'Expense Management', href: '/expenses', roles: [ROLES.CASHIER, ROLES.ACCOUNTANT, ROLES.CASHIER] },
    { name: 'Accountant', href: '/admin/order-export', roles: [ROLES.ACCOUNTANT, ROLES.CASHIER] },
];

/**
 * Layout & Banner Configuration
 * [WHY] Externalizing route-based UI triggers for easier maintenance.
 */
export const BANNER_PAGES = [
    '/staff-order'
];

export const FIXED_LAYOUT_ROUTES = [
    '/staff-order',
    '/bills',
    '/cashier',
    '/kitchen',
    '/bar'
];
