import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import LogoImg from '../../images/Logo.png';

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { user } = useAppSelector(state => state.auth);

    const getNavigation = () => {
        const baseNav = [
            { name: 'Staff Order', href: '/staff-order', roles: ['order_staff'] },
            { name: 'Kitchen', href: '/kitchen', roles: ['kitchen'] },
            { name: 'Bills', href: '/bills', roles: ['order_staff', 'cashier'] },
            { name: 'Cashier', href: '/cashier', roles: ['cashier'] },
            { name: 'Admin', href: '/admin', roles: [] },
        ];
        
        if (!user) return [];
        
        if (user.role === 'admin') return baseNav;
        return baseNav.filter(item => item.roles.includes(user.role));
    };

    const navigation = getNavigation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };
    const isStaffOrder = location.pathname === '/staff-order' || location.pathname === '/bills' || location.pathname === '/cashier';

    return (
        <>
            <header className={`bg-white shadow ${isStaffOrder ? 'is-fixed' : ''}`}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <div className="flex h-auto">
                            <Link to="/" className="flex items-center">
                                <img src={LogoImg} alt="logo" className="w-full max-w-[70px] md:max-w-[100px] h-auto" />
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center mr-2">
                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(true)}
                                    className="btn-hamburger flex flex-col justify-center items-center w-10 h-10 p-2 bg-transparent border-none rounded-lg cursor-pointer gap-[5px] transition-all duration-300 ease-in-out hover:bg-black/5"
                                >
                                    <span className="block w-[22px] h-[2px] bg-gray-600 rounded-sm transition-all duration-300 ease-in-out"></span>
                                    <span className="block w-[22px] h-[2px] bg-gray-600 rounded-sm transition-all duration-300 ease-in-out"></span>
                                    <span className="block w-[22px] h-[2px] bg-gray-600 rounded-sm transition-all duration-300 ease-in-out"></span>
                                </button>
                            </div>

                            <div className="flex items-center cursor-pointer transition-opacity duration-300 ease-in-out hover:opacity-60">
                                <svg width="24px" height="24px" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path fillRule="evenodd" clipRule="evenodd" d="M14.752 1.91434C14.1218 2.7805 13.75 3.84683 13.75 5C13.75 7.83971 16.0046 10.1528 18.8214 10.247C18.8216 10.2508 18.8219 10.2546 18.8222 10.2583C18.8369 10.4557 18.852 10.6591 18.8726 10.855C19.1087 13.1025 19.6495 14.6443 20.1679 15.6582C20.5132 16.3334 20.8519 16.781 21.0922 17.0516C21.2125 17.1871 21.3088 17.2788 21.3696 17.3328C21.4 17.3599 21.4216 17.3775 21.4329 17.3865L21.4416 17.3933C21.7027 17.5833 21.8131 17.9196 21.7147 18.2278C21.6154 18.5386 21.3265 18.7496 21.0002 18.7496L3.00005 18.75C2.67373 18.75 2.38485 18.539 2.28559 18.2281C2.18718 17.9199 2.29755 17.5837 2.55863 17.3937L2.56735 17.3869C2.57869 17.3779 2.60028 17.3602 2.63069 17.3332C2.69148 17.2792 2.7877 17.1875 2.90804 17.052C3.14835 16.7814 3.48701 16.3338 3.8323 15.6585C4.52142 14.3109 5.25005 12.0306 5.25005 8.4C5.25005 6.51876 5.95021 4.70561 7.21026 3.36156C8.47184 2.01587 10.1937 1.25 12.0001 1.25C12.3823 1.25 12.7613 1.28434 13.1331 1.35139C13.3707 1.39421 14.1514 1.63742 14.752 1.91434Z" fill="#000000"></path><path fillRule="evenodd" clipRule="evenodd" d="M15.25 5C15.25 2.92893 16.9289 1.25 19 1.25C21.0711 1.25 22.75 2.92893 22.75 5C22.75 7.07107 21.0711 8.75 19 8.75C16.9289 8.75 15.25 7.07107 15.25 5Z" fill="#000000"></path><path fillRule="evenodd" clipRule="evenodd" d="M9.89369 20.3514C10.252 20.1435 10.7109 20.2655 10.9188 20.6238C11.0287 20.8132 11.1864 20.9705 11.3761 21.0798C11.5659 21.1891 11.781 21.2466 12 21.2466C12.219 21.2466 12.4342 21.1891 12.6239 21.0798C12.8137 20.9705 12.9714 20.8132 13.0813 20.6238C13.2891 20.2655 13.7481 20.1435 14.1063 20.3514C14.4646 20.5592 14.5866 21.0182 14.3788 21.3765C14.137 21.7932 13.7901 22.1391 13.3726 22.3796C12.9551 22.62 12.4818 22.7466 12 22.7466C11.5183 22.7466 11.0449 22.62 10.6275 22.3796C10.21 22.1391 9.86301 21.7932 9.62127 21.3765C9.41343 21.0182 9.5354 20.5592 9.89369 20.3514Z" fill="#000000"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-[300px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <span className="text-lg font-semibold text-gray-800">Menu</span>
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent border-none cursor-pointer hover:bg-gray-100 transition-all duration-200"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* User Info */}
                    {user && (
                        <div className="p-4 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">{user.role}</span>
                        </div>
                    )}

                    {/* Navigation Links */}
                    <nav className="flex-1 py-4 overflow-y-auto">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 ${isActive(item.href)
                                    ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-500'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors duration-200 border-none cursor-pointer"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
