import React from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';

const ExpenseListMobile = ({ filteredExpenses, allCategories, handleEditExpense, deleteExpense }) => {
    return (
        <div className="md:hidden space-y-4">
            {filteredExpenses.map((expense) => (
                <div
                    key={expense.id}
                    className="bg-white px-2 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                    {/* Header: Date & Type */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{expense.date}</span>
                            <span className="text-[10px] text-slate-800 font-black uppercase tracking-widest mt-0.5">
                                {expense.type === 'fixed' ? 'Cố định' : 'Biến đổi'} • {expense.user?.name}
                            </span>
                        </div>

                        <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${expense.type === 'fixed'
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50'
                            : 'bg-amber-50 text-amber-600 border-amber-100/50'
                            }`}>
                            {allCategories.find(c => c.value === expense.category)?.label || expense.category}
                        </div>
                    </div>

                    {/* Body: Description & Sub-info */}
                    <div className="flex items-center gap-2 justify-between">
                        <p className='text-[11px] text-slate-400 tracking-widest'>
                            {expense.description || 'Không có mô tả'}
                        </p>
                    </div>

                    {/* Footer: Amount & Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 gap-4">
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-red-500 tracking-tight">
                                {formatPrice(expense.amount)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleEditExpense(expense)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all active:scale-90"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button
                                onClick={() => deleteExpense(expense.id)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


export default ExpenseListMobile;
