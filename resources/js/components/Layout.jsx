import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="py-10">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
