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
import Header from "./components/Header";
import DefaultLayout from "./layouts/DefaultLayout";
import StaffOrderLayout from "./layouts/StaffOrderLayout";
import OrderLayout from "./layouts/OrderLayout";
import Home from "./pages/Home";
import StaffOrder from "./pages/StaffOrder";
import Kitchen from "./pages/Kitchen";
import Admin from "./pages/Admin";
import Order from "./pages/Order";
import Checkout from "./pages/Checkout";
import Bills from "./pages/Bills";
import Cashier from './pages/Cashier';
import Bar from './pages/Bar';
import ReservationList from './pages/reservations/ReservationList';
import ReservationCreate from './pages/reservations/ReservationCreate';

// Set base default header
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { updateReservationFromSocket } from "./store/slices/reservationSlice";
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
    return children ? children : <Outlet />;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const user = useAppSelector(state => state.auth.user);
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Admin always has access to everything
    if (user.role === 'admin') {
        return children ? children : <Outlet />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const getRoleRedirect = (role) => {
            switch (role) {
                case 'kitchen': return { path: '/kitchen', label: 'Go to Kitchen Page' };
                case 'bar': return { path: '/bar', label: 'Go to Bar Page' };
                case 'cashier': return { path: '/cashier', label: 'Go to Cashier Page' };
                case 'bill': return { path: '/bills', label: 'Go to Bill Page' };
                case 'manager':
                case 'order_staff':
                case 'seller': return { path: '/staff-order', label: 'Go to Order Page' };
                default: return { path: '/', label: 'Return to Home' };
            }
        };

        const redirect = getRoleRedirect(user.role);

        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex flex-col items-center justify-center pt-50 px-4">
                    <div className="text-red-500 font-bold text-3xl mb-4">403</div>
                    <h3 className="mb-3">Unauthorized Access</h3>
                    <p className="text-gray-500 mb-8 max-w-md text-center">You do not have the required permissions to view this page. Please return to your designated workspace.</p>
                    <Link
                        to={redirect.path}
                        className="mdt-btn"
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

    // [WHY] Initial Data Fetch for Products and Categories
    useEffect(() => {
        dispatch(fetchProducts());
        dispatch(fetchCategories());
    }, [dispatch]);

    // [WHY] Global Real-time Listeners for Reservations
    // [RULE] Real-time updates must go through Redux (Rule 412)
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');
            
            channel.listen('.reservation_updated', (data) => {
                // [WHY] Update the normalized Redux store directly from the socket payload
                // The backend sends { id: ..., action: ..., reservation: ... }
                // Note: The backend event might need a small update to include the full reservation if it doesn't already
                // but for now we follow the 'id' + 'reservation' payload structure.
                dispatch(updateReservationFromSocket({ 
                    id: data.id.toString(), 
                    reservation: data.reservation,
                    action: data.action 
                }));
            });

            return () => window.Echo.leaveChannel('orders');
        }
    }, [dispatch]);

    return (
        <BrowserRouter>
            <RouteBodyClass />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route element={<ProtectedRoute />}>
                    {/* Order page: Access by admin, manager, order_staff, seller */}
                    <Route path="/staff-order" element={<RoleProtectedRoute allowedRoles={['manager', 'order_staff', 'seller']}><StaffOrderLayout><StaffOrder /></StaffOrderLayout></RoleProtectedRoute>} />
                    <Route path="/order/:tableId" element={<RoleProtectedRoute allowedRoles={['manager', 'order_staff', 'seller']}><OrderLayout><Order /></OrderLayout></RoleProtectedRoute>} />

                    {/* Reservations: Access by admin, manager, order_staff, seller */}
                    <Route path="/reservations" element={<RoleProtectedRoute allowedRoles={['manager', 'order_staff', 'seller']}><DefaultLayout><ReservationList /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/reservations/create" element={<RoleProtectedRoute allowedRoles={['manager', 'order_staff', 'seller']}><DefaultLayout><ReservationCreate /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/reservations/edit/:id" element={<RoleProtectedRoute allowedRoles={['manager', 'order_staff', 'seller']}><DefaultLayout><ReservationCreate /></DefaultLayout></RoleProtectedRoute>} />

                    {/* Cashier page: Access by admin, cashier */}
                    <Route path="/cashier" element={<RoleProtectedRoute allowedRoles={['cashier']}><DefaultLayout hideHeader={true}><Cashier /></DefaultLayout></RoleProtectedRoute>} />
                    
                    {/* Bill page: Access by admin, bill */}
                    <Route path="/bills" element={<RoleProtectedRoute allowedRoles={['bill']}><DefaultLayout hideHeader={true}><Bills /></DefaultLayout></RoleProtectedRoute>} />
                    
                    {/* Kitchen page: Access by admin, kitchen */}
                    <Route path="/kitchen" element={<RoleProtectedRoute allowedRoles={['kitchen']}><DefaultLayout hideHeader={true}><Kitchen /></DefaultLayout></RoleProtectedRoute>} />
                    
                    {/* Bar page: Access by admin, bar */}
                    <Route path="/bar" element={<RoleProtectedRoute allowedRoles={['bar']}><DefaultLayout hideHeader={true}><Bar /></DefaultLayout></RoleProtectedRoute>} />

                    {/* Admin: strictly admin only */}
                    <Route path="/admin" element={<RoleProtectedRoute allowedRoles={[]}><DefaultLayout><Admin /></DefaultLayout></RoleProtectedRoute>} />
                    
                    {/* Checkout (Related to cashier/billing) */}
                    <Route path="/checkout/:tableId" element={<RoleProtectedRoute allowedRoles={['cashier', 'bill']}><Checkout /></RoleProtectedRoute>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById("app")).render(
    <Provider store={store}>
        <Toaster position="top-right" reverseOrder={false} />
        <App />
    </Provider>
);