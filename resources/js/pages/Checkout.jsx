import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateQuantity, setOrderType } from '../store/slices/orderSlice';

export default function Checkout() {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { items: selectedItems, orderType } = useAppSelector(state => state.order);

    const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const serviceFee = 5000;
    const total = subtotal + serviceFee;

    const totalQuantity = selectedItems.reduce((acc, item) => acc + item.quantity, 0);

    const handleUpdateQuantity = (id, newQuantity) => {
        dispatch(updateQuantity({ id, quantity: newQuantity }));
    };

    return (
        <div className="mdt-bg-light mdt-checkout-page min-h-screen pb-40">
            <div className="w-full sticky top-0 z-50 bg-white">
                <div className="flex items-center justify-between px-2 py-4 w-full">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(`/order/${tableId}`)}
                            className="mdt-btn-back p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                        >
                            <svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M21 12L3 12M3 12L11.5 3.5M3 12L11.5 20.5" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </button>

                        <h1 className="h6">Tạo hóa đơn</h1>
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
                            <div key={item.id} className="product-item bg-surface-container-lowest py-3 border-b border-gray-100 last:border-0 flex flex-col gap-2">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-1">
                                        <h3 className="font-medium">{item.name}</h3>
                                        <p className="text-[12px] opacity-70">
                                            Đơn giá: {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                                        </p>
                                    </div>
                                    <span className="font-bold text-on-surface text-[14px]">
                                        {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                                    </span>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <div className="flex items-center bg-gray-100 rounded-full p-1 border border-outline-variant/10 shadow-sm">
                                        <button
                                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-on-surface border-none active:scale-90 transition-all hover:bg-white/80 cursor-pointer"
                                        >
                                            <svg width="18px" height="18px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6 12H18" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                        </button>
                                        <span className="px-5 font-bold text-on-surface text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                            className="btn-plus w-6 h-6 flex items-center justify-center rounded-full text-white shadow-md active:scale-90 transition-all hover:brightness-110 cursor-pointer"
                                        >
                                            <svg width="18px" height="18px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#fff"><path d="M6 12H12M18 12H12M12 12V6M12 12V18" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                        <div className="flex flex-col items-end">
                            {serviceFee > 0 && <span className="text-[12px] opacity-60">Phí phục vụ: {new Intl.NumberFormat('vi-VN').format(serviceFee)}đ</span>}
                            <span className="text-xl font-extrabold text-on-surface">
                                {new Intl.NumberFormat('vi-VN').format(total)}đ
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => navigate(`/order/${tableId}`)}
                            className="btn-add flex-1 flex flex-row items-center justify-center text-[#313234] dark:text-slate-300 border border-[#b2b2b4]/20 rounded-xl px-4 py-3 gap-2 active:scale-98 duration-150 hover:opacity-90 cursor-pointer"
                        >
                            <svg width="18px" height="18px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6 12H12M18 12H12M12 12V6M12 12V18" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                            Thêm
                        </button>
                        <button
                            onClick={() => alert("Đơn hàng đã được gửi!")}
                            disabled={selectedItems.length === 0}
                            className={`btn-save flex-[1.5] flex items-center justify-center text-white rounded-xl px-4 py-3 gap-2 active:scale-98 duration-150 shadow-lg shadow-primary/20 cursor-pointer ${selectedItems.length === 0 ? 'opacity-50 grayscale' : ''}`}
                        >
                            <svg width="18px" height="18px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#fff"><path d="M3 19V5C3 3.89543 3.89543 3 5 3H16.1716C16.702 3 17.2107 3.21071 17.5858 3.58579L20.4142 6.41421C20.7893 6.78929 21 7.29799 21 7.82843V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z" stroke="#fff" stroke-width="1.5"></path><path d="M8.6 9H15.4C15.7314 9 16 8.73137 16 8.4V3.6C16 3.26863 15.7314 3 15.4 3H8.6C8.26863 3 8 3.26863 8 3.6V8.4C8 8.73137 8.26863 9 8.6 9Z" stroke="#fff" stroke-width="1.5"></path><path d="M6 13.6V21H18V13.6C18 13.2686 17.7314 13 17.4 13H6.6C6.26863 13 6 13.2686 6 13.6Z" stroke="#fff" stroke-width="1.5"></path></svg>
                            Lưu
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
