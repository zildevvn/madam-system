import React, { useState, useEffect } from 'react';
import Icon from '../shared/Icon';

const ProductList = ({ filteredProducts, handleEditProduct, deleteProduct }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Total pages calculation
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Slice products for current page
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filtered items change (search/filter)
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredProducts.length]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        // Scroll to top of list area for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-6">
            {/* Products Table (Desktop) */}
            <div className="hidden lg:block bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden">
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
                        {paginatedProducts.map((product) => (
                            <tr key={product.id} className="group hover:bg-slate-50/30 transition-all">
                                <td className="px-8 py-6 whitespace-nowrap">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                            {product.image ? (
                                                <img
                                                    src={product.image.startsWith('http') ? product.image : `/storage/${product.image}`}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Icon name="image" size={24} strokeWidth={2} className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors tracking-tight">
                                                {product.name_vi ? `${product.name_vi} - ${product.name}` : product.name}
                                            </span>

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
                                    <span className="text-base font-black text-slate-900">{new Intl.NumberFormat('vi-VN').format(product.price)}đ</span>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-40 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => handleEditProduct(product)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-orange-50 hover:text-orange-500 rounded-xl transition-all active:scale-90 cursor-pointer"
                                        >
                                            <Icon name="pencil" size={20} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => deleteProduct(product.id)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-90 cursor-pointer"
                                        >
                                            <Icon name="trash" size={20} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Products Grid (Mobile) */}
            <div className="lg:hidden grid grid-cols-1 gap-4">
                {paginatedProducts.map((product) => (
                    <div key={product.id} className="bg-white px-3 py-4 rounded-[16px] border border-slate-100 shadow-sm space-y-3">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100">
                                {product.image ? (
                                    <img
                                        src={product.image.startsWith('http') ? product.image : `/storage/${product.image}`}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Icon name="image" size={24} strokeWidth={2.5} className="w-6 h-6 text-slate-200" />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-black text-slate-900 truncate uppercase tracking-tight leading-tight">
                                    {product.name_vi ? `${product.name_vi} - ${product.name}` : product.name}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.category?.name || 'Uncategorized'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <span className="text-[14px] font-black text-slate-900">{new Intl.NumberFormat('vi-VN').format(product.price)}đ</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleEditProduct(product)} className="cursor-pointer px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Sửa</button>
                                <button onClick={() => deleteProduct(product.id)} className="cursor-pointer px-4 py-2.5 bg-slate-50 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Xóa</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-[48px] border border-slate-100 shadow-sm border-dashed">
                    <h3 className="text-xl font-black text-slate-900 mb-2">Chưa có sản phẩm nào.</h3>
                </div>
            ) : totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Hiển thị <span className="text-slate-900">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> trên <span className="text-slate-900">{filteredProducts.length}</span> sản phẩm
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90 cursor-pointer"
                        >
                            <Icon name="chevronLeft" size={20} strokeWidth={2.5} className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1.5">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`w-11 h-11 flex items-center justify-center rounded-2xl text-[11px] font-black transition-all active:scale-90 cursor-pointer ${currentPage === i + 1
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                        : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-sm'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90 cursor-pointer"
                        >
                            <Icon name="chevronRight" size={20} strokeWidth={2.5} className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;

