import React from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';
import Icon from '../shared/Icon';

const CheckoutFooter = ({ 
    totalQuantity, 
    total, 
    isConfirmed, 
    isModified, 
    isTableChanged, 
    isMergeChanged,
    handleCancelOrder, 
    navigate, 
    tableId, 
    handleCheckout, 
    hasItems,
    activeOrderId,
    isSaving,
    isSplitMode,
    toggleSplitMode,
    selectedSplitItems,
    onConfirmSplit
}) => {
    return (
        <footer className="fixed bottom-0 left-0 w-full px-2 py-4 bg-white/85 bg-white z-50 rounded-t-2xl shadow-[0_-4px_40px_rgba(49,50,52,0.06)]">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-end mb-4">
                    <span className="font-extrabold label-md text-on-surface-variant uppercase tracking-wider">
                        Số lượng: {totalQuantity}
                    </span>
                    <div className="flex flex-col items-end mt-1">
                        <span className="text-xl font-extrabold text-on-surface">
                            {formatPrice(total)}đ
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    {isSplitMode ? (
                        <>
                            <button
                                onClick={toggleSplitMode}
                                className="btn-cancel mdt-btn-outline w-full text-xs"
                            >
                                Hủy tách
                            </button>
                            <button
                                onClick={onConfirmSplit}
                                disabled={selectedSplitItems.length === 0 || isSaving}
                                className={`btn-save mdt-btn w-full text-xs transition-all ${(selectedSplitItems.length === 0 || isSaving) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                {isSaving ? 'Đang tách...' : 'Xác nhận tách'}
                            </button>
                        </>
                    ) : (
                        <>
                            {!isConfirmed && (
                                <button
                                    onClick={handleCancelOrder}
                                    className="btn-cancel mdt-btn w-full text-xs"
                                >
                                    Hủy Bàn
                                </button>
                            )}

                            {isConfirmed && (
                                <button
                                    onClick={toggleSplitMode}
                                    className="btn-split mdt-btn-outline w-full text-xs"
                                >
                                    Tách Bill
                                </button>
                            )}

                            <button
                                onClick={() => navigate(`/order/${tableId}`)}
                                className="btn-add mdt-btn-outline w-full text-xs flex items-center justify-center gap-1"
                            >
                                <Icon name="plus" className="w-4 h-4" size={16} />
                                Thêm
                            </button>
                            <button
                                onClick={handleCheckout}
                                disabled={!hasItems || isSaving || (isConfirmed && !isModified && !isTableChanged && !isMergeChanged)}
                                className={`btn-save mdt-btn w-full text-xs transition-all ${(!hasItems || isSaving || (isConfirmed && !isModified && !isTableChanged && !isMergeChanged)) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                {isSaving ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Đang xử lý...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-1">
                                        <Icon name="save" className="w-4 h-4 text-white" size={16} />
                                        <span>{activeOrderId ? 'Update' : 'Lưu'}</span>
                                    </div>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default React.memo(CheckoutFooter);
