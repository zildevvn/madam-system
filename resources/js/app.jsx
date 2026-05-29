import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux';
import { store } from './store';
import './bootstrap';
import "../css/app.css";
import "../scss/app.scss";
import { Toaster } from 'react-hot-toast';


import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from "react-router-dom";
import DefaultLayout from "./layouts/DefaultLayout";
import StaffOrderLayout from "./layouts/StaffOrderLayout";
import OrderLayout from "./layouts/OrderLayout";
import Home from "./pages/Home";
import StaffOrder from "./pages/StaffOrder";
import Kitchen from "./pages/Kitchen";
import Admin from "./pages/Admin";
import AdminContent from "./pages/admin/AdminContent";
import PersonnelPage from "./pages/admin/PersonnelPage";
import EmployeeFormPage from "./pages/admin/EmployeeFormPage";
import EmployeeDetailPage from "./pages/admin/EmployeeDetailPage";
import TableManagement from "./pages/admin/TableManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import EmployeePerformancePage from "./pages/admin/EmployeePerformancePage";
import AttendanceManagementPage from "./pages/AttendanceManagementPage";
import Order from "./pages/Order";
import Checkout from "./pages/Checkout";
import Bills from "./pages/Bills";
import Cashier from './pages/Cashier';
import Bar from './pages/Bar';
import ReservationList from './pages/reservations/ReservationList';
import ReservationCreate from './pages/reservations/ReservationCreate';
import ExpenseManagement from './pages/ExpenseManagement';
import UserProfilePage from './pages/UserProfilePage';
import EmployeeSchedulePage from './pages/EmployeeSchedulePage';
import AttendanceGuard from "./components/attendance/AttendanceGuard";

// Set base default header
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

// Stateless authorization: send current user ID in the headers
window.axios.interceptors.request.use((config) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.id) {
                config.headers['X-User-Id'] = user.id;
            }
        } catch (e) {
            console.error('Failed to parse user from localStorage', e);
        }
    }
    return config;
});

import { ROLES } from "./shared/constants/roles";

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { updateReservationFromSocket } from "./store/slices/reservationSlice";
import { updateOrderFromSocket } from "./store/slices/orderSlice";
import { updateTableFromSocket, fetchTables } from "./store/slices/tableSlice";
import { addNotificationFromSocket, fetchNotificationsAsync } from "./store/slices/notificationSlice";
import { fetchProducts, fetchCategories } from "./store/slices/productSlice";
import { useAppDispatch, useAppSelector } from "./store/hooks";

const RouteBodyClass = () => {
    const location = useLocation();

    useEffect(() => {
        // Preserve common classes, remove existing page-* classes
        const existingClasses = document.body.className.split(' ').filter(c => c && !c.startsWith('page-'));

        // Sanitize path (e.g., /reservations/edit/1 -> reservations-edit)
        const pathSegments = location.pathname === '/'
            ? ['home']
            : location.pathname.split('/').filter(p => p && isNaN(p));

        const pageClass = `page-${pathSegments.join('-')}`;
        document.body.className = [...existingClasses, pageClass].join(' ');
    }, [location]);

    return null;
};

const ProtectedRoute = ({ children }) => {
    const user = useAppSelector(state => state.auth.user);
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return (
        <AttendanceGuard>
            {children ? children : <Outlet />}
        </AttendanceGuard>
    );
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const user = useAppSelector(state => state.auth.user);
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Admin always has access to everything
    if (user.role === ROLES.ADMIN) {
        return children ? children : <Outlet />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const getRoleRedirect = (role) => {
            switch (role) {
                case ROLES.KITCHEN: return { path: '/kitchen', label: 'Go to Kitchen Page' };
                case ROLES.BAR: return { path: '/bar', label: 'Go to Bar Page' };
                case ROLES.CASHIER: return { path: '/cashier', label: 'Go to Cashier Page' };
                case ROLES.BILL: return { path: '/bills', label: 'Go to Bill Page' };
                case ROLES.MANAGER:
                case ROLES.ORDER_STAFF:
                case ROLES.SELLER: return { path: '/staff-order', label: 'Go to Order Page' };
                default: return { path: '/', label: 'Go to Home' };
            }
        };

        const redirect = getRoleRedirect(user.role);

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md">
                    <h3 className="text-red-800 font-bold text-lg mb-2">Access Denied</h3>
                    <p className="text-red-600 mb-6">You don't have permission to access this page.</p>
                    <Link
                        to={redirect.path}
                        className="inline-block px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        {redirect.label}
                    </Link>
                </div>
            </div>
        );
    }

    return children ? children : <Outlet />;
};

