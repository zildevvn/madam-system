import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { cancelOrderAsync } from '../store/slices/orderSlice';
import { setSearchQuery } from '../store/slices/productSlice';
import LogoImg from '../../images/Logo.png';

export default function HeaderOrder() {
    const navigate = useNavigate();
    const { tableId } = useParams();
    const dispatch = useAppDispatch();
    const { activeOrderId, items } = useAppSelector(state => state.order);
    const searchQuery = useAppSelector(state => state.product.searchQuery);
    const [showModal, setShowModal] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (isSearchActive && searchInputRef.current) {
            // Delay auto-focus on mobile to prevent the keyboard from
            // causing layout thrashing during the CSS transition
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isSearchActive]);

    const handleBackClick = () => {
        if (items && items.allIds && items.allIds.length > 0) {
            setShowModal(true);
        } else {
            handleCancelOrder();
        }
    };

    const handleCancelOrder = async () => {
        if (activeOrderId) {
            await dispatch(cancelOrderAsync(activeOrderId));
        }
        setShowModal(false);
        dispatch(setSearchQuery(''));
        navigate('/staff-order');
    };

    const handleSearchClick = () => {
        setIsSearchActive(true);
    };

    const handleCloseSearch = () => {
        setIsSearchActive(false);
        dispatch(setSearchQuery(''));
    };

    return (
        <>
            <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40 h-[60px] md:h-[88px] flex items-center">
                <div className="w-full max-w-[1200px] mx-auto px-2 relative overflow-hidden">
                    {/* Search active state */}
                    <div className={`flex items-center w-full gap-2 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] absolute inset-0 px-2 bg-white z-10 ${isSearchActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                        <button
                            onClick={handleCloseSearch}
                            className="p-2.5 hover:bg-gray-100 active:bg-gray-200 active:scale-90 rounded-full transition-all duration-200 ease-out border-none bg-transparent cursor-pointer text-gray-600 shrink-0 select-none touch-manipulation flex items-center justify-center"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="flex-1 relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full bg-gray-100 border-none rounded-full py-[10px] pl-4 pr-10 text-[14px] md:text-[15px] focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:outline-none transition-all placeholder:text-gray-400 font-medium"
                                placeholder="Tìm kiếm món ăn, thức uống..."
                                value={searchQuery}
                                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => dispatch(setSearchQuery(''))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 active:text-gray-800 active:scale-90 bg-transparent border-none p-2 cursor-pointer transition-all duration-200 ease-out select-none touch-manipulation"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Normal state */}
                    <div className={`grid grid-cols-3 items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSearchActive ? 'opacity-0 -translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
                        <div className="flex items-center">
                            <button
                                onClick={handleBackClick}
                                className="mdt-btn-back p-2.5 -ml-1 hover:bg-gray-100 active:bg-gray-200 active:scale-90 rounded-full transition-all duration-200 ease-out border-none bg-transparent cursor-pointer select-none touch-manipulation flex items-center justify-center"
                            >
                                <svg width="24px" height="24px" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M21 12L3 12M3 12L11.5 3.5M3 12L11.5 20.5" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                            </button>
                        </div>

                        <div className="flex justify-center">
                            <img src={LogoImg} alt="logo" className="w-full max-w-[70px] md:max-w-[100px] h-auto" />
                        </div>

                        <div className="flex items-center justify-end gap-1 md:gap-3">
                            <button
                                onClick={handleSearchClick}
                                className="p-2.5 hover:bg-gray-100 active:bg-gray-200 active:scale-90 rounded-full transition-all duration-200 ease-out border-none bg-transparent cursor-pointer text-gray-600 select-none touch-manipulation flex items-center justify-center"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                            <button className="p-2.5 hover:bg-gray-100 active:bg-gray-200 active:scale-90 rounded-full transition-all duration-200 ease-out border-none bg-transparent cursor-pointer text-gray-600 select-none touch-manipulation flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl transform transition-all">
                        <h6 className="mb-2">Xác nhận rời khỏi</h6>
                        <p className="mb-6 !text-[13px] leading-relaxed">
                            Bạn đã chọn món. Nếu bạn rời đi bây giờ, giỏ hàng sẽ bị xóa. Bạn có chắc chắn muốn rời khỏi trang này?
                        </p>
                        <div className="flex gap-3 justify-end items-center">
                            <button
                                onClick={() => setShowModal(false)}
                                className="mdt-btn !text-gray-600 !bg-gray-100"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                className="mdt-btn"
                            >
                                Đồng ý
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
