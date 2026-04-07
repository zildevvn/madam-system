import React from 'react';

const PaymentMethodSelector = ({ paymentMethod, setPaymentMethod }) => {
    const methods = [
        { key: 'cash', label: 'Tiền mặt', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
        { key: 'bank', label: 'Chuyển khoản', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /> },
        { key: 'card', label: 'Cà thẻ', icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6" /></> },
    ];

    return (
        <div className="px-6 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Phương thức thanh toán</p>
            <div className="flex gap-2">
                {methods.map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => setPaymentMethod(key)}
                        className={`flex-1 flex justify-center items-center gap-1 py-2 px-2 rounded-xl border transition-all duration-150 cursor-pointer ${paymentMethod === key
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-orange-200 hover:text-gray-600'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
                        <span className="text-[9px] font-black uppercase tracking-wide leading-tight text-center">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PaymentMethodSelector;