function App() {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.auth);

    // [WHY] Initial Data Fetch for Products and Categories
    useEffect(() => {
        dispatch(fetchProducts());
        dispatch(fetchCategories());
    }, [dispatch]);

    // [WHY] Global Real-time Listeners (Rule 412)
    // [RULE] Public channel listeners should be registered once and stay active.
    useEffect(() => {
        if (window.Echo) {
            // 1. Orders & Reservations (Public Channel)
            const orderChannel = window.Echo.channel('orders');
            orderChannel.stopListening('.reservation_updated');
            orderChannel.listen('.reservation_updated', (data) => {
                dispatch(updateReservationFromSocket({
                    id: data.id.toString(),
                    reservation: data.reservation,
                    action: data.action
                }));

                if (data.reservation?.table_id) {
                    dispatch(updateTableFromSocket({
                        id: data.reservation.table_id,
                        status: data.action === 'confirmed' ? 'busy' : 'available'
                    }));
                }
            });

            const handleOrderEvent = (data) => {
                if (data.order) {
                    dispatch(updateOrderFromSocket(data.order));
                    if (data.order.table) {
                        dispatch(updateTableFromSocket(data.order.table));
                    }
                }
                dispatch(fetchTables());
            };

            orderChannel.stopListening('.order_created');
            orderChannel.stopListening('.order_updated');
            orderChannel.stopListening('.item_status_updated');
            orderChannel.listen('.order_created', handleOrderEvent);
            orderChannel.listen('.order_updated', handleOrderEvent);
            orderChannel.listen('.item_status_updated', handleOrderEvent);

            // 2. System Notifications (Public Channel)
            const notificationChannel = window.Echo.channel('system-notifications');
            notificationChannel.stopListening('.new-message');
            notificationChannel.listen('.new-message', (data) => {
                const message = data.message || data;
                if (message) {
                    dispatch(addNotificationFromSocket(message));
                }
            });

            return () => {
                window.Echo.leaveChannel('orders');
                window.Echo.leaveChannel('system-notifications');
            };
        }
    }, [dispatch]);

    return (
        <BrowserRouter>
            <RouteBodyClass />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route element={<ProtectedRoute />}>
                    {/* User Profile */}
                    <Route path="/profile" element={<DefaultLayout><UserProfilePage /></DefaultLayout>} />
                    <Route path="/employee-schedule" element={<DefaultLayout><EmployeeSchedulePage /></DefaultLayout>} />

                    {/* Order page: Access by admin, manager, order_staff, seller */}
                    <Route path="/staff-order" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><StaffOrderLayout><StaffOrder /></StaffOrderLayout></RoleProtectedRoute>} />
                    <Route path="/order/:tableId" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><OrderLayout><Order /></OrderLayout></RoleProtectedRoute>} />
                    <Route path="/checkout/:tableId" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><Checkout /></RoleProtectedRoute>} />

                    {/* Reservations: Access by admin, manager, order_staff, seller */}
                    <Route path="/reservations" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><DefaultLayout><ReservationList /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/reservations/create" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><DefaultLayout><ReservationCreate /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/reservations/edit/:id" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><DefaultLayout><ReservationCreate /></DefaultLayout></RoleProtectedRoute>} />

                    {/* Cashier page: Access by admin, cashier */}
                    <Route path="/cashier" element={<RoleProtectedRoute allowedRoles={[ROLES.CASHIER]}><DefaultLayout><Cashier /></DefaultLayout></RoleProtectedRoute>} />

                    {/* Expenses: Access by admin, cashier */}
                    <Route path="/expenses" element={<RoleProtectedRoute allowedRoles={[ROLES.CASHIER]}><DefaultLayout><ExpenseManagement /></DefaultLayout></RoleProtectedRoute>} />

                    {/* Bill page: Access by admin, bill */}
                    <Route path="/bills" element={<RoleProtectedRoute allowedRoles={[ROLES.BILL]}><DefaultLayout hideHeader={true}><Bills /></DefaultLayout></RoleProtectedRoute>} />

                    {/* Attendance page: Access by admin, manager */}
                    <Route path="/attendance" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER]}><DefaultLayout><AttendanceManagementPage /></DefaultLayout></RoleProtectedRoute>} />

                    {/* Admin Dashboard */}
                    <Route path="/admin" element={<RoleProtectedRoute allowedRoles={[ROLES.ADMIN]}><DefaultLayout><Admin /></DefaultLayout></RoleProtectedRoute>}>
                        <Route index element={<AdminContent />} />
                        <Route path="personnel" element={<PersonnelPage />} />
                        <Route path="personnel/create" element={<EmployeeFormPage />} />
                        <Route path="personnel/edit/:id" element={<EmployeeFormPage />} />
                        <Route path="personnel/:id" element={<EmployeeDetailPage />} />
                        <Route path="tables" element={<TableManagement />} />
                        <Route path="products" element={<ProductManagement />} />
                        <Route path="performance" element={<EmployeePerformancePage />} />
                    </Route>

                    {/* Kitchen and Bar: Access by admin, kitchen, bar */}
                    <Route path="/kitchen" element={<RoleProtectedRoute allowedRoles={[ROLES.KITCHEN]}><DefaultLayout><Kitchen mode="kitchen" /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/bar" element={<RoleProtectedRoute allowedRoles={[ROLES.BAR]}><DefaultLayout hideHeader={true}><Bar /></DefaultLayout></RoleProtectedRoute>} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" />
        </BrowserRouter>
    );
}

if (document.getElementById('app')) {
    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(
        <Provider store={store}>
            <App />
        </Provider>
    );
}