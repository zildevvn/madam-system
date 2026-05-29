import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setActiveTab } from '../store/slices/tableSlice';
import Icon from './shared/Icon';

export default function FooterStaffOrder() {
    const dispatch = useAppDispatch();
    const activeTab = useAppSelector(state => state.table.activeTab);

    return (
        <footer className="footer-staff-order bg-white w-full border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="w-full max-w-[1200px] mx-auto px-[20px] py-2">
                <div className="flex justify-between items-center">

                    <button
                        onClick={() => dispatch(setActiveTab('tables'))}
                        className={`footer-item flex flex-col items-center gap-1 ${activeTab === 'tables' ? 'text-orange-500 font-semibold' : 'text-gray-400 hover:text-orange-500'} transition-colors duration-200 border-none bg-transparent cursor-pointer`}
                    >
                        <Icon name="layoutGrid" size={24} className="w-6 h-6" />
                        <span className="text-[10px] uppercase tracking-wider">Chọn bàn</span>
                    </button>


                    <button
                        onClick={() => dispatch(setActiveTab('orders'))}
                        className={`footer-item flex flex-col items-center gap-1 ${activeTab === 'orders' ? 'text-orange-500 font-semibold' : 'text-gray-400 hover:text-orange-500'} transition-colors duration-200 border-none bg-transparent cursor-pointer`}
                    >
                        <Icon name="clipboardList" size={24} className="w-6 h-6" />
                        <span className="text-[10px] uppercase tracking-wider">Đơn hàng</span>
                    </button>

                    <button className="footer-item flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition-colors duration-200 border-none bg-transparent cursor-pointer">
                        <Icon name="creditCard" size={24} className="w-6 h-6" />
                        <span className="text-[10px] uppercase tracking-wider">Thanh toán</span>
                    </button>

                    <button className="footer-item flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition-colors duration-200 border-none bg-transparent cursor-pointer">
                        <Icon name="qrCode" size={24} className="w-6 h-6" />
                        <span className="text-[10px] uppercase tracking-wider">QR Order</span>
                    </button>
                </div>
            </div>
        </footer>
    );
}