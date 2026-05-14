import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToCart } from '../store/slices/orderSlice';
import { 
    selectSearchQuery, 
    selectAllCategories,
    selectFilteredProducts, 
    selectFilteredCategories 
} from '../store/slices/productSlice';

export const useOrderLogic = () => {
    const params = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const activeOrderId = useAppSelector(state => state.order.activeOrderId);
    
    // [WHY] Use memoized selectors to prevent unnecessary rerenders caused by new array references
    const searchQuery = useAppSelector(selectSearchQuery) || '';
    const categories = useAppSelector(selectAllCategories);
    const filteredProducts = useAppSelector(selectFilteredProducts);
    const filteredCategories = useAppSelector(selectFilteredCategories);

    const [activeCategoryId, setActiveCategoryId] = useState(null);
    
    // [WHY] Sync and validate active category when filtered results change to prevent stale UI state
    useEffect(() => {
        if (cleanupAbortControllerRef.current.signal.aborted) return;

        // Check if the current activeCategoryId is still valid in the filtered results
        const isValid = filteredCategories.some(c => c.id === activeCategoryId);
        
        if (!isValid && filteredCategories.length > 0) {
            // [WHY] Auto-switch to the first available category if current one is filtered out
            setActiveCategoryId(filteredCategories[0].id);
        } else if (filteredCategories.length === 0 && activeCategoryId !== null) {
            // [WHY] Reset if no categories match the search/filter
            setActiveCategoryId(null);
        }
    }, [filteredCategories, activeCategoryId]);
    const [animatingItems, setAnimatingItems] = useState({});

    const scrollContainerRef = useRef(null);
    const sidebarRef = useRef(null);
    const observerRef = useRef(null);
    const isManualScrolling = useRef(false);
    
    /** @type {React.MutableRefObject<Map<number, HTMLElement>>} */
    const categoryRefs = useRef(new Map());

    /**
     * [WHY] Callback ref to track category sections without imperative DOM queries.
     * Prevents stale references and is compatible with React's rendering lifecycle.
     */
    const setCategoryRef = useCallback((id) => (el) => {
        if (el) {
            categoryRefs.current.set(id, el);
        } else {
            categoryRefs.current.delete(id);
        }
    }, []);

    // [RULE] Use AbortController and timer tracking for safe unmounting
    const cleanupAbortControllerRef = useRef(new AbortController());
    const timersRef = useRef(new Set());

    useEffect(() => {
        return () => {
            cleanupAbortControllerRef.current.abort();
            timersRef.current.forEach(clearTimeout);
            timersRef.current.clear();
            categoryRefs.current.clear();
        };
    }, []);

    /**
     * @param {Function} callback
     * @param {number} delay
     */
    const safeSetTimeout = useCallback((callback, delay) => {
        const id = setTimeout(() => {
            timersRef.current.delete(id);
            if (!cleanupAbortControllerRef.current.signal.aborted) {
                callback();
            }
        }, delay);
        timersRef.current.add(id);
        return id;
    }, []);

    // 1. Intersection Observer for Scroll-spy
    useEffect(() => {
        // [WHY] Only initialize observer if we have categories to observe
        if (filteredCategories.length === 0) return;

        const options = {
            root: scrollContainerRef.current,
            rootMargin: '0px 0px -80% 0px',
            threshold: 0
        };

        const callback = (entries) => {
            if (isManualScrolling.current || cleanupAbortControllerRef.current.signal.aborted) return;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = parseInt(entry.target.getAttribute('data-category-id'));
                    setActiveCategoryId(id);
                }
            });
        };

        const observer = new IntersectionObserver(callback, options);
        observerRef.current = observer;

        // [WHY] Observe tracked refs instead of querying the DOM
        categoryRefs.current.forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => {
            observer.disconnect();
        };
    }, [filteredCategories, filteredProducts]);

    // 2. Restrict body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // 3. Sync sidebar scroll
    useEffect(() => {
        if (!activeCategoryId || !sidebarRef.current || cleanupAbortControllerRef.current.signal.aborted) return;

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

        // [WHY] Use ref map instead of getElementById for scrolling
        const element = categoryRefs.current.get(categoryId);
        if (element && scrollContainerRef.current) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Re-enable observer after smooth scroll completes
            safeSetTimeout(() => {
                isManualScrolling.current = false;
            }, 800);
        }
    }, [safeSetTimeout]);

    const handleAddToCart = useCallback((product) => {
        dispatch(addToCart(product));

        // Trigger micro-animation
        setAnimatingItems(prev => ({ ...prev, [product.id]: true }));
        safeSetTimeout(() => {
            setAnimatingItems(prev => ({ ...prev, [product.id]: false }));
        }, 600);
    }, [dispatch, safeSetTimeout]);

    return {
        categories,
        filteredCategories,
        filteredProducts,
        activeCategoryId,
        animatingItems,
        scrollContainerRef,
        sidebarRef,
        setCategoryRef,
        handleCategoryClick,
        handleAddToCart,
        navigate,
        activeOrderId
    };
};
