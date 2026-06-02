import React, { useState } from 'react';
import { useTableManagement } from '../../hooks/useTableManagement';
import TableFormModal from '../../components/admin/TableFormModal';
import Icon from '../../components/shared/Icon';

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
        <>
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                            <Icon name="search" className="w-5 h-5" size={20} />
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
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <Icon name="close" className="w-4 h-4" size={16} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleAdd}
                        className="mdt-btn flex items-center justify-center group gap-1.5"
                    >
                        <Icon name="plus" className="w-5 h-5 group-hover:rotate-90 transition-transform" size={20} />
                        Thêm Bàn Mới
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3">
                        <Icon name="alert" className="w-5 h-5" size={20} />
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
                                                <Icon name="grid" className="w-5 h-5" size={20} />
                                            </div>
                                            <span className="text-base font-black text-gray-900">{table.name}</span>
                                        </div>
                                    </td>

                                    <td className="px-8 py-5 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(table)}
                                                className="p-2.5 text-orange-500 hover:bg-orange-50 rounded-xl transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                                title="Sửa"
                                            >
                                                <Icon name="pencil" className="w-5 h-5" size={20} />
                                            </button>
                                            <button
                                                onClick={() => deleteTable(table.id)}
                                                className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                                                title="Xóa"
                                            >
                                                <Icon name="trash" className="w-5 h-5" size={20} />
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
                                        <Icon name="grid" className="w-5 h-5" size={20} />
                                    </div>
                                    <span className="text-base font-black text-slate-900 truncate leading-tight">{table.name}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleEdit(table)}
                                        className="w-9 h-9 bg-slate-50 text-slate-600 rounded-xl hover:bg-orange-50 hover:text-orange-500 transition-all flex items-center justify-center border-none cursor-pointer"
                                    >
                                        <Icon name="pencil" className="w-4 h-4" size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteTable(table.id)}
                                        className="w-9 h-9 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center border-none cursor-pointer"
                                    >
                                        <Icon name="trash" className="w-4 h-4" size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredTables.length === 0 && (
                    <div className="p-20 text-center bg-white rounded-[32px] border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                            <Icon name="grid" className="w-10 h-10" size={40} />
                        </div>
                        <p className="text-gray-500 font-bold">Chưa có bàn nào được tạo.</p>
                        <button onClick={handleAdd} className="text-orange-500 font-black mt-2 hover:underline border-none bg-transparent cursor-pointer">Thêm bàn ngay</button>
                    </div>
                )}


            </div>

            <TableFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                table={editingTable}
                processing={processing}
            />

        </>
    );
};

export default TableManagement;
