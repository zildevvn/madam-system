import React, { useState } from 'react';
import { useTableManagement } from '../../hooks/useTableManagement';
import TableFormModal from '../../components/admin/TableFormModal';

const TableManagement = () => {
    const { tables, loading, processing, error, addTable, updateTable, deleteTable } = useTableManagement();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    const handleAdd = () => {
        setEditingTable(null);
        setIsModalOpen(true);
    };

    const handleEdit = (table) => {
        setEditingTable(table);
        setIsModalOpen(true);
    };

    const handleSubmit = async (data) => {
        const success = editingTable
            ? await updateTable(editingTable.id, data)
            : await addTable(data);

        if (success) {
            setIsModalOpen(false);
        }
    };

    const filteredTables = tables.filter(t =>
        (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading && tables.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-gray-500 font-medium">Đang tải danh sách bàn...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm bàn..."
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

                <button
                    onClick={handleAdd}
                    className="mdt-btn flex items-center justify-center group"
                >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    Thêm Bàn Mới
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Tên bàn</th>
                            <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredTables.map((table) => (
                            <tr key={table.id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="px-8 py-5 whitespace-nowrap text-[13px] font-bold text-gray-400">#{table.id}</td>
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                                        </div>
                                        <span className="text-base font-black text-gray-900">{table.name}</span>
                                    </div>
                                </td>

                                <td className="px-8 py-5 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(table)}
                                            className="p-2.5 text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                                            title="Sửa"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => deleteTable(table.id)}
                                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Xóa"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card Grid View */}
            <div className="md:hidden grid grid-cols-1 gap-3">
                {filteredTables.map((table) => (
                    <div key={table.id} className="bg-white px-4 py-3.5 rounded-[16px] shadow-sm border border-slate-100 group active:scale-95 transition-all">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                                </div>
                                <span className="text-base font-black text-slate-900 truncate leading-tight">{table.name}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handleEdit(table)}
                                    className="w-9 h-9 bg-slate-50 text-slate-600 rounded-xl hover:bg-orange-50 hover:text-orange-500 transition-all flex items-center justify-center border-none"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button
                                    onClick={() => deleteTable(table.id)}
                                    className="w-9 h-9 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center border-none"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredTables.length === 0 && (
                <div className="p-20 text-center bg-white rounded-[32px] border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                    </div>
                    <p className="text-gray-500 font-bold">Chưa có bàn nào được tạo.</p>
                    <button onClick={handleAdd} className="text-orange-500 font-black mt-2 hover:underline">Thêm bàn ngay</button>
                </div>
            )}

            <TableFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                table={editingTable}
                processing={processing}
            />
        </div>
    );
};

export default TableManagement;
