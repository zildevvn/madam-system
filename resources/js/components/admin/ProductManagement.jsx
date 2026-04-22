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

    const [searchTerm, setSearchTerm] = useState('');

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
        const matchesType = filterType === 'all' || p.type === filterType;
        const matchesSearch = (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    const filteredCategories = categories.filter(c =>
        (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading && products.length === 0 && categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">Đang tải Menu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Tab Switcher */}
            <div className="flex justify-center">
                <div className="inline-flex bg-white p-1.5 rounded-[16px] shadow-sm border border-slate-100">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`cursor-pointer px-4 py-2 lg:px-8 lg:py-3.5 rounded-[12px] text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${activeTab === 'products'
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        Quản lý món
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`cursor-pointer px-4 py-2 lg:px-8 lg:py-3.5 rounded-[12px] text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${activeTab === 'categories'
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
            <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6">

                {activeTab === 'products' && (
                    <div className="max-w-fit mx-auto md:mx-0 flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
                        {['all', 'food', 'drink'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`cursor-pointer px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {type === 'all' ? 'Tất cả' : type === 'food' ? 'Food' : 'Drink'}
                            </button>
                        ))}
                    </div>
                )}


                <div className="flex items-center gap-2 justify-end">
                    <button
                        onClick={activeTab === 'products' ? handleAddProduct : handleAddCategoryClick}
                        className="mdt-btn flex items-center justify-center group shrink-0"
                    >
                        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        <span>{activeTab === 'products' ? 'Thêm món mới' : 'Thêm danh mục'}</span>
                    </button>
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder={activeTab === 'products' ? "Tìm kiếm món ăn..." : "Tìm kiếm danh mục..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mdt-btn !w-full !bg-white  !pl-12 !pr-4 !py-3 placeholder:text-slate-300 focus:outline-none !text-slate-900"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                </div>
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
                    categories={filteredCategories}
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
                serverError={error}
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
