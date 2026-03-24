import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart, cancelOrderAsync } from '../store/slices/orderSlice';
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
    const { tableId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { activeOrderId } = useAppSelector(state => state.order);
    const products = useAppSelector(state => state.product.products.allIds.map(id => state.product.products.byId[id]));
    const categories = useAppSelector(state => state.product.categories.allIds.map(id => state.product.categories.byId[id]));

    const filteredCategories = categories.filter(category =>
        products.some(product => product.category_id === category.id)
    );

    const [activeCategoryId, setActiveCategoryId] = useState(filteredCategories[0]?.id);
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
            <div className="mdt-order-page w-full max-w-[1200px] mx-auto px-2 flex flex-1 overflow-hidden gap-2 pt-2">
                <aside
                    ref={sidebarRef}
                    className="mdt-order-page__sidebar bg-white w-1/4 min-w-[100px] max-w-[100px] md:min-w-[150px] md:max-w-[200px] border-r border-gray-200 overflow-y-auto hide-scrollbar"
                >
                    <div className="flex flex-col">
                        {filteredCategories.map((category) => (
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
                        {filteredCategories.map((category) => {
                            const categoryProducts = products.filter(p => p.category_id === category.id);
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
                                                className='product-item cursor-pointer overflow-hidden rounded-[0px_10px_0px_10px]'
                                                onClick={() => handleAddToCart(product)}
                                            >
                                                <img
                                                    src={product.image || DefaultProductImg}
                                                    onError={(e) => { e.target.src = DefaultProductImg; }}
                                                    alt={product.name}
                                                    className="aspect-square object-cover object-center"
                                                />
                                                <p className='-mt-[10px] z-[9] relative text-center text-[12px] md:text-[14px] bg-white rounded-[0px_10px_0px_10px] p-2'>{new Intl.NumberFormat('vi-VN').format(product.price)}đ</p>
                                                <h3 className='text-center py-[12px] px-[5px]]'>{product.name}</h3>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Order;
