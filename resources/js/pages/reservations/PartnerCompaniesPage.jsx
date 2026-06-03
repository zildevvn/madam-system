import React, { useState, useCallback } from 'react';
import { usePartnerCompanies } from '../../hooks/usePartnerCompanies';
import PartnerCompanyFormModal from '../../components/reservations/PartnerCompanyFormModal';
import Icon from '../../components/shared/Icon';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

const CompanyActions = ({ company, onEdit, onDelete, isMobile }) => {
    const editClass = isMobile
        ? "w-8 h-8 bg-slate-50 text-slate-600 rounded-lg hover:bg-orange-50 hover:text-orange-500 transition-all flex items-center justify-center border-none cursor-pointer"
        : "p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-all border-none bg-transparent cursor-pointer flex items-center justify-center";
    const deleteClass = isMobile
        ? "w-8 h-8 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center border-none cursor-pointer"
        : "p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all border-none bg-transparent cursor-pointer flex items-center justify-center";
    const iconSize = isMobile ? 16 : 18;
    const iconClass = isMobile ? "w-4 h-4" : "w-5 h-5";

    return (
        <div className={`flex items-center gap-1 ${!isMobile ? 'justify-end' : 'shrink-0'}`}>
            <button onClick={() => onEdit(company)} className={editClass} title="Sửa">
                <Icon name="pencil" className={iconClass} size={iconSize} />
            </button>
            <button onClick={() => onDelete(company)} className={deleteClass} title="Xóa">
                <Icon name="trash" className={iconClass} size={iconSize} />
            </button>
        </div>
    );
};

const companyFields = [
    {
        key: 'contact',
        label: 'Liên hệ',
        render: (company) => (
            <div className="flex flex-col gap-0.5">
                {company.phone && <span className="text-xs font-bold text-slate-800">{company.phone}</span>}
                {company.email && <span className="text-[11px] text-slate-400">{company.email}</span>}
                {!company.phone && !company.email && <span className="text-xs text-slate-300">-</span>}
            </div>
        )
    },
    {
        key: 'address',
        label: 'Địa chỉ',
        render: (company) => (
            <span className="text-xs font-bold text-slate-600 line-clamp-2 max-w-[240px]">
                {company.address || '-'}
            </span>
        )
    },
    {
        key: 'notes',
        label: 'Ghi chú',
        render: (company) => (
            <span className="text-xs text-slate-400 line-clamp-2 max-w-[200px]">
                {company.notes || '-'}
            </span>
        )
    }
];

