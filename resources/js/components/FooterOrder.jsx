import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateQuantity, updateItemNote } from '../store/slices/orderSlice';
import ProductItem from './ProductItem';

export default function FooterOrder() {
    const navigate = useNavigate();
    const { tableId } = useParams();
    const dispatch = useAppDispatch();
    const items = useAppSelector(state => state.order.items.allIds.map(id => state.order.items.byId[id]));
    const [showList, setShowList] = useState(false);

    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

    const handleUpdateQuantity = (id, newQuantity) => {
        dispatch(updateQuantity({ id, quantity: newQuantity }));
    };

    const handleUpdateNote = (id, note) => {
        dispatch(updateItemNote({ id, note }));
    };

    React.useEffect(() => {
        if (totalQuantity === 0 && showList) {
            setShowList(false);
        }
    }, [totalQuantity, showList]);

    return (
        <footer className={`footer-order fixed bottom-0 left-0 right-0 ${showList ? 'bg-transparent' : 'bg-white'} z-40`}>

            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 z-[-1] ${showList && totalQuantity > 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setShowList(false)}
            ></div>

            {/* Sliding Drawer for Ordered Items */}
            <div className={`absolute bottom-full left-0 right-0 max-w-[1200px] mx-auto bg-white rounded-t-xl  transition-all duration-1000  will-change-transform max-h-[60vh] flex flex-col ${showList && totalQuantity > 0 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                    <h5 className='!font-semibold'>Món đã chọn ({totalQuantity})</h5>
                    <button onClick={() => setShowList(false)} className="p-2 text-gray-400 hover:text-gray-600 outline-none rounded-full cursor-pointer hover:bg-gray-100 active:scale-95 transition-all outline-none border-none bg-transparent">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="overflow-y-auto hide-scrollbar p-3 flex flex-col gap-2 relative list-products">
                    {items.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 font-medium">Bạn chưa chọn món nào.</div>
                    ) : (
                        items.map(item => (
                            <ProductItem
                                key={item.id}
                                item={item}
                                showNoteButton={true}
                                onUpdateQuantity={handleUpdateQuantity}
                                onUpdateNote={handleUpdateNote}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] relative z-10 w-full transition-transform duration-300">
                <div className={`flex items-center justify-center overflow-visible transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom w-full ${totalQuantity > 0 ? 'opacity-100 translate-y-0 scale-100 h-10 pt-2' : 'opacity-0 translate-y-6 scale-50 pointer-events-none h-0 p-0 mb-0'}`}>
                    <button
                        className="btn-show-list-product"
                        onClick={() => setShowList(!showList)}
                    >
                        <svg className={`transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center ${showList ? 'rotate-180 translate-y-0.5' : '-translate-y-0.5'}`} width="24px" height="24px" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6 11L12 5L18 11" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M6 19L12 13L18 19" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </button>
                </div>

                <div className="max-w-[1200px] mx-auto px-2 h-20 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-md text-gray-600 font-medium leading-none">Thành tiền: {new Intl.NumberFormat('vi-VN').format(total)}đ</span>
                        <span className="text-sm ">Mặt hàng: {totalQuantity}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className={`mdt-btn ${totalQuantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => navigate(`/checkout/${tableId}`)}
                            disabled={totalQuantity === 0}
                        >
                            Tiếp
                            <svg width="24px" height="24px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M9 6L15 12L9 18" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </footer >
    );
}
