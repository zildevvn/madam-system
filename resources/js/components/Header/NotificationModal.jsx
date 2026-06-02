import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNotificationsAsync, markNotificationAsReadAsync } from '../../store/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Icon from '../shared/Icon';

const NotificationModal = ({ isOpen, onClose, onUpdate }) => {
    const dispatch = useAppDispatch();
    const messages = useAppSelector(state => state.notification.messages);
    const status = useAppSelector(state => state.notification.status);
    const loading = status === 'loading';
    const { user } = useAppSelector(state => state.auth);

    useEffect(() => {
        if (isOpen && user) {
            dispatch(fetchNotificationsAsync(user.id));
        }
    }, [isOpen, user, dispatch]);

    const handleMarkAsRead = async (messageId) => {
        if (!user) return;
        dispatch(markNotificationAsReadAsync({ messageId, userId: user.id }));
        if (onUpdate) onUpdate();
    };

    const handleRefresh = () => {
        if (user) {
            dispatch(fetchNotificationsAsync(user.id));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[24px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col font-primary max-h-[80vh]">
                {/* Header */}
                <div className="px-4 py-3.5 md:px-6 md:py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h4 className="text-slate-900 font-black uppercase tracking-[0.15em]">Notifications</h4>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3">
                        <button
                            onClick={handleRefresh}
                            className="cursor-pointer w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:text-orange-500 hover:bg-orange-50 transition-all border border-slate-100 active:scale-90"
                            title="Refresh"
                        >
                            <Icon name="refresh" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} size={16} strokeWidth={3} />
                        </button>
                        <button
                            onClick={onClose}
                            className="cursor-pointer w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100 active:scale-90"
                        >
                            <Icon name="close" className="w-4 h-4" size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 bg-slate-50/30">
                    {loading && messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 md:py-20 space-y-4">
                            <div className="w-9 h-9 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 md:py-20 space-y-4">
                            <div className="w-14 h-14 bg-slate-100 rounded-[20px] flex items-center justify-center text-slate-300">
                                <Icon name="inbox" className="w-7 h-7" size={28} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3 md:space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    onClick={() => !msg.is_read && handleMarkAsRead(msg.id)}
                                    className={`p-4 md:p-5 rounded-[10px] border transition-all group cursor-pointer relative overflow-hidden ${msg.is_read
                                        ? 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                                        : 'bg-orange-50/20 border-orange-100 shadow-md ring-1 ring-orange-500/5'
                                        }`}
                                >
                                    {!msg.is_read && (
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                                    )}
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div className="flex items-center gap-2.5 md:gap-3">
                                            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-white text-[11px] md:text-[13px] font-black shadow-lg ${msg.is_read ? 'bg-slate-400 shadow-slate-400/20' : 'bg-orange-500 shadow-orange-500/20'
                                                }`}>
                                                {msg.user?.name?.[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 md:gap-2">
                                                    <h6 className="font-black text-slate-900 uppercase tracking-tight leading-none">{msg.user?.name}</h6>
                                                    {!msg.is_read && (
                                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                                                    )}
                                                </div>

                                            </div>
                                        </div>
                                        <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className={`text-[13px] md:text-[15px] leading-relaxed font-medium whitespace-pre-wrap ${msg.is_read ? 'text-slate-500' : 'text-slate-700'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-slate-50 bg-white">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 md:py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
