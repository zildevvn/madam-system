import React from 'react';

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
    activeOrderId
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
                            {new Intl.NumberFormat('vi-VN').format(total)}đ
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    {!isConfirmed && (
                        <button
                            onClick={handleCancelOrder}
                            className="btn-cancel mdt-btn w-full"
                        >
                            Hủy Bàn
                        </button>
                    )}
                    <button
                        onClick={() => navigate(`/order/${tableId}`)}
                        className="btn-add mdt-btn-outline w-full"
                    >
                        <svg width="18px" height="18px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6 12H12M18 12H12M12 12V6M12 12V18" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        Thêm
                    </button>
                    <button
                        onClick={handleCheckout}
                        disabled={!hasItems || (isConfirmed && !isModified && !isTableChanged && !isMergeChanged)}
                        className={`btn-save mdt-btn w-full ${(!hasItems || (isConfirmed && !isModified && !isTableChanged && !isMergeChanged)) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                        <svg width="18px" height="18px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#fff"><path d="M3 19V5C3 3.89543 3.89543 3 5 3H16.1716C16.702 3 17.2107 3.21071 17.5858 3.58579L20.4142 6.41421C20.7893 6.78929 21 7.29799 21 7.82843V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z" stroke="#fff" strokeWidth="1.5"></path><path d="M8.6 9H15.4C15.7314 9 16 8.73137 16 8.4V3.6C16 3.26863 15.7314 3 15.4 3H8.6C8.26863 3 8 3.26863 8 3.6V8.4C8 8.73137 8.26863 9 8.6 9Z" stroke="#fff" strokeWidth="1.5"></path><path d="M6 13.6V21H18V13.6C18 13.2686 17.7314 13 17.4 13H6.6C6.26863 13 6 13.2686 6 13.6Z" stroke="#fff" strokeWidth="1.5"></path></svg>
                        {activeOrderId ? 'Update' : 'Lưu'}
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default React.memo(CheckoutFooter);
