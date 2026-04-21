import React from 'react';
import Header from '../components/Header';
import { useAppSelector } from '../store/hooks';

const DefaultLayout = ({ children, hideHeader = false }) => {
    const { user } = useAppSelector(state => state.auth);
    
    // [WHY] Admin should always see the header for navigation purposes,
    // even on typically full-screen specialized pages like Kitchen or Billing.
    const shouldHide = user?.role === 'admin' ? false : hideHeader;

    return (
        <div className="min-h-screen bg-gray-50">
            {!shouldHide && <Header />}
            <main>{children}</main>
        </div>
    );
};

export default DefaultLayout;
