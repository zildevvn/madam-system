import React, { useState } from 'react';
import { useProductManagement } from '../../hooks/useProductManagement';
import ProductFormModal from './ProductFormModal';
import CategoryFormModal from './CategoryFormModal';

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
                <>
                    {/* Products Table */}
                    <div className="hidden lg:block bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sản phẩm</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Danh mục</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Đơn giá</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="group hover:bg-slate-50/30 transition-all">
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{product.name}</span>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${product.type === 'food' ? 'text-blue-500' : 'text-green-500'}`}>
                                                        {product.type === 'food' ? 'Kitchen Item' : 'Bar Item'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200/50">
                                                {product.category?.name || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex flex-col leading-none">
                                                <span className="text-base font-black text-slate-900">{new Intl.NumberFormat('vi-VN').format(product.price)}đ</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Current Price</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-40 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => handleEditProduct(product)}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-orange-50 hover:text-orange-500 rounded-xl transition-all active:scale-90"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-90"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Products Grid Mobile */}
                    <div className="lg:hidden grid grid-cols-1 gap-4">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <svg className="w-6 h-6 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-lg font-black text-slate-900 truncate uppercase tracking-tight leading-tight">{product.name}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.category?.name || 'Uncategorized'}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${product.type === 'food' ? 'text-blue-500' : 'text-green-500'}`}>{product.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                    <span className="text-xl font-black text-slate-900">{new Intl.NumberFormat('vi-VN').format(product.price)}đ</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditProduct(product)} className="px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Sửa</button>
                                        <button onClick={() => deleteProduct(product.id)} className="px-4 py-2.5 bg-slate-50 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Xóa</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="py-24 text-center bg-white rounded-[48px] border border-slate-100 shadow-sm border-dashed">
                            <h3 className="text-xl font-black text-slate-900 mb-2">Chưa có sản phẩm nào.</h3>
                            <button onClick={handleAddProduct} className="px-10 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95">Thêm món đầu tiên</button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Categories Table */}
                    <div className="hidden lg:block bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Danh mục</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Loại</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Số lượng món</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {categories.map((category) => {
                                    const productCount = products.filter(p => p.category_id === category.id).length;
                                    return (
                                        <tr key={category.id} className="group hover:bg-slate-50/30 transition-all">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                                                    {category.name}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                                    category.type === 'food' 
                                                    ? 'bg-blue-50 text-blue-500 border-blue-100' 
                                                    : 'bg-green-50 text-green-500 border-green-100'
                                                }`}>
                                                    {category.type === 'food' ? 'Thức ăn' : 'Đồ uống'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-sm font-bold text-slate-400">{productCount} món đang sử dụng</span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-40 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => handleEditCategoryClick(category)}
                                                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-orange-50 hover:text-orange-500 rounded-xl transition-all active:scale-90"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(category.id)}
                                                        className="w-10 h-10 flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-90"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Category Grid */}
                    <div className="lg:hidden grid grid-cols-1 gap-4">
                        {categories.map((category) => (
                            <div key={category.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-black text-slate-900 uppercase tracking-tight">{category.name}</span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${category.type === 'food' ? 'text-blue-500' : 'text-green-500'}`}>
                                        {category.type}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                    <span className="text-[10px] font-bold text-slate-400">
                                        {products.filter(p => p.category_id === category.id).length} sản phẩm
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditCategoryClick(category)} className="px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] active:scale-95">Sửa</button>
                                        <button onClick={() => handleDeleteCategory(category.id)} className="px-4 py-2.5 bg-slate-50 text-slate-300 rounded-xl font-black text-[10px] active:scale-95">Xóa</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
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
