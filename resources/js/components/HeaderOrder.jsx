import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { cancelOrderAsync } from '../store/slices/orderSlice';
import { setSearchQuery } from '../store/slices/productSlice';
import LogoImg from '../../images/Logo.png';
import Icon from './shared/Icon';

export default function HeaderOrder() {
    const navigate = useNavigate();
    const { tableId } = useParams();
    const dispatch = useAppDispatch();
    const { activeOrderId, orderStatus, items } = useAppSelector(state => state.order);
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
        const hasCartItems = items && items.allIds && items.allIds.length > 0;
        const isExistingOrder = activeOrderId && orderStatus !== 'draft';

        if (hasCartItems) {
            // Has new items in cart — ask for confirmation before discarding
            setShowModal(true);
        } else if (isExistingOrder) {
            // [WHY] Existing confirmed order (pending/processing) — just navigate back.
            // The order was not modified (empty cart = no new items added), so nothing to cancel.
            dispatch(setSearchQuery(''));
            navigate('/staff-order');
        } else {
            // Truly new/empty draft — safe to cancel and clean up
            handleCancelOrder();
        }
    };

    const handleCancelOrder = async () => {
        // [WHY] Only cancel draft orders via the back button. Never cancel a confirmed
        // pending/processing order when the user simply exits the add-items screen.
        if (activeOrderId && orderStatus === 'draft') {
            await dispatch(cancelOrderAsync(activeOrderId));
        } else if (!activeOrderId) {
            // No order created yet (pure new empty session), nothing to cancel
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
                            <Icon name="chevronLeft" size={24} className="w-6 h-6" />
                        </button>
                        <div className="flex-1 relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full bg-gray-100 border-none rounded-full py-[10px] pl-4 pr-10 text-base focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:outline-none transition-all placeholder:text-gray-400 font-medium"
                                placeholder="Tìm kiếm món ăn, thức uống..."
                                value={searchQuery}
                                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => dispatch(setSearchQuery(''))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 active:text-gray-800 active:scale-90 bg-transparent border-none p-2 cursor-pointer transition-all duration-200 ease-out select-none touch-manipulation flex items-center justify-center"
                                >
                                    <Icon name="xCircle" size={16} className="w-4 h-4 text-gray-400 hover:text-gray-600" />
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
                                <Icon name="arrowLeft" size={24} className="w-6 h-6 text-black" strokeWidth={1.5} />
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
                                <Icon name="search" size={24} className="w-6 h-6" />
                            </button>
                            <button className="p-2.5 hover:bg-gray-100 active:bg-gray-200 active:scale-90 rounded-full transition-all duration-200 ease-out border-none bg-transparent cursor-pointer text-gray-600 select-none touch-manipulation flex items-center justify-center">
                                <Icon name="menu" size={24} className="w-6 h-6" />
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
