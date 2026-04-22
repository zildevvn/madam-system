import React, { useState } from 'react';
import { useExpenseManagement } from '../hooks/useExpenseManagement';
import ExpenseFormModal from '../components/admin/ExpenseFormModal';
import ExpenseListDesktop from '../components/admin/ExpenseListDesktop';
import ExpenseListMobile from '../components/admin/ExpenseListMobile';
import ExpenseFilterHeader from '../components/admin/expenses/ExpenseFilterHeader';
import ExpenseAdvancedFilters from '../components/admin/expenses/ExpenseAdvancedFilters';

/**
 * Expense Management Page Component
 * WHY: Manages the expense dashboard state, filtering orchestration, and CRUD operations.
 * Adheres to <200 lines rule by further modularizing the filter segments which fixed the layout breakage.
 */
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
    
    // Filtering States
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); 
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString()); 
    const [monthFilter, setMonthFilter] = useState(''); 
    const [dateFilter, setDateFilter] = useState('');

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

    // WHY: Client-side filtering logic for optimized performance
    const filteredExpenses = expenses.filter(e => {
        const categoryLabel = allCategories.find(cat => cat.value === e.category)?.label || e.category;
        const matchesSearch = (e.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (categoryLabel?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'all' || e.type === typeFilter;
        const matchesDate = !dateFilter || e.date === dateFilter;
        
        const expenseYear = e.date?.split('-')[0];
        const expenseMonth = e.date?.split('-')[1];

        const matchesYear = !yearFilter || expenseYear === yearFilter;
        const matchesMonth = !monthFilter || expenseMonth === monthFilter;

        return matchesSearch && matchesType && matchesDate && matchesYear && matchesMonth;
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
                    <ExpenseFilterHeader 
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                    />

                    <button
                        onClick={handleAddExpense}
                        className="mdt-btn flex items-center justify-center gap-2 group self-stretch md:self-auto h-[52px]"
                    >
                        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        <span>Thêm chi tiêu</span>
                    </button>
                </div>

                {/* Advanced Filters Area */}
                <ExpenseAdvancedFilters 
                    yearFilter={yearFilter}
                    setYearFilter={setYearFilter}
                    monthFilter={monthFilter}
                    setMonthFilter={setMonthFilter}
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                />

                {error && (
                    <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-[11px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-4 animate-in shake duration-500 mt-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192-3 1.732-3z" /></svg>
                        {error}
                    </div>
                )}

                <div className="mt-6">
                    <ExpenseListDesktop
                        filteredExpenses={filteredExpenses}
                        allCategories={allCategories}
                        handleEditExpense={handleEditExpense}
                        deleteExpense={deleteExpense}
                    />

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
