import { ROLES } from '../shared/constants/roles';

/**
 * Navigation Configuration
 * [WHY] Centralizing navigation items and their role permissions.
 */
export const NAVIGATION_ITEMS = [
    {
        name: 'Admin',
        href: '/admin',
        roles: [], // Handled by ROLES.ADMIN logic
        children: [
            { name: 'Lịch Làm Việc', href: '/employee-schedule' },
            { name: 'Nhân sự', href: '/admin/personnel' },
            { name: 'Quản Lý Bàn', href: '/admin/tables' },
            { name: 'Quản Lý Menu', href: '/admin/products' },
            { name: 'Hiệu Suất Nhân Viên', href: '/admin/performance' },
            { name: 'Thống Kê Đặt Chỗ', href: '/admin/reservation-stats' },
        ]
    },
    { name: 'Chấm Công', href: '/attendance', roles: [ROLES.MANAGER] },
    { name: 'Staff Order', href: '/staff-order', roles: [ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER] },
    { name: 'Kitchen', href: '/kitchen', roles: [ROLES.KITCHEN] },
    { name: 'Bar', href: '/bar', roles: [ROLES.BAR] },
    { name: 'Bills', href: '/bills', roles: [ROLES.BILL] },
    { name: 'Cashier', href: '/cashier', roles: [ROLES.CASHIER] },
    { name: 'Reservations', href: '/reservations', roles: [ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER] },
    { name: 'Expense Management', href: '/expenses', roles: [ROLES.CASHIER] },
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