const PartnerCompaniesPage = () => {
    const {
        companies,
        pagination,
        loading,
        error,
        processing,
        searchQuery,
        setSearchQuery,
        addCompany,
        updateCompany,
        deleteCompany,
        refresh
    } = usePartnerCompanies();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [deletingCompany, setDeletingCompany] = useState(null);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleAdd = useCallback(() => {
        setEditingCompany(null);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((company) => {
        setEditingCompany(company);
        setIsModalOpen(true);
    }, []);

    const handleSubmit = async (data) => {
        const success = editingCompany
            ? await updateCompany(editingCompany.id, data)
            : await addCompany(data);

        if (success) {
            setIsModalOpen(false);
        }
    };

    const handlePageChange = useCallback((page) => {
        refresh(page);
    }, [refresh]);

    const getPageNumbers = () => {
        const current = pagination.current_page;
        const last = pagination.last_page;
        const delta = 1;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= last; i++) {
            if (i === 1 || i === last || (i >= current - delta && i <= current + delta)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l > 2) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    };

    if (loading && companies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[24px] border border-slate-100 shadow-sm">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-slate-500 font-medium text-sm">Đang tải danh sách đối tác...</p>
            </div>
        );
    }

    return (
        <div className='max-w-7xl mx-auto p-4 lg:p-8'>
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                            <Icon name="search" className="w-5 h-5" size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm đối tác..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="mdt-btn !w-full !bg-white !pl-11 !pr-10 !py-2.5 placeholder:text-slate-300 focus:outline-none !text-slate-900 border border-slate-100"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                }}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <Icon name="close" className="w-4 h-4" size={16} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleAdd}
                        className="mdt-btn flex items-center justify-center group gap-1.5 whitespace-nowrap"
                    >
                        <Icon name="plus" className="w-5 h-5 group-hover:rotate-90 transition-transform" size={18} />
                        Thêm Đối Tác Mới
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3">
                        <Icon name="alert" className="w-5 h-5" size={20} />
                        {error}
                    </div>
                )}

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên đối tác</th>
                                {companyFields.map(field => (
                                    <th key={field.key} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {field.label}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {companies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                                <Icon name="user" className="w-5 h-5" size={18} />
                                            </div>
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[200px]">{company.name}</span>
                                        </div>
                                    </td>
                                    {companyFields.map(field => (
                                        <td key={field.key} className="px-6 py-4">
                                            {field.render(company)}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-right">
                                        <CompanyActions
                                            company={company}
                                            onEdit={handleEdit}
                                            onDelete={setDeletingCompany}
                                            isMobile={false}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Grid View */}
                <div className="md:hidden grid grid-cols-1 gap-3">
                    {companies.map((company) => (
                        <div key={company.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                        <Icon name="user" className="w-4 h-4" size={16} />
                                    </div>
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{company.name}</span>
                                </div>

                                <CompanyActions
                                    company={company}
                                    onEdit={handleEdit}
                                    onDelete={setDeletingCompany}
                                    isMobile={true}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-50">
                                <div>
                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Liên hệ</span>
                                    {companyFields[0].render(company)}
                                </div>
                                <div>
                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Địa chỉ</span>
                                    {companyFields[1].render(company)}
                                </div>
                            </div>

                            {company.notes && (
                                <div className="pt-2 border-t border-slate-50">
                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Ghi chú</span>
                                    {companyFields[2].render(company)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {companies.length === 0 && !loading && (
                    <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Icon name="briefcase" className="w-8 h-8" size={32} />
                        </div>
                        <p className="text-slate-500 font-bold text-sm">Chưa có đối tác nào được tạo.</p>
                        <button onClick={handleAdd} className="text-orange-500 font-black mt-1 hover:underline border-none bg-transparent cursor-pointer text-xs">Thêm đối tác ngay</button>
                    </div>
                )}

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-4">
                        <button
                            disabled={pagination.current_page === 1}
                            onClick={() => handlePageChange(pagination.current_page - 1)}
                            className="w-9 h-9 flex items-center justify-center bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
                        >
                            <Icon name="chevronLeft" size={16} />
                        </button>
                        {getPageNumbers().map((pageNum, index) => {
                            if (pageNum === '...') {
                                return (
                                    <span key={`dots-${index}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-xs font-bold">
                                        ...
                                    </span>
                                );
                            }
                            const isCurrent = pagination.current_page === pageNum;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-9 h-9 flex items-center justify-center font-bold text-xs rounded-xl border transition-all cursor-pointer ${isCurrent
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/25'
                                        : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => handlePageChange(pagination.current_page + 1)}
                            className="w-9 h-9 flex items-center justify-center bg-white text-slate-600 rounded-xl border border-slate-100 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
                        >
                            <Icon name="chevronRight" size={16} />
                        </button>
                    </div>
                )}
            </div>

            <PartnerCompanyFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                company={editingCompany}
                processing={processing}
            />

            <ConfirmDialog
                isOpen={!!deletingCompany}
                title="Xóa đối tác"
                message={`Bạn có chắc muốn xóa đối tác "${deletingCompany?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                type="danger"
                onConfirm={async () => {
                    if (deletingCompany) {
                        await deleteCompany(deletingCompany.id);
                        setDeletingCompany(null);
                    }
                }}
                onCancel={() => setDeletingCompany(null)}
            />
        </div>
    );
};

export default PartnerCompaniesPage;
