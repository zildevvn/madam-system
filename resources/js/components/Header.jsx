import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import LogoImg from '../../images/Logo.png';

const NavItem = ({ item, isActive, setSidebarOpen }) => {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = item.children && item.children.length > 0;

    const toggleExpand = (e) => {
        if (hasChildren) {
            e.preventDefault();
            setExpanded(!expanded);
        }
    };

    const isAnyChildActive = hasChildren && item.children.some(child => isActive(child.href));

    return (
        <div className="flex flex-col">
            <Link
                to={hasChildren ? '#' : item.href}
                onClick={(e) => {
                    if (hasChildren) {
                        toggleExpand(e);
                    } else {
                        setSidebarOpen(false);
                    }
                }}
                className={`flex items-center justify-between px-6 py-4 text-sm font-bold transition-all duration-300 group rounded-none border-r-2 ${isActive(item.href) || isAnyChildActive
                    ? 'bg-orange-50/50 text-orange-600 border-orange-500'
                    : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-semibold'
                    }`}
            >
                <span className="flex items-center gap-3">
                    {item.name}
                </span>
                {hasChildren && (
                    <div className={`p-1 rounded-lg transition-colors ${expanded ? 'bg-orange-100 text-orange-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        <svg
                            className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3.5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                )}
            </Link>

            {hasChildren && (
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-60' : 'max-h-0'}`}>
                    <div className="bg-slate-50/20 flex flex-col py-1 ml-4 border-l border-slate-100">
                        {item.children.map((child) => {
                            const childActive = isActive(child.href);
                            return (
                                <Link
                                    key={child.name}
                                    to={child.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center pl-4 pr-4 py-3 text-[13px] font-bold transition-all duration-200 relative group ${childActive
                                        ? 'text-orange-600'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    {childActive && (
                                        <div className="absolute left-0 w-1 h-4 bg-orange-500 rounded-r-full" />
                                    )}
                                    {child.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { user } = useAppSelector(state => state.auth);

    const getNavigation = () => {
        const baseNav = [
            {
                name: 'Admin',
                href: '/admin',
                roles: [],
                children: [
                    { name: 'Nhân sự', href: '/admin?tab=personnel' },
                    { name: 'Quản Lý Bàn', href: '/admin?tab=tables' },
                    { name: 'Quản Lý Menu', href: '/admin?tab=products' },
                ]
            },
            { name: 'Staff Order', href: '/staff-order', roles: ['manager', 'order_staff', 'seller'] },
            { name: 'Kitchen', href: '/kitchen', roles: ['kitchen'] },
            { name: 'Bar', href: '/bar', roles: ['bar'] },
            { name: 'Bills', href: '/bills', roles: ['bill'] },
            { name: 'Cashier', href: '/cashier', roles: ['cashier'] },
            { name: 'Reservations', href: '/reservations', roles: ['manager', 'order_staff', 'seller'] },
        ];

        if (!user) return [];

        if (user.role === 'admin') return baseNav;
        return baseNav.filter(item => item.roles.includes(user.role));
    };

    const navigation = getNavigation();

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

                        <div className="flex items-center gap-2 md:gap-4">
                            <button
                                type="button"
                                className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                                aria-label="Notifications"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
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
        </>
    );
}
