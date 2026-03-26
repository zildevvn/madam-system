import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateQuantity, checkoutOrderAsync, cancelOrderAsync, updateItemNote, removeFromCart } from '../store/slices/orderSlice';
import { fetchTables } from '../store/slices/tableSlice';
import ProductItem from '../components/ProductItem';

export default function Checkout() {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { activeOrderId, orderStatus, isModified } = useAppSelector(state => state.order);
    const isConfirmed = orderStatus && orderStatus !== 'draft';
    const selectedItems = useAppSelector(state => state.order.items.allIds.map(id => state.order.items.byId[id]));
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const total = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const totalQuantity = selectedItems.reduce((acc, item) => acc + item.quantity, 0);

    const handleUpdateQuantity = (id, newQuantity) => {
        if (newQuantity === 0) {
            dispatch(removeFromCart(id));
        } else {
            dispatch(updateQuantity({ id, quantity: newQuantity }));
        }
    };

    const handleUpdateNote = (id, note) => {
        dispatch(updateItemNote({ id, note }));
    };

    const handleCheckout = async () => {
        if (!activeOrderId) return;
        try {

            await dispatch(checkoutOrderAsync({
                orderId: activeOrderId,
                items: selectedItems.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price, note: i.note }))
            })).unwrap();
            dispatch(fetchTables());

            setShowSuccessPopup(true);
            setTimeout(() => {
                setShowSuccessPopup(false);
                navigate('/staff-order');
            }, 1500);

        } catch (error) {
            alert("Lỗi khi thanh toán!");
        }
    };

    const handleCancelOrder = async () => {
        if (activeOrderId) {
            await dispatch(cancelOrderAsync(activeOrderId));
        }
        navigate('/staff-order');
    };

    React.useEffect(() => {
        const handleBeforeUnload = () => {
            if (activeOrderId) {
                navigator.sendBeacon(`/api/orders/${activeOrderId}`);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeOrderId]);

    return (
        <div className="mdt-bg-light mdt-checkout-page min-h-screen pb-40">
            <div className="w-full sticky top-0 z-50 bg-white">
                <div className="flex items-center justify-between px-2 py-4 w-full">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => isConfirmed ? navigate('/staff-order') : navigate(`/order/${tableId}`)}
                            className="mdt-btn-back p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                        >
                            <svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M21 12L3 12M3 12L11.5 3.5M3 12L11.5 20.5" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </button>

                        <h1 className="h6">{isConfirmed ? 'Chi tiết hóa đơn' : 'Tạo hóa đơn'}</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-[13px] font-semibold leading-none border border-gray-200">
                            Bàn số {tableId}
                        </span>
                    </div>
                </div>
            </div>

            <main className="px-2 pt-4 max-w-2xl mx-auto space-y-4">
                {/* Food Items List */}
                <div className="list-products bg-white rounded-md shadow-sm py-5 px-4 mb-4">
                    {selectedItems.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">Chưa có món nào được chọn</p>
                    ) : (
                        selectedItems.map((item) => (
                            <ProductItem
                                key={item.id}
                                item={item}
                                onUpdateQuantity={handleUpdateQuantity}
                                onUpdateNote={handleUpdateNote}
                                showNoteButton={true}
                            />
                        ))
                    )}
                </div>
            </main>

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
                            disabled={selectedItems.length === 0 || (isConfirmed && !isModified)}
                            className={`btn-save mdt-btn w-full ${(selectedItems.length === 0 || (isConfirmed && !isModified)) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                        >
                            <svg width="18px" height="18px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#fff"><path d="M3 19V5C3 3.89543 3.89543 3 5 3H16.1716C16.702 3 17.2107 3.21071 17.5858 3.58579L20.4142 6.41421C20.7893 6.78929 21 7.29799 21 7.82843V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z" stroke="#fff" strokeWidth="1.5"></path><path d="M8.6 9H15.4C15.7314 9 16 8.73137 16 8.4V3.6C16 3.26863 15.7314 3 15.4 3H8.6C8.26863 3 8 3.26863 8 3.6V8.4C8 8.73137 8.26863 9 8.6 9Z" stroke="#fff" strokeWidth="1.5"></path><path d="M6 13.6V21H18V13.6C18 13.2686 17.7314 13 17.4 13H6.6C6.26863 13 6 13.2686 6 13.6Z" stroke="#fff" strokeWidth="1.5"></path></svg>
                            Lưu
                        </button>
                    </div>
                </div>
            </footer>

            {/* Success Popup Notification */}
            {showSuccessPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center py-4 px-2">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"></div>
                    <div className="bg-white rounded-[20px] p-8 max-w-[280px] w-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex flex-col items-center text-center relative z-10 transition-all duration-300 animate-[pulse_0.3s_ease-out]">
                        <div className="w-[40px] h-[40px] bg-[#03b879]/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <svg className="w-5 h-5 text-[#03b879]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h5 className="text-[20px] mb-2">Thành công!</h5>
                        <p className="!text-[13px]">Đơn hàng đã được lưu thành công.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
