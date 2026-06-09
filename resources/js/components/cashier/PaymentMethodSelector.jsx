import { useCallback, useMemo } from 'react';
import Icon from '../shared/Icon';

const PaymentMethodSelector = ({ paymentMethod, onSelect, isGroup, isProcessing = false }) => {
    const handlePaymentMethodChange = useCallback((key) => {
        if (isProcessing) return;
        onSelect(key);
    }, [onSelect, isProcessing]);

    const methods = useMemo(() => [
        { key: 'cash', label: 'Tiền mặt', icon: 'dollarSign' },
        { key: 'bank', label: 'Chuyển khoản', icon: 'qrCode' },
        { key: 'card', label: 'Cà thẻ', icon: 'creditCard' },
        ...(isGroup ? [{ key: 'debt', label: 'Công nợ', icon: 'clipboardList' }] : []),
        { key: 'split', label: 'Hỗn hợp', icon: 'layoutGrid' }
    ], [isGroup]);

    return (
        <div className="px-6 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Phương thức thanh toán</p>
            <div className="flex gap-2">
                {methods.map(({ key, label, icon }) => (
                    <button
                        key={key}
                        disabled={isProcessing}
                        onClick={() => handlePaymentMethodChange(key)}
                        className={`flex-1 flex justify-center items-center gap-1 py-2 px-2 rounded-xl border transition-all duration-150 ${
                            isProcessing
                                ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-300 border-gray-100'
                                : paymentMethod === key
                                    ? 'border-orange-500 bg-orange-50 text-orange-600 cursor-pointer'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-orange-200 hover:text-gray-600 cursor-pointer'
                        }`}
                    >
                        <Icon name={icon} className="w-5 h-5" size={20} />
                        <span className="text-[9px] font-black uppercase tracking-wide leading-tight text-center">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PaymentMethodSelector;
