import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart } from '../store/slices/orderSlice';
import DefaultProductImg from '../../images/default-product.png';

const CATEGORY_ICONS = {
    1: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /></svg>,
    2: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    3: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /><path d="M7 21h10" /><path d="M12 3v5" /></svg>,
    4: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.292 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
    5: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.8 1.1l4.2 8.5c.2.4.3.8.3 1.2v6.2a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-6.2c0-.4.1-.8.3-1.2l4.2-8.5A2 2 0 0 1 8.8 3h6.4z" /><path d="M6 12h12" /></svg>,
    6: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22h8" /><path d="M7 10h10" /><path d="M12 15v7" /><path d="M12 15a5 5 0 0 0 5-5V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a5 5 0 0 0 5 5Z" /></svg>,
    7: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a7 7 0 0 0 7-7V4H5v4a7 7 0 0 0 7 7Z" /><path d="M12 15v7" /><path d="M7 22h10" /><path d="m2 2 20 20" /></svg>,
};

const Order = () => {
    useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { activeOrderId } = useAppSelector(state => state.order);
    const products = useAppSelector(state => state.product.products.allIds.map(id => state.product.products.byId[id]));
    const categories = useAppSelector(state => state.product.categories.allIds.map(id => state.product.categories.byId[id]));
    const searchQuery = useAppSelector(state => state.product.searchQuery) || '';

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCategories = categories.filter(category =>
        filteredProducts.some(product => product.category_id === category.id)
    );

    const [activeCategoryId, setActiveCategoryId] = useState(filteredCategories[0]?.id);
    const [animatingItems, setAnimatingItems] = useState({});
    const scrollContainerRef = useRef(null);
    const sidebarRef = useRef(null);
    const observerRef = useRef(null);
    const isManualScrolling = useRef(false);

    useEffect(() => {
        const options = {
            root: scrollContainerRef.current,
            rootMargin: '0px 0px -80% 0px',
            threshold: 0
        };

        const callback = (entries) => {
            if (isManualScrolling.current) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = parseInt(entry.target.getAttribute('data-category-id'));
                    setActiveCategoryId(id);
                }
            });
        };

        observerRef.current = new IntersectionObserver(callback, options);

        const sections = document.querySelectorAll('.product-category-section');
        sections.forEach(section => observerRef.current.observe(section));

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, []);

    // Restrict body scroll on this page
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Sync sidebar scroll with active category
    useEffect(() => {
        if (!activeCategoryId || !sidebarRef.current) return;

        const activeItem = sidebarRef.current.querySelector('.item-category.is-active');
        if (activeItem) {
            activeItem.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [activeCategoryId]);

    const handleCategoryClick = (categoryId) => {
        setActiveCategoryId(categoryId);
        isManualScrolling.current = true;

        const element = document.getElementById(`category-section-${categoryId}`);
        if (element && scrollContainerRef.current) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Re-enable observer after smooth scroll completes
            setTimeout(() => {
                isManualScrolling.current = false;
            }, 800);
        }
    };

    const handleAddToCart = (product) => {
        dispatch(addToCart(product));

        // Trigger micro-animation
        setAnimatingItems(prev => ({ ...prev, [product.id]: true }));
        setTimeout(() => {
            setAnimatingItems(prev => ({ ...prev, [product.id]: false }));
        }, 600); // Extended slightly for softer fade
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
        <div className="flex flex-col w-full h-[calc(100vh-134px)]">
            <div className="mdt-order-page w-full max-w-[1200px] mx-auto px-2 flex flex-1 overflow-hidden gap-2 pt-0">
                <aside
                    ref={sidebarRef}
                    className="mdt-order-page__sidebar bg-white w-1/4 min-w-[100px] max-w-[100px] md:min-w-[150px] md:max-w-[200px] border-r border-gray-200 overflow-y-auto hide-scrollbar"
                >
                    <div className="flex flex-col">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className={`item-category flex flex-col items-center justify-center text-center py-[10px] px-[4px] md:px-4 md:py-6 border-none cursor-pointer ${activeCategoryId === category.id
                                    ? 'is-active'
                                    : ''
                                    }`}
                            >
                                {CATEGORY_ICONS[category.id] && <div className="category-icon mb-1 md:mb-2">{CATEGORY_ICONS[category.id]}</div>}
                                <span className="category-name text-[10px] md:text-[12px]">{category.name}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <main
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto  scroll-smooth"
                >
                    <div className="w-full">
                        {filteredCategories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center sm:min-h-[400px]">
                                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <p className="text-gray-500 font-medium">Không tìm thấy món ăn, thức uống nào</p>
                            </div>
                        ) : (
                            filteredCategories.map((category) => {
                                const categoryProducts = filteredProducts.filter(p => p.category_id === category.id);
                                return (
                                    <section
                                        key={category.id}
                                        id={`category-section-${category.id}`}
                                        data-category-id={category.id}
                                        className="product-category-section mb-4 scroll-mt-6"
                                    >
                                        <div className="product-category-section__header flex items-center justify-between mb-3 sticky top-0 mdt-bg-light py-2 z-10">
                                            <h2 className="h5">{category.name}</h2>
                                        </div>

                                        <div className="list-products grid grid-cols-2 lg:grid-cols-3 gap-2">
                                            {categoryProducts.map((product) => (
                                                <div
                                                    key={product.id}
                                                    className='relative product-item cursor-pointer rounded-[0px_10px_0px_10px] bg-white transition-all duration-300 select-none group'
                                                    onClick={() => handleAddToCart(product)}
                                                >
                                                    {/* Image Container with targeted hover/active zoom */}
                                                    <div className="relative overflow-hidden w-full aspect-square bg-gray-50 rounded-tr-[10px]">
                                                        <img
                                                            src={product.image || DefaultProductImg}
                                                            onError={(e) => { e.target.src = DefaultProductImg; }}
                                                            alt={product.name}
                                                            className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out ${animatingItems[product.id] ? 'scale-110 blur-[1px]' : 'group-hover:scale-105 group-active:scale-95'}`}
                                                        />

                                                        {/* Glassmorphic Success Overlay */}
                                                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${animatingItems[product.id] ? 'opacity-100 bg-black/20 backdrop-blur-[2px]' : 'opacity-0 bg-transparent pointer-events-none'}`}>
                                                            {/* Success Check Badge */}
                                                            <div className={`flex flex-col items-center justify-center transition-all duration-500 transform ${animatingItems[product.id] ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-50 opacity-0'}`}>
                                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#03b879] rounded-full flex items-center justify-center shadow-lg shadow-[#03b879]/40 mb-1">
                                                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                                </div>
                                                                <span className="text-white font-bold text-[11px] md:text-[13px] drop-shadow-md tracking-wide">
                                                                    +1 {category.type === 'drink' ? 'Ly' : 'Phần'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Product Info Card Overlap */}
                                                    <div className="relative z-8 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] rounded-[0px_10px_0px_10px]  transition-transform duration-300 group-active:translate-y-1">
                                                        <p className='-mt-[10px] z-[9] relative text-center text-[12px] md:text-[14px] bg-white rounded-[0px_10px_0px_10px] p-2'>
                                                            {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                                                        </p>
                                                        <h3 className='mb-0 pt-1 text-center px-2 text-[12px] md:text-[14px] font-medium text-gray-700 line-clamp-2 leading-snug min-h-[40px] flex items-center justify-center'>
                                                            {product.name}
                                                        </h3>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Order;
