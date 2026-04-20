import React from 'react';

const ProductList = ({ filteredProducts, handleEditProduct, deleteProduct }) => {
    return (
        <>
            {/* Products Table (Desktop) */}
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

            {/* Products Grid (Mobile) */}
            <div className="lg:hidden grid grid-cols-1 gap-4">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white px-3 py-4 rounded-[16px] border border-slate-100 shadow-sm space-y-3">
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
                </div>
            )}
        </>
    );
};

export default ProductList;
