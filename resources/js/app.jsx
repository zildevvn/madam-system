import React from "react";
import ReactDOM from "react-dom/client";
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

// Set base default header
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const ProtectedRoute = ({ children }) => {
    const user = localStorage.getItem("user");
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return children ? children : <Outlet />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/tables" element={<DefaultLayout><Tables /></DefaultLayout>} />
                    <Route path="/staff-order" element={<StaffOrderLayout><StaffOrder /></StaffOrderLayout>} />
                    <Route path="/kitchen" element={<DefaultLayout><Kitchen /></DefaultLayout>} />
                    <Route path="/accountant" element={<DefaultLayout><Accountant /></DefaultLayout>} />
                    <Route path="/admin" element={<DefaultLayout><Admin /></DefaultLayout>} />
                    <Route path="/order/:tableId" element={<OrderLayout><Order /></OrderLayout>} />
                    <Route path="/checkout/:tableId" element={<Checkout />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);