import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import productService from '../services/productService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProducts, fetchCategories, addCategory, updateCategory, deleteCategory } from '../store/slices/productSlice';

export const useProductManagement = () => {
    const dispatch = useAppDispatch();
    
    // Get products and categories from centralized Redux store
    const products = useAppSelector(state =>
        state.product.products.allIds.map(id => state.product.products.byId[id])
    );
    const categories = useAppSelector(state =>
        state.product.categories.allIds.map(id => state.product.categories.byId[id])
    );
    
    const loading = useAppSelector(state => state.product.status === 'loading');
    const error = useAppSelector(state => state.product.error);
    const processing = useAppSelector(state => state.product.status === 'loading'); // Reuse status or add a dedicated 'processing' flag if needed

    const refresh = useCallback(() => {
        dispatch(fetchProducts());
        dispatch(fetchCategories());
    }, [dispatch]);

    const addProduct = async (data) => {
        try {
            await productService.createProduct(data);
            refresh(); // Triggers Redux re-fetch
            toast.success('Thêm món mới thành công');
            return true;
        } catch (err) {
            console.error('Failed to add product:', err);
            toast.error('Không thể thêm món mới');
            return false;
        }
    };

    const updateProduct = async (id, data) => {
        try {
            await productService.updateProduct(id, data);
            refresh(); // Triggers Redux re-fetch
            toast.success('Cập nhật món thành công');
            return true;
        } catch (err) {
            console.error('Failed to update product:', err);
            toast.error('Không thể cập nhật món');
            return false;
        }
    };

    const deleteProduct = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa món này?')) return;
        
        try {
            await productService.deleteProduct(id);
            refresh(); // Triggers Redux re-fetch
            toast.success('Xóa món thành công');
            return true;
        } catch (err) {
            console.error('Failed to delete product:', err);
            toast.error('Không thể xóa món');
            return false;
        }
    };

    const handleAddCategory = async (data) => {
        const result = await dispatch(addCategory(data));
        if (addCategory.fulfilled.match(result)) {
            toast.success('Thêm danh mục thành công');
            return true;
        }
        toast.error('Không thể thêm danh mục');
        return false;
    };

    const handleUpdateCategory = async (id, data) => {
        const result = await dispatch(updateCategory({ id, data }));
        if (updateCategory.fulfilled.match(result)) {
            toast.success('Cập nhật danh mục thành công');
            return true;
        }
        toast.error('Không thể cập nhật danh mục');
        return false;
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
        
        const result = await dispatch(deleteCategory(id));
        if (deleteCategory.fulfilled.match(result)) {
            toast.success('Xóa danh mục thành công');
            return true;
        } else {
            // Error message from rejectWithValue
            toast.error(result.payload || 'Không thể xóa danh mục');
            return false;
        }
    };

    useEffect(() => {
        // Initial load if needed (though App.jsx will handle global initial load)
        if (products.length === 0) {
            refresh();
        }
    }, [products.length, refresh]);

    return {
        products,
        categories,
        loading,
        error,
        processing,
        addProduct,
        updateProduct,
        deleteProduct,
        handleAddCategory,
        handleUpdateCategory,
        handleDeleteCategory,
        refresh
    };
};
