import React from 'react';
import Header from '../components/Header';
import HeaderBannerOnly from '../components/HeaderBannerOnly';
import { useAppSelector } from '../store/hooks';

/**
 * DefaultLayout Component
 * [WHY] Standard wrapper for page templates, including Header and main body layout.
 */
const DefaultLayout = ({ children, hideHeader = false }) => {
    const { user } = useAppSelector(state => state.auth);

    // [WHY] Admin should always see the header for navigation purposes,
    // even on typically full-screen specialized pages like Kitchen or Billing.
    const shouldHide = user?.role === 'admin' ? false : hideHeader;

    return (
        <div className="min-h-screen bg-gray-50">
            {shouldHide ? <HeaderBannerOnly /> : <Header />}
            <main>{children}</main>
        </div>
    );
};

export default DefaultLayout;
