import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import LogoImg from '../../images/Logo.png';
import { ROLES } from '../shared/constants/roles';
import HeaderMessageModal from './Header/HeaderMessageModal';
import NotificationModal from './Header/NotificationModal';
import HeaderBanner from './Header/HeaderBanner';
import Sidebar from './Header/Sidebar';
import { useNotificationSystem } from '../hooks/useNotificationSystem';
import { NAVIGATION_ITEMS, BANNER_PAGES, FIXED_LAYOUT_ROUTES } from '../config/navigation';
import { matchRoute, matchAnyRoute } from '../shared/utils/routeUtils';

export default function Header({ onlyBanner = false }) {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.auth);
    
    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    // Business Logic - Offloaded to Custom Hook
    const {
        hasNewNotification,
        latestMessage,
        checkNotifications
    } = useNotificationSystem(user);

    // Navigation logic
    const navigation = useMemo(() => {
        if (!user) return [];
        if (user.role === ROLES.ADMIN) return NAVIGATION_ITEMS;
        return NAVIGATION_ITEMS.filter(item => item.roles.includes(user.role));
    }, [user]);

    const isActive = (path) => matchRoute(location.pathname, path);

    // Layout configuration
    const isFixedLayout = matchAnyRoute(location.pathname, FIXED_LAYOUT_ROUTES);
    const showBanner = matchAnyRoute(location.pathname, BANNER_PAGES) && hasNewNotification && latestMessage;

    // Side effect: manage layout class on body
    useEffect(() => {
        if (showBanner) {
            document.body.classList.add('has-marquee');
        } else {
            document.body.classList.remove('has-marquee');
        }
        return () => document.body.classList.remove('has-marquee');
    }, [showBanner]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    if (onlyBanner) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[100] font-primary">
                {showBanner && <HeaderBanner key={latestMessage?.id} />}
            </div>
        );
    }

    return (
        <>
            <header className={`bg-white/95 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-100 transition-all duration-300 ${isFixedLayout || showBanner ? 'shadow-sm' : 'shadow-none'}`}>
                {showBanner && <HeaderBanner key={latestMessage?.id} />}
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        <div className="flex">
                            <Link to="/" className="flex items-center group">
                                <img
                                    src={LogoImg}
                                    alt="logo"
                                    className="w-auto h-12 md:h-14 group-hover:opacity-80 transition-opacity duration-300"
                                />
                            </Link>
                        </div>

                        {user && (
                            <div className="flex items-center gap-2 md:gap-4">
                                {![ROLES.BAR, ROLES.ORDER_STAFF].includes(user.role) && (
                                    <button
                                        type="button"
                                        onClick={() => setIsMessageModalOpen(true)}
                                        className="btn-messages cursor-pointer w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-100/50 hover:bg-slate-200/50 text-slate-600 hover:text-slate-900 transition-all active:scale-95 border border-slate-200/40"
                                        aria-label="Messages"
                                    >
                                        <svg width="18" height="18" className="md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setIsNotificationModalOpen(true)}
                                    className={`btn-notifications cursor-pointer w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 border relative ${hasNewNotification
                                        ? 'bg-orange-50 border-orange-200/50 text-orange-600 hover:bg-orange-100/80 hover:text-orange-700 shadow-sm shadow-orange-500/10'
                                        : 'bg-slate-100/50 border-slate-200/40 text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                                        }`}
                                    aria-label="Notifications"
                                >
                                    <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                    </svg>
                                    {hasNewNotification && (
                                        <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white animate-pulse shadow-sm shadow-orange-500/50"></span>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(true)}
                                    className="flex flex-col justify-center items-center w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all active:scale-95 border border-slate-100"
                                    aria-label="Open menu"
                                    aria-expanded={sidebarOpen}
                                    aria-controls="main-sidebar"
                                >
                                    <div className="space-y-1">
                                        <span className="block w-5 h-0.5 bg-current rounded-full"></span>
                                        <span className="block w-5 h-0.5 bg-current rounded-full"></span>
                                        <span className="block w-5 h-0.5 bg-current rounded-full"></span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <Sidebar 
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
                navigation={navigation}
                isActive={isActive}
                onLogout={handleLogout}
            />

            <HeaderMessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
                onSuccess={checkNotifications}
            />
            <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => {
                    setIsNotificationModalOpen(false);
                    checkNotifications();
                }}
                onUpdate={checkNotifications}
            />
        </>
    );
}
