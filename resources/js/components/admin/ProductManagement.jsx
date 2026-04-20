import React, { useState } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import ProductFormModal from './ProductFormModal';
import CategoryFormModal from './CategoryFormModal';
import ProductList from './ProductList';
import CategoryList from './CategoryList';

// [WHY] Component to manage products and categories in the admin dashboard.
// [RULE] Delegated UI for lists to sub-components.
const ProductManagement = () => {
    const { 
        products, 
        categories, 
        loading, 
        processing, 
        error, 
        addProduct, 
        updateProduct, 
        deleteProduct,
        handleAddCategory,
        handleUpdateCategory,
        handleDeleteCategory
    } = useProductManagement();

    const [activeTab, setActiveTab] = useState('products'); // products, categories
    
    // Product states
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    
    // Category states
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    
    const [filterType, setFilterType] = useState('all'); // all, food, drink

    const handleAddProduct = () => {
        setEditingProduct(null);
        setIsProductModalOpen(true);
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    };

    const handleAddCategoryClick = () => {
        setEditingCategory(null);
        setIsCategoryModalOpen(true);
    };

    const handleEditCategoryClick = (category) => {
        setEditingCategory(category);
        setIsCategoryModalOpen(true);
    };

    const handleProductSubmit = async (data) => {
        const success = editingProduct
            ? await updateProduct(editingProduct.id, data)
            : await addProduct(data);

        if (success) {
            setIsProductModalOpen(false);
        }
    };

    const handleCategorySubmit = async (data) => {
        const success = editingCategory
            ? await handleUpdateCategory(editingCategory.id, data)
            : await handleAddCategory(data);

        if (success) {
            setIsCategoryModalOpen(false);
        }
    };

    const filteredProducts = products.filter(p => {
        if (filterType === 'all') return true;
        return p.type === filterType;
    });

    if (loading && products.length === 0 && categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Đang tải Menu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Tab Switcher */}
            <div className="flex justify-center">
                <div className="inline-flex bg-white p-1.5 rounded-[24px] shadow-sm border border-slate-100">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-8 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${
                            activeTab === 'products'
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        Quản lý món
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-8 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${
                            activeTab === 'categories'
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01" /></svg>
                        Danh mục
                    </button>
                </div>
            </div>

            {/* Header / Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-900 mb-0">
                        {activeTab === 'products' ? 'Danh sách món' : 'Quản lý danh mục'}
                    </h2>
                    {activeTab === 'products' && (
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                            {['all', 'food', 'drink'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                        filterType === type 
                                        ? 'bg-slate-900 text-white' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {type === 'all' ? 'Tất cả' : type === 'food' ? 'Food' : 'Drink'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={activeTab === 'products' ? handleAddProduct : handleAddCategoryClick}
                    className="w-full lg:w-auto px-8 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 group active:scale-95"
                >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    {activeTab === 'products' ? 'Thêm món mới' : 'Thêm danh mục'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-[11px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-4 animate-in shake duration-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                </div>
            )}

            {/* Content Logic */}
            {activeTab === 'products' ? (
                <ProductList 
                    filteredProducts={filteredProducts} 
                    handleEditProduct={handleEditProduct} 
                    deleteProduct={deleteProduct} 
                />
            ) : (
                <CategoryList 
                    categories={categories} 
                    products={products} 
                    handleEditCategoryClick={handleEditCategoryClick} 
                    handleDeleteCategory={handleDeleteCategory} 
                />
            )}

            <ProductFormModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSubmit={handleProductSubmit}
                product={editingProduct}
                categories={categories}
                processing={processing}
            />

            <CategoryFormModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSubmit={handleCategorySubmit}
                category={editingCategory}
                processing={processing}
            />
        </div>
    );
};

export default ProductManagement;
