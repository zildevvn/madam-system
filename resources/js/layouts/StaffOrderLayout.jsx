import React from 'react';
import Header from '../components/Header';
import FooterStaffOrder from '../components/FooterStaffOrder';

const StaffOrderLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main>{children}</main>
            <FooterStaffOrder />
        </div>
    );
};

export default StaffOrderLayout;
