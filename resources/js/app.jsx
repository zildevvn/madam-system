import React from "react";
import ReactDOM from "react-dom/client";
import "../css/app.css";
import "../scss/app.scss";


import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Tables from "./pages/Tables";
import StaffOrder from "./pages/StaffOrder";
import Kitchen from "./pages/Kitchen";
import Accountant from "./pages/Accountant";
import Admin from "./pages/Admin";

// Set base default header
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const ProtectedRoute = ({ children }) => {
    const user = localStorage.getItem("user");
    if (!user) {
        return <Navigate to="/" replace />;
    }
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route path="/tables" element={<Tables />} />
                    <Route path="/staff-order" element={<StaffOrder />} />
                    <Route path="/kitchen" element={<Kitchen />} />
                    <Route path="/accountant" element={<Accountant />} />
                    <Route path="/admin" element={<Admin />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);