import React from 'react';
import Icon from './Icon';

/**
 * ConfirmDialog Component
 * [WHY] An elegant, non-blocking, completely customizable confirmation dialog.
 * Replaces native window.confirm with beautiful premium UI matching the app's aesthetics.
 */
export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Huỷ',
    type = 'warning', // 'warning', 'danger', 'info'
    onConfirm,
    onCancel
}) {
    if (!isOpen) return null;

    const typeConfig = {
        danger: {
            bg: 'bg-rose-50',
            border: 'border-rose-100',
            text: 'text-rose-600',
            icon: 'xCircle',
            btnBg: 'mdt-bg-primary',
        },
        warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            text: 'text-amber-600',
            icon: 'alert',
            btnBg: 'bg-amber-600 hover:bg-amber-700',
        },
        info: {
            bg: 'bg-slate-50',
            border: 'border-slate-100',
            text: 'text-slate-600',
            icon: 'user',
            btnBg: 'bg-slate-900 hover:bg-slate-800',
        }
    };

    const config = typeConfig[type] || typeConfig.warning;

    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] border border-slate-100 shadow-md p-6 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
                {/* Status Icon */}
                <div className={`w-12 h-12 rounded-3xl ${config.bg} flex items-center justify-center mx-auto ${config.text} shadow-sm border ${config.border}`}>
                    <Icon name={config.icon} size={22} />
                </div>

                {/* Title & message */}
                <div className="space-y-2">
                    <h5 className=" text-slate-800 uppercase tracking-tight">
                        {title}
                    </h5>

                    <p className="text-[12px] text-slate-600 leading-relaxed px-2">
                        {message}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-black uppercase transition-all duration-150 border-none cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 py-3 ${config.btnBg} text-white rounded-md text-xs font-black uppercase shadow-lg active:scale-95 transition-all duration-150 border-none cursor-pointer`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
