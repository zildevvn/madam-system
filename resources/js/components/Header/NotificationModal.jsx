import React, { useState, useEffect } from 'react';
import { getSystemMessagesApi, markSystemMessageAsReadApi } from '../../services/systemMessageService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAppSelector } from '../../store/hooks';

const NotificationModal = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAppSelector(state => state.auth);

    useEffect(() => {
        if (isOpen && user) {
            fetchMessages();
        }
    }, [isOpen, user]);

    const fetchMessages = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const response = await getSystemMessagesApi(user.id);
            setMessages(response.data || []);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (messageId) => {
        if (!user) return;
        
        // Optimistic UI update
        setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, is_read: true } : msg
        ));

        try {
            await markSystemMessageAsReadApi(messageId, user.id);
        } catch (error) {
            console.error('Failed to mark message as read:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col font-primary max-h-[85vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-slate-900 font-black uppercase tracking-[0.2em] text-[13px]">Notifications</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">System-wide updates</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchMessages}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all border border-slate-100"
                            title="Refresh"
                        >
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-slate-50/30">
                    {loading && messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-10 h-10 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin"></div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div 
                                    key={msg.id} 
                                    onClick={() => !msg.is_read && handleMarkAsRead(msg.id)}
                                    className={`p-6 rounded-[24px] border transition-all group cursor-pointer relative overflow-hidden ${
                                        msg.is_read 
                                        ? 'bg-white border-slate-100 shadow-sm hover:shadow-md' 
                                        : 'bg-orange-50/30 border-orange-100 shadow-md ring-1 ring-orange-500/10'
                                    }`}
                                >
                                    {!msg.is_read && (
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                                    )}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-black shadow-lg ${
                                                msg.is_read ? 'bg-slate-400 shadow-slate-400/20' : 'bg-orange-500 shadow-orange-500/20'
                                            }`}>
                                                {msg.user?.name?.[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{msg.user?.name}</h4>
                                                    {!msg.is_read && (
                                                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{msg.user?.role}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className={`text-[15px] leading-relaxed font-medium whitespace-pre-wrap ${
                                        msg.is_read ? 'text-slate-500' : 'text-slate-800'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-50 bg-white">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                    >
                        Close Notifications
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;
