import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import LogoImg from '../../images/Logo.png';
import { ROLES } from '../shared/constants/roles';
import NavItem from './Header/NavItem';
import HeaderMessageModal from './Header/HeaderMessageModal';
import NotificationModal from './Header/NotificationModal';
import { getSystemMessagesApi } from '../services/systemMessageService';

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [hasNewNotification, setHasNewNotification] = useState(false);

    useEffect(() => {
        // Initial check for recent messages (last 10 minutes)
        const checkRecentMessages = async () => {
            try {
                const response = await getSystemMessagesApi();
                const latestMsg = response.data?.[0];
                if (latestMsg) {
                    const msgTime = new Date(latestMsg.created_at).getTime();
                    const now = new Date().getTime();
                    const diff = (now - msgTime) / (1000 * 60);
                    if (diff < 10) {
                        setHasNewNotification(true);
                    }
                }
            } catch (error) {
                console.error('Error checking recent messages:', error);
            }
        };

        checkRecentMessages();

        // Real-time listener
        if (window.Echo) {
            const channel = window.Echo.channel('system-notifications');
            channel.listen('.new-message', (e) => {
                setHasNewNotification(true);
            });
            return () => window.Echo.leaveChannel('system-notifications');
        }
    }, []);

    // Timer to reset notification state after 10 minutes
    useEffect(() => {
        if (hasNewNotification) {
            const timer = setTimeout(() => {
                // Double check if there's really no message in the last 10 mins
                // (in case the tab was inactive)
                setHasNewNotification(false);
            }, 10 * 60 * 1000);
            return () => clearTimeout(timer);
        }
    }, [hasNewNotification]);

    const { user } = useAppSelector(state => state.auth);

    const navigation = React.useMemo(() => {
        const baseNav = [
            {
                name: 'Admin',
                href: '/admin',
                roles: [],
                children: [
                    { name: 'Nhân sự', href: '/admin/personnel' },
                    { name: 'Quản Lý Bàn', href: '/admin/tables' },
                    { name: 'Quản Lý Menu', href: '/admin/products' },

                ]
            },
            { name: 'Staff Order', href: '/staff-order', roles: [ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER] },
            { name: 'Kitchen', href: '/kitchen', roles: [ROLES.KITCHEN] },
            { name: 'Bar', href: '/bar', roles: [ROLES.BAR] },
            { name: 'Bills', href: '/bills', roles: [ROLES.BILL] },
            { name: 'Cashier', href: '/cashier', roles: [ROLES.CASHIER] },
            { name: 'Reservations', href: '/reservations', roles: [ROLES.MANAGER, ROLES.ORDER_STAFF, ROLES.SELLER] },
            { name: 'Expense Management', href: '/expenses', roles: [ROLES.CASHIER] },
        ];

        if (!user) return [];

        if (user.role === ROLES.ADMIN) return baseNav;
        return baseNav.filter(item => item.roles.includes(user.role));
    }, [user]);

    const isActive = (path) => {
        if (!path || path === '#') return false;
        return location.pathname + location.search === path || location.pathname === path;
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const isFixedLayout = location.pathname === '/staff-order' || location.pathname === '/bills' || location.pathname === '/cashier' || location.pathname === '/kitchen' || location.pathname === '/bar';

    return (
        <>
            <header className={`bg-white/90 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-100 transition-all duration-300 ${isFixedLayout ? 'shadow-sm' : 'shadow-none'}`}>
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
                                <button
                                    type="button"
                                    onClick={() => setIsMessageModalOpen(true)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all active:scale-95 border border-slate-100"
                                    aria-label="Messages"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsNotificationModalOpen(true)}
                                    className="btn-notifications p-2 text-slate-400 hover:text-slate-900 transition-colors relative"
                                    aria-label="Notifications"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                    </svg>
                                    {hasNewNotification && (
                                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(true)}
                                    className="flex flex-col justify-center items-center w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all active:scale-95 border border-slate-100"
                                    aria-label="Open menu"
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

            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[50] transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside className={`fixed top-0 right-0 h-full w-[280px] md:w-[320px] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* User Profile */}
                    {user && (
                        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-sm font-black">
                                    {user.name?.[0].toUpperCase() || 'U'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{user.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user.role}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSidebarOpen(false)}
                                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-400 hover:text-slate-900 hover:shadow-sm transition-all border border-slate-100"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex-1 py-4 overflow-y-auto no-scrollbar">
                        {navigation.map((item) => (
                            <NavItem
                                key={item.name}
                                item={item}
                                isActive={isActive}
                                setSidebarOpen={setSidebarOpen}
                            />
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="mdt-btn w-full"
                        >
                            <span className="relative z-10 mr-1">Log Out</span>
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>
            <HeaderMessageModal
                isOpen={isMessageModalOpen}
                onClose={() => setIsMessageModalOpen(false)}
            />
            <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
            />
        </>
    );
}
