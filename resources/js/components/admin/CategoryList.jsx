import React from 'react';

const CategoryList = ({ categories, products, handleEditCategoryClick, handleDeleteCategory }) => {
    return (
        <>
            {/* Categories Table (Desktop) */}
            <div className="hidden lg:block bg-white rounded-[16px] border border-slate-100 shadow-sm overflow-hidden">
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
                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${category.type === 'food'
                                            ? 'bg-blue-50 text-blue-500 border-blue-100'
                                            : 'bg-green-50 text-green-500 border-green-100'
                                            }`}>
                                            {category.type === 'food' ? 'Thức ăn' : 'Đồ uống'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className="text-sm font-bold text-slate-400">{productCount} món</span>
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
            <div className="lg:hidden grid grid-cols-1 gap-3">
                {categories.map((category) => (
                    <div key={category.id} className="bg-white px-4 py-3.5 rounded-[16px] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${category.type === 'food' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01" />
                                    </svg>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-base font-black text-slate-900 uppercase tracking-tight truncate leading-tight">{category.name}</span>
                                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                        {products.filter(p => p.category_id === category.id).length} sản phẩm
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    onClick={() => handleEditCategoryClick(category)}
                                    className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-orange-50 hover:text-orange-500 transition-all active:scale-95 border-none cursor-pointer"
                                    title="Sửa"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-95 border-none cursor-pointer"
                                    title="Xóa"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default CategoryList;
