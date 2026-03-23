import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

export default function FooterOrder() {
    const navigate = useNavigate();
    const { tableId } = useParams();
    const items = useAppSelector(state => state.order.items);

    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <footer className="footer-order fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
            <div className="max-w-[1200px] mx-auto px-2 h-20 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-md text-gray-600 font-medium leading-none">Thành tiền: {new Intl.NumberFormat('vi-VN').format(total)}đ</span>
                    <span className="text-sm ">Mặt hàng: {totalQuantity}</span>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        className="mdt-btn"
                        onClick={() => navigate(`/checkout/${tableId}`)}
                    >
                        Tiếp
                        <svg width="24px" height="24px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M9 6L15 12L9 18" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </button>
                </div>
            </div>
        </footer>
    );
}
