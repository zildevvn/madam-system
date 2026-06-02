// 1. React & Hooks
import React, { useEffect } from "react";

// 2. Third-party Libraries
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

// 3. Shared/constants
import { ROLES } from "./shared/constants/roles";

// 5. Hooks / Store Hooks
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { useGlobalSocket } from "./hooks/useGlobalSocket";

// 6. Components / Layouts & Guards
import DefaultLayout from "./layouts/DefaultLayout";
import StaffOrderLayout from "./layouts/StaffOrderLayout";
import OrderLayout from "./layouts/OrderLayout";
import AttendanceGuard from "./components/attendance/AttendanceGuard";
import { ErrorBoundary } from "./components/ErrorBoundary";

// 7. Pages
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
const ReservationEdit = ReservationCreate; // [WHY] Alias to make the dual-use of the component self-documenting in the router config
import ExpenseManagement from './pages/ExpenseManagement';
import UserProfilePage from './pages/UserProfilePage';
import EmployeeSchedulePage from './pages/EmployeeSchedulePage';

// 8. Store / Slices / Bootstraps / Styles
import { store } from './store';
import './bootstrap';
import { fetchProducts, fetchCategories } from "./store/slices/productSlice";
import "../css/app.css";
import "../scss/app.scss";



/**
 * RouteLayoutHandler: Unifies and standardizes the page layout state communication
 * via standardized HTML5 dataset attributes (document.documentElement.dataset.page).
 * Non-destructively synchronizes the body classList to preserve backwards-compatible styling.
 */
const RouteLayoutHandler = () => {
    const location = useLocation();

    useEffect(() => {
        // Sanitize path (e.g., /reservations/edit/1 -> reservations-edit)
        const pathSegments = location.pathname === '/'
            ? ['home']
            : location.pathname.split('/').filter(p => p && isNaN(p));

        const pageType = pathSegments.join('-');

        // 1. Standardize layout state communication via document.documentElement.dataset
        document.documentElement.dataset.page = pageType;

        // 2. Synchronize body classes non-destructively for existing SCSS selectors
        const newPageClass = `page-${pageType}`;
        
        // Safely remove any stale page-* classes
        const classesToRemove = Array.from(document.body.classList).filter(c => c.startsWith('page-'));
        classesToRemove.forEach(c => {
            if (c !== newPageClass) {
                document.body.classList.remove(c);
            }
        });

        // Safely add the new page class
        document.body.classList.add(newPageClass);

        return () => {
            // Clean up attributes upon unmounting
            document.documentElement.removeAttribute('data-page');
            document.body.classList.remove(newPageClass);
        };
    }, [location]);

    return null;
};

const ProtectedRoute = ({ children }) => {
    const user = useAppSelector(state => state.auth.user);
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return children ? children : <Outlet />;
};

/**
 * OrderStaffRoute: Dynamic guard that enforces the AttendanceGuard check
 * ONLY for employees with the 'ORDER_STAFF' role.
 * Admin, manager, and cashier roles completely bypass this validation.
 */
const OrderStaffRoute = ({ children }) => {
    const user = useAppSelector(state => state.auth.user);
    if (user?.role === ROLES.ORDER_STAFF) {
        return (
            <AttendanceGuard>
                {children ? children : <Outlet />}
            </AttendanceGuard>
        );
    }
    return children ? children : <Outlet />;
};

/**
 * ROLE_DEFAULT_ROUTES: Centralized role-to-route configuration.
 * Maps each employee role to its default workspace page and a user-friendly label.
 * Makes introducing or modifying roles extremely trivial.
 */
const ROLE_DEFAULT_ROUTES = {
    [ROLES.ADMIN]: { path: '/admin', label: 'Go to Admin Dashboard' },
    [ROLES.KITCHEN]: { path: '/kitchen', label: 'Go to Kitchen Page' },
    [ROLES.BAR]: { path: '/bar', label: 'Go to Bar Page' },
    [ROLES.CASHIER]: { path: '/cashier', label: 'Go to Cashier Page' },
    [ROLES.BILL]: { path: '/bills', label: 'Go to Bill Page' },
    [ROLES.MANAGER]: { path: '/staff-order', label: 'Go to Order Page' },
    [ROLES.ORDER_STAFF]: { path: '/staff-order', label: 'Go to Order Page' },
    [ROLES.SELLER]: { path: '/staff-order', label: 'Go to Order Page' },
};

const DEFAULT_REDIRECT = { path: '/', label: 'Go to Home' };

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
        const redirect = ROLE_DEFAULT_ROUTES[user.role] || DEFAULT_REDIRECT;

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
    const productCount = useAppSelector(state => state.product.products.allIds.length);
    const categoryCount = useAppSelector(state => state.product.categories.allIds.length);

    // [WHY] Global Real-time Listeners (Rule 412)
    // [RULE] Public channel listeners should be registered once and stay active.
    // Encapsulated in the useGlobalSocket hook to prevent App component bloating.
    useGlobalSocket();

    // [WHY] Initial Data Fetch for Products and Categories
    // Performs cache validation before dispatching to optimize network usage and boot performance.
    useEffect(() => {
        if (productCount === 0) {
            dispatch(fetchProducts());
        }
        if (categoryCount === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, productCount, categoryCount]);

    return (
        <ErrorBoundary>
            <BrowserRouter>
                <RouteLayoutHandler />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route element={<ProtectedRoute />}>
                        {/* User Profile */}
                        <Route path="/profile" element={<DefaultLayout><UserProfilePage /></DefaultLayout>} />
                        <Route path="/employee-schedule" element={<DefaultLayout><EmployeeSchedulePage /></DefaultLayout>} />

                        {/* Order & Reservation pages: guarded by attendance checks only for ORDER_STAFF role */}
                        <Route element={<OrderStaffRoute />}>
                            {/* Order page: Access by admin, manager, order_staff, seller */}
                            <Route path="/staff-order" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><StaffOrderLayout><StaffOrder /></StaffOrderLayout></RoleProtectedRoute>} />
                            <Route path="/order/:tableId" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><OrderLayout><Order /></OrderLayout></RoleProtectedRoute>} />
                            <Route path="/checkout/:tableId" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><Checkout /></RoleProtectedRoute>} />

                            {/* Reservations: Access by admin, manager, order_staff, seller */}
                            <Route path="/reservations" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><DefaultLayout><ReservationList /></DefaultLayout></RoleProtectedRoute>} />
                            <Route path="/reservations/create" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><DefaultLayout><ReservationCreate /></DefaultLayout></RoleProtectedRoute>} />
                            {/* [WHY] ReservationCreate handles both create and edit flows. The ReservationEdit alias is used to document this intent. */}
                            <Route path="/reservations/edit/:id" element={<RoleProtectedRoute allowedRoles={[ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER]}><DefaultLayout><ReservationEdit /></DefaultLayout></RoleProtectedRoute>} />
                        </Route>

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
        </ErrorBoundary>
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