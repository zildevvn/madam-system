import React from 'react';
import HeaderOrder from '../components/HeaderOrder';
import FooterOrder from '../components/FooterOrder';

const OrderLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 pb-[91px]">
            <HeaderOrder />
            <main>{children}</main>
            <FooterOrder />
        </div>
    );
};

export default OrderLayout;
