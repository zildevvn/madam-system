import React, { useState } from 'react';
import { useExpenseManagement } from '../hooks/useExpenseManagement';
import ExpenseFormModal from '../components/admin/ExpenseFormModal';
import ExpenseListDesktop from '../components/admin/ExpenseListDesktop';
import ExpenseListMobile from '../components/admin/ExpenseListMobile';
import { formatPrice } from '../shared/utils/formatCurrency';

const ExpenseManagement = () => {
    const {
        expenses,
        loading,
        processing,
        error,
        addExpense,
        updateExpense,
        deleteExpense,
        categories,
        getAllCategories
    } = useExpenseManagement();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, fixed, variable

    const handleAddExpense = () => {
        setEditingExpense(null);
        setIsModalOpen(true);
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data) => {
        const success = editingExpense
            ? await updateExpense(editingExpense.id, data)
            : await addExpense(data);

        if (success) {
            setIsModalOpen(false);
        }
    };

    const allCategories = getAllCategories();

    const filteredExpenses = expenses.filter(e => {
        const categoryLabel = allCategories.find(cat => cat.value === e.category)?.label || e.category;
        const matchesSearch = (e.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (categoryLabel?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'all' || e.type === typeFilter;

        return matchesSearch && matchesType;
    });

    if (loading && expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang tải dữ liệu chi tiêu...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 py-5 lg:space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 overflow-x-hidden">
            <div className="w-full max-w-[1600px] mx-auto px-[20px]">
                {/* Header / Actions Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row flex-1 max-w-2xl gap-3">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm chi tiêu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="mdt-btn !text-[16px] !w-full !bg-white !pl-12 !pr-4 !py-3 placeholder:text-slate-300 focus:outline-none !text-slate-900 shadow-sm border border-slate-100"
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

                        <div className="max-w-fit mx-auto md:mx-0 flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 sm:w-auto h-[52px]">
                            {['all', 'variable', 'fixed'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`cursor-pointer px-4 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${typeFilter === type
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {type === 'all' ? 'Tất cả' : type === 'fixed' ? 'Cố định' : 'Biến đổi'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleAddExpense}
                        className="mdt-btn flex items-center justify-center gap-2 group self-stretch md:self-auto"
                    >
                        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        <span>Thêm chi tiêu</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-[11px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-4 animate-in shake duration-500 mt-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192-3 1.732-3z" /></svg>
                        {error}
                    </div>
                )}

                <div className="mt-6">
                    {/* Desktop Table View */}
                    <ExpenseListDesktop
                        filteredExpenses={filteredExpenses}
                        allCategories={allCategories}
                        handleEditExpense={handleEditExpense}
                        deleteExpense={deleteExpense}
                    />

                    {/* Mobile Card Grid View */}
                    <ExpenseListMobile
                        filteredExpenses={filteredExpenses}
                        allCategories={allCategories}
                        handleEditExpense={handleEditExpense}
                        deleteExpense={deleteExpense}
                    />

                    {filteredExpenses.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-200 mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">Không có dữ liệu chi tiêu nào</p>
                        </div>
                    )}
                </div>

                <ExpenseFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleFormSubmit}
                    expense={editingExpense}
                    categories={categories}
                    processing={processing}
                />
            </div>
        </div>
    );
};

export default ExpenseManagement;
