import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import NavItem from './NavItem';

/**
 * Sidebar Component
 * [WHY] Separates the complex off-canvas navigation and user profile UI 
 * from the main Header to improve SRP and maintainability.
 */
const Sidebar = ({ 
    isOpen, 
    onClose, 
    user, 
    navigation, 
    isActive, 
    onLogout,
    id = 'main-sidebar'
}) => {
    // [ACCESSIBILITY] Close on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            // Prevent scrolling when sidebar is open
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[50] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Sidebar Content */}
            <aside 
                id={id}
                role="dialog"
                aria-modal="true"
                aria-label="Main Navigation Sidebar"
                aria-hidden={!isOpen}
                className={`fixed top-0 right-0 h-full w-[280px] md:w-[320px] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    {/* User Profile */}
                    {user && (
                        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
                            <Link 
                                to="/profile" 
                                onClick={onClose}
                                className="flex items-center gap-3 hover:opacity-85 transition-opacity group cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-sm font-black overflow-hidden ring-2 ring-orange-100 group-hover:scale-105 transition-all">
                                    {user.photo ? (
                                        <img src={`/storage/${user.photo}`} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        user.name?.[0].toUpperCase() || 'U'
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight group-hover:text-orange-500 transition-colors">{user.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user.role}</p>
                                </div>
                            </Link>

                            <button
                                type="button"
                                onClick={onClose}
                                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-400 hover:text-slate-900 hover:shadow-sm transition-all border border-slate-100"
                                aria-label="Close sidebar"
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
                                setSidebarOpen={onClose}
                            />
                        ))}
                    </nav>

                    {/* Footer / Logout */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={onLogout}
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
};

export default Sidebar;
