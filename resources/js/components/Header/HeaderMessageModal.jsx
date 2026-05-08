import React, { useState } from 'react';
import { createSystemMessageApi } from '../../services/systemMessageService';
import { useAppSelector } from '../../store/hooks';
import toast from 'react-hot-toast';

const HeaderMessageModal = ({ isOpen, onClose, onSuccess }) => {
    const [message, setMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const { user } = useAppSelector(state => state.auth);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        try {
            setProcessing(true);
            await createSystemMessageApi({
                content: message,
                user_id: user.id
            });
            toast.success('Message broadcasted successfully');
            setMessage('');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col font-primary">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Message Content</label>
                        <div className="relative group">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent rounded-[24px] p-5 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 transition-all min-h-[200px] resize-none text-[15px] leading-relaxed shadow-inner"
                                placeholder="Write your message here..."
                                required
                                autoFocus
                            />
                            <div className="absolute bottom-4 right-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                {message.length} Characters
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 py-4 bg-orange-500 text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {processing ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Send Message</span>
                                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HeaderMessageModal;
