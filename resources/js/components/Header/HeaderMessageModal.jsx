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
            <div className="bg-white rounded-[12px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col font-primary">
                {/* Header */}
                <div className="px-4 py-3.5 md:px-6 md:py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h4 className="text-slate-900 font-black uppercase tracking-[0.15em]">New message</h4>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-slate-200 text-slate-600 transition-all cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
                    <div className="space-y-2 md:space-y-2.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Message</label>
                        <div className="relative group">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full bg-slate-200 border-2 border-transparent rounded-[16px] md:rounded-[20px] p-3.5 md:p-4 text-slate-900 placeholder:text-slate-900 transition-all min-h-[140px] md:min-h-[160px] resize-none text-[14px] leading-relaxed"
                                placeholder="Enter your message..."
                                required
                                autoFocus
                            />
                            <div className="absolute bottom-3 right-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                {message.length} chars
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 md:gap-3 pt-0 md:pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="cursor-pointer flex-1 py-3 md:py-3.5 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="cursor-pointer flex-[1.5] py-3 md:py-3.5 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {processing ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Send</span>
                                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
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
