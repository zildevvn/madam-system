import React from 'react';
import { format, parseISO } from 'date-fns';
import { formatPrice } from '../../shared/utils/formatCurrency';
import Icon from '../shared/Icon';

const ExpenseListDesktop = ({ filteredExpenses, allCategories, handleEditExpense, deleteExpense }) => {
    return (
        <div className="hidden md:block bg-white rounded-[16px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>


                        <tr className="bg-slate-50/50">
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian / Loại</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh mục</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Lựa chọn</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredExpenses.map((expense) => (
                            <tr key={expense.id} className="group hover:bg-slate-50/40 transition-all">
                                <td className="px-2 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-10 rounded-full ${expense.type === 'fixed' ? 'bg-indigo-500' : 'bg-amber-500'}`} title={expense.type === 'fixed' ? 'Cố định' : 'Biến đổi'} />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                {expense.date ? format(parseISO(expense.date), 'dd-MM-yyyy') : '-'}
                                            </span>
                                            <span className="text-[10px] text-slate-800 font-black uppercase tracking-widest mt-0.5">
                                                {expense.type === 'fixed' ? 'Cố định' : 'Biến đổi'} • {expense.user?.name}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-2 py-3 whitespace-nowrap">
                                    <span className={`text-[14px] font-black  tracking-widest transition-all`}>
                                        {allCategories.find(c => c.value === expense.category)?.label || expense.category}
                                    </span>
                                </td>
                                <td className="px-2 py-3">
                                    <p className="text-[13px] text-slate-600 line-clamp-1 max-w-xs">{expense.description || '-'}</p>
                                </td>
                                <td className="px-2 py-3 whitespace-nowrap">
                                    <span className="text-base font-black text-red-500">{formatPrice(expense.amount)}</span>
                                </td>
                                <td className="px-2 py-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-3 opacity-40 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => handleEditExpense(expense)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-orange-500 hover:shadow-xl hover:border-orange-100 border border-transparent transition-all shadow-sm active:scale-90"
                                        >
                                            <Icon name="pencil" size={20} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => deleteExpense(expense.id)}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-red-500 hover:shadow-xl hover:border-red-100 border border-transparent transition-all shadow-sm active:scale-90"
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
        </div>
    );
};

export default ExpenseListDesktop;
