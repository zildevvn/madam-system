import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import DefaultProductImg from '../../images/default-product.png';

export const products = [
    // 🍜 BÚN BÒ (category_id: 3)
    { id: 1, name: "Bún bò đặc biệt", price: 70000, type: "food", category_id: 3, image: "https://images.unsplash.com/photo-1604908176997-4311c3c57d86" },
    { id: 2, name: "Bún bò giò heo", price: 65000, type: "food", category_id: 3, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246" },
    { id: 3, name: "Bún bò tái", price: 60000, type: "food", category_id: 3, image: "https://images.unsplash.com/photo-1626803775151-61d756612f97" },

    // 🍲 LẨU (category_id: 4)
    { id: 4, name: "Lẩu hải sản", price: 300000, type: "food", category_id: 4, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950" },
    { id: 5, name: "Lẩu bò", price: 280000, type: "food", category_id: 4, image: "https://images.unsplash.com/photo-1559847844-d721426d6edc" },
    { id: 6, name: "Lẩu thái", price: 320000, type: "food", category_id: 4, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38" },

    // 🌯 ĐẶC SẢN HUẾ (category_id: 2)
    { id: 7, name: "Nem lụi Huế", price: 80000, type: "food", category_id: 2, image: "https://images.unsplash.com/photo-1625944525903-c6b4f90f5d42" },
    { id: 8, name: "Bánh bèo", price: 50000, type: "food", category_id: 2, image: "https://images.unsplash.com/photo-1604908811754-1f5a9f8c8e6c" },
    { id: 9, name: "Bánh nậm", price: 45000, type: "food", category_id: 2, image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3" },

    // 🍱 SET MENU (category_id: 1)
    { id: 10, name: "Set menu gia đình", price: 500000, type: "food", category_id: 1, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" },
    { id: 11, name: "Set menu hải sản", price: 700000, type: "food", category_id: 1, image: "https://images.unsplash.com/photo-1553621042-f6e147245754" },
    { id: 12, name: "Set menu BBQ", price: 600000, type: "food", category_id: 1, image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092" },

    // 🥤 THỨC UỐNG (category_id: 5)
    { id: 13, name: "Trà đào", price: 40000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b" },
    { id: 14, name: "Trà chanh", price: 30000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1527169402691-a5c32f27a9b0" },
    { id: 15, name: "Nước cam", price: 45000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1553530666-ba11a90bb0d8" },
    { id: 16, name: "Sinh tố xoài", price: 50000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1577805947697-89e18249d767" },

    // 🥤 NƯỚC NGỌT (category_id: 5)
    { id: 17, name: "Coca Cola", price: 20000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1580910051074-3eb694886505" },
    { id: 18, name: "Pepsi", price: 20000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97" },
    { id: 19, name: "Sprite", price: 20000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1617196039897-4dcb3e89e329" },

    // 🍷 RƯỢU (category_id: 6)
    { id: 20, name: "Rượu vang đỏ", price: 600000, type: "drink", category_id: 6, image: "https://images.unsplash.com/photo-1510626176961-4b37d2ce7c8b" },
    { id: 21, name: "Rượu vang trắng", price: 550000, type: "drink", category_id: 6, image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb" },
    { id: 22, name: "Whisky", price: 800000, type: "drink", category_id: 6, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e" },

    // 🍸 COCKTAIL (category_id: 7)
    { id: 23, name: "Mojito", price: 120000, type: "drink", category_id: 7, image: "https://images.unsplash.com/photo-1582450871972-ab5ca641643d" },
    { id: 24, name: "Margarita", price: 130000, type: "drink", category_id: 7, image: "https://images.unsplash.com/photo-1582571352035-7f6a2b0a7b3c" },
    { id: 25, name: "Martini", price: 150000, type: "drink", category_id: 7, image: "https://images.unsplash.com/photo-1564758866810-5b3a8c8c8f94" },
    { id: 26, name: "Blue Lagoon", price: 140000, type: "drink", category_id: 7, image: "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f" },

    // 🍜 EXTRA FOOD
    { id: 27, name: "Cơm chiên hải sản", price: 90000, type: "food", category_id: 1, image: "https://images.unsplash.com/photo-1604908554025-0b8f4d98f9b0" },
    { id: 28, name: "Mì xào bò", price: 85000, type: "food", category_id: 1, image: "https://images.unsplash.com/photo-1617191519102-5baf7c6c9d34" },
    { id: 29, name: "Gỏi cuốn", price: 60000, type: "food", category_id: 2, image: "https://images.unsplash.com/photo-1604908177225-7bfa1c7d5dba" },
    { id: 30, name: "Chả giò", price: 70000, type: "food", category_id: 2, image: "https://images.unsplash.com/photo-1604908177120-0e3d0c5a2dd8" }
];

const CATEGORY_ICONS = {
    1: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>,
    2: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    3: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M7 21h10"/><path d="M12 3v5"/></svg>,
    4: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.292 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
    5: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.8 1.1l4.2 8.5c.2.4.3.8.3 1.2v6.2a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-6.2c0-.4.1-.8.3-1.2l4.2-8.5A2 2 0 0 1 8.8 3h6.4z"/><path d="M6 12h12"/></svg>,
    6: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a5 5 0 0 0 5 5Z"/></svg>,
    7: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a7 7 0 0 0 7-7V4H5v4a7 7 0 0 0 7 7Z"/><path d="M12 15v7"/><path d="M7 22h10"/><path d="m2 2 20 20"/></svg>,
};

const categories = [
    { id: 1, name: "Set Menu", type: "food" },
    { id: 2, name: "Đặc sản Huế", type: "food" },
    { id: 3, name: "Bún bò", type: "food" },
    { id: 4, name: "Lẩu", type: "food" },
    { id: 5, name: "Thức uống", type: "drink" },
    { id: 6, name: "Rượu", type: "drink" },
    { id: 7, name: "Cocktail", type: "drink" }
];

const filteredCategories = categories.filter(category =>
    products.some(product => product.category_id === category.id)
);

const Order = () => {
    const { tableId } = useParams();
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

    return (
        <div className="mdt-order-page w-full max-w-[1200px] mx-auto px-2 flex h-[calc(100vh-134px)] overflow-hidden gap-2">
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
                                <div className="flex items-center justify-between mb-3 sticky top-0 nmc-bg-light py-2 z-10">
                                    <h2 className="h5">{category.name}</h2>
                                </div>

                                <div className="list-products grid grid-cols-2 lg:grid-cols-3 gap-2">
                                    {categoryProducts.map((product) => (
                                        <div key={product.id} className='product-item cursor-pointer overflow-hidden rounded-[0px_10px_0px_10px]'>
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
    );
};

export default Order;
