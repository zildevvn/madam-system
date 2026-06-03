import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import toast from 'react-hot-toast';
import Icon from './shared/Icon';
import { fetchTodayAttendanceStatus, setTodayStatus } from '../store/slices/attendanceSlice';
import ConfirmDialog from './shared/ConfirmDialog';
import { attendanceApi } from '../services/attendanceApi';

export default function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.auth);
    const { todayStatus } = useAppSelector(state => state.attendance);
    const attendanceEnabled = useAppSelector(state => state.settings.settings.attendance_enabled);

    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

    useEffect(() => {
        if (attendanceEnabled === 'true' && user && user.role === ROLES.ORDER_STAFF) {
            dispatch(fetchTodayAttendanceStatus());
        }
    }, [user, dispatch, attendanceEnabled]);

    const handleCheckoutRequest = () => {
        if (todayStatus === 'checkout_pending') {
            toast.error('Bạn đã gửi yêu cầu checkout rồi, đang chờ quản lý duyệt.');
            return;
        }
        if (todayStatus === 'checked_out') {
            toast.error('Bạn đã checkout hôm nay rồi.');
            return;
        }
        setShowCheckoutConfirm(true);
    };

    const executeCheckoutRequest = async () => {
        setShowCheckoutConfirm(false);
        try {
            const data = await attendanceApi.requestCheckout();
            toast.success(data.message || 'Đã gửi yêu cầu ra ca thành công');
            dispatch(setTodayStatus('checkout_pending'));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gửi yêu cầu ra ca thất bại');
        }
    };

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    // Business Logic - Offloaded to Custom Hook
    const {
        hasNewNotification,
        latestMessage,
        checkNotifications,
        socketSequence
    } = useNotificationSystem(user);

    // Navigation logic
    const navigation = useMemo(() => {
        if (!user) return [];
        if (user.role === ROLES.ADMIN) return NAVIGATION_ITEMS;
        return NAVIGATION_ITEMS
            .filter(item => item.roles && item.roles.includes(user.role))
            .map(item => {
                if (item.children) {
                    return {
                        ...item,
                        children: item.children.filter(child => !child.roles || child.roles.includes(user.role))
                    };
                }
                return item;
            });
    }, [user]);

    const isActive = useCallback(
        (path) => matchRoute(location.pathname, path),
        [location.pathname]
    );

    // Layout configuration
    const isFixedLayout = matchAnyRoute(location.pathname, FIXED_LAYOUT_ROUTES);
    const showBanner = matchAnyRoute(location.pathname, BANNER_PAGES) && hasNewNotification && latestMessage;

    // Side effect: manage layout data attribute on document element
    useEffect(() => {
        document.documentElement.dataset.hasBanner = showBanner ? 'true' : 'false';
        return () => {
            document.documentElement.removeAttribute('data-has-banner');
        };
    }, [showBanner]);

    const handleLogout = useCallback(() => {
        dispatch(logout());
        navigate('/');
    }, [dispatch, navigate]);

    return (
        <>
            <header className={`bg-white/95 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-100 transition-all duration-300 ${isFixedLayout || showBanner ? 'shadow-sm' : 'shadow-none'}`}>
                {showBanner && <HeaderBanner key={`header-banner-${latestMessage?.id}-${socketSequence}`} />}
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
                                {attendanceEnabled === 'true' && user.role === ROLES.ORDER_STAFF && todayStatus !== null && (
                                    <button
                                        type="button"
                                        onClick={handleCheckoutRequest}
                                        className={`btn-status-today cursor-pointer px-2 sm:px-2.5 h-7 sm:h-8 flex items-center gap-1 rounded-lg font-black text-[9px] sm:text-[10px] uppercase transition-all active:scale-95 border ${todayStatus === 'checkout_pending'
                                            ? 'bg-amber-50 border-amber-200/50 text-amber-600'
                                            : todayStatus === 'checked_out'
                                                ? 'bg-emerald-50 border-emerald-200/50 text-emerald-600'
                                                : 'bg-red-50 border-red-200/40 text-red-600 hover:bg-red-100'
                                            }`}
                                    >
                                        <Icon name="logout" size={12} className="flex-shrink-0" />
                                        <span className="truncate">
                                            {todayStatus === 'checkout_pending' ? 'Chờ duyệt' : todayStatus === 'checked_out' ? 'Đã ra ca' : 'Ra Ca'}
                                        </span>
                                    </button>
                                )}

                                {![ROLES.BAR, ROLES.ORDER_STAFF].includes(user.role) && (
                                    <button
                                        type="button"
                                        onClick={() => setIsMessageModalOpen(true)}
                                        className="btn-messages cursor-pointer w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-100/50 hover:bg-slate-200/50 text-slate-600 hover:text-slate-900 transition-all active:scale-95 border border-slate-200/40"
                                        aria-label="Messages"
                                    >
                                        <Icon name="message" className="w-[18px] h-[18px] md:w-5 md:h-5" size={18} />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setIsNotificationModalOpen(true)}
                                    aria-label="Notifications"
                                    className={`btn-notifications cursor-pointer w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 border relative ${hasNewNotification
                                        ? 'bg-orange-50 border-orange-200/50 text-orange-600 hover:bg-orange-100/80 hover:text-orange-700 shadow-sm shadow-orange-500/10'
                                        : 'bg-slate-100/50 border-slate-200/40 text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                                        }`}
                                >
                                    <Icon name="bell" className="w-5 h-5 md:w-6 md:h-6" size={20} />
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

            <ConfirmDialog
                isOpen={showCheckoutConfirm}
                title="Yêu cầu ra ca"
                message="Bạn có chắc chắn muốn yêu cầu ra ca (checkout) hôm nay không?"
                confirmText="Yêu cầu ra ca"
                cancelText="Hủy"
                type="warning"
                onConfirm={executeCheckoutRequest}
                onCancel={() => setShowCheckoutConfirm(false)}
            />
        </>
    );
}
