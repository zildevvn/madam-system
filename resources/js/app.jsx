import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux';
import { store } from './store';
import "../css/app.css";
import "../scss/app.scss";


import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import DefaultLayout from "./layouts/DefaultLayout";
import StaffOrderLayout from "./layouts/StaffOrderLayout";
import OrderLayout from "./layouts/OrderLayout";
import Home from "./pages/Home";
import Tables from "./pages/Tables";
import StaffOrder from "./pages/StaffOrder";
import Kitchen from "./pages/Kitchen";
import Accountant from "./pages/Accountant";
import Admin from "./pages/Admin";
import Order from "./pages/Order";
import Checkout from "./pages/Checkout";
import Bills from "./pages/Bills";
import Cashier from './pages/Cashier';

// Set base default header
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import { useAppSelector } from "./store/hooks";

const ProtectedRoute = ({ children }) => {
    const { user } = useAppSelector(state => state.auth);
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return children ? children : <Outlet />;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAppSelector(state => state.auth);
    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (user.role === 'admin') {
        return children ? children : <Outlet />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-red-500 font-bold text-2xl">403 | Unauthorized Access</div>;
    }

    return children ? children : <Outlet />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/tables" element={<RoleProtectedRoute allowedRoles={['order_staff']}><DefaultLayout><Tables /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/staff-order" element={<RoleProtectedRoute allowedRoles={['order_staff']}><StaffOrderLayout><StaffOrder /></StaffOrderLayout></RoleProtectedRoute>} />
                    <Route path="/kitchen" element={<RoleProtectedRoute allowedRoles={['kitchen']}><DefaultLayout><Kitchen /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/accountant" element={<RoleProtectedRoute allowedRoles={[]}><DefaultLayout><Accountant /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/admin" element={<RoleProtectedRoute allowedRoles={[]}><DefaultLayout><Admin /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/bills" element={<RoleProtectedRoute allowedRoles={['cashier', 'order_staff']}><DefaultLayout><Bills /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/cashier" element={<RoleProtectedRoute allowedRoles={['cashier']}><DefaultLayout><Cashier /></DefaultLayout></RoleProtectedRoute>} />
                    <Route path="/order/:tableId" element={<RoleProtectedRoute allowedRoles={['order_staff']}><OrderLayout><Order /></OrderLayout></RoleProtectedRoute>} />
                    <Route path="/checkout/:tableId" element={<RoleProtectedRoute allowedRoles={['cashier', 'order_staff']}><Checkout /></RoleProtectedRoute>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById("app")).render(
    <Provider store={store}>
        <App />
    </Provider>
);