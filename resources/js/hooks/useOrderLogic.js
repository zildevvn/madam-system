import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart } from '../store/slices/orderSlice';

export const useOrderLogic = () => {
    const params = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const activeOrderId = useAppSelector(state => state.order.activeOrderId);
    const products = useAppSelector(state =>
        state.product.products.allIds.map(id => state.product.products.byId[id])
    );
    const categories = useAppSelector(state =>
        state.product.categories.allIds.map(id => state.product.categories.byId[id])
    );
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

    // 1. Intersection Observer for Scroll-spy
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

    // 2. Restrict body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // 3. Sync sidebar scroll
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

    // 4. Before Unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (activeOrderId) {
                navigator.sendBeacon(`/api/orders/${activeOrderId}`);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeOrderId]);

    const handleCategoryClick = useCallback((categoryId) => {
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
    }, []);

    const handleAddToCart = useCallback((product) => {
        dispatch(addToCart(product));

        // Trigger micro-animation
        setAnimatingItems(prev => ({ ...prev, [product.id]: true }));
        setTimeout(() => {
            setAnimatingItems(prev => ({ ...prev, [product.id]: false }));
        }, 600);
    }, [dispatch]);

    return {
        categories,
        filteredCategories,
        filteredProducts,
        activeCategoryId,
        animatingItems,
        scrollContainerRef,
        sidebarRef,
        handleCategoryClick,
        handleAddToCart,
        navigate,
        activeOrderId
    };
};
