import React from 'react';
import Header from '../components/Header';

const DefaultLayout = ({ children, hideHeader = false }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {!hideHeader && <Header />}
            <main>{children}</main>
        </div>
    );
};

export default DefaultLayout;
