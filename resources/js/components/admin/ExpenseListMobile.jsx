import React from 'react';
import { format, parseISO } from 'date-fns';
import { formatPrice } from '../../shared/utils/formatCurrency';
import Icon from '../shared/Icon';

const ExpenseListMobile = ({ filteredExpenses, allCategories, handleEditExpense, deleteExpense }) => {
    return (
        <div className="md:hidden space-y-3 lg:space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 overflow-x-hidden">
            {filteredExpenses.map((expense) => (
                <div
                    key={expense.id}
                    className="bg-white px-2 py-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500 overflow-hidden w-full"
                >
                    {/* Header: Date & Type */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {expense.date ? format(parseISO(expense.date), 'dd-MM-yyyy') : '-'}
                            </span>
                            <span className="text-[13px] font-black mt-0.5 break-words">
                                {allCategories.find(c => c.value === expense.category)?.label || expense.category}
                            </span>
                        </div>

                        <div className={`flex-shrink-0 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${expense.type === 'fixed'
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50'
                            : 'bg-amber-50 text-amber-600 border-amber-100/50'
                            }`}>
                            {expense.type === 'fixed' ? 'Cố định' : 'Biến đổi'} • {expense.user?.name}

                        </div>
                    </div>

                    {/* Body: Description & Sub-info */}
                    <div className="flex items-center gap-2 justify-between">
                        <p className='text-[11px] text-slate-600 tracking-widest break-words w-full line-clamp-2'>
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
                                <Icon name="pencil" className="w-3 h-3" size={12} />
                            </button>
                            <button
                                onClick={() => deleteExpense(expense.id)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                            >
                                <Icon name="trash" className="w-3 h-3" size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


export default ExpenseListMobile;
