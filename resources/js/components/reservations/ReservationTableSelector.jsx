import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectTables, selectTableIdToGroupKey } from '../../store/selectors/tableSelectors';
import { fetchTables } from '../../store/slices/tableSlice';

const ReservationTableSelector = ({ selectedTables, onToggle }) => {
    const dispatch = useAppDispatch();
    const allTables = useAppSelector(selectTables);
    const tableIdToGroupKey = useAppSelector(selectTableIdToGroupKey);
    const tableStatus = useAppSelector(state => state.table.status);
    const [showTableDropdown, setShowTableDropdown] = useState(false);

    useEffect(() => {
        if (tableStatus === 'idle') {
            dispatch(fetchTables());
        }
    }, [tableStatus, dispatch]);

    // Exactly identical to MergeTableSelector logic to find available tables!
    // It filters out tables that have active orders and tables wrapped inside groups.
    const availableTables = allTables.filter(t => !t.active_order && !tableIdToGroupKey[t.id.toString()]);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setShowTableDropdown(!showTableDropdown)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[12px] font-black transition-all border ${selectedTables.length > 0 ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-100'} hover:border-orange-300 cursor-pointer w-full md:w-auto`}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                <span className="tracking-widest">
                    {selectedTables.length > 0 ? `Selected: ${selectedTables.length} Tables` : 'Select Tables'}
                </span>
                <svg className={`ml-auto transition-transform duration-200 ${showTableDropdown ? 'rotate-180' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </button>

            {showTableDropdown && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowTableDropdown(false)}></div>
                    <div className="absolute bottom-full mb-3 left-0 w-72 bg-white border border-gray-100 rounded-[30px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] z-[70] py-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="px-5 py-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Assign Tables</div>
                        <div className="max-h-64 overflow-y-auto px-2 mt-2 custom-scrollbar">
                            {availableTables.map(table => (
                                <label key={table.id} className="flex items-center px-4 py-3 hover:bg-orange-50/50 rounded-2xl cursor-pointer transition-all group">
                                    <div className="relative flex items-center shrink-0">
                                        <input
                                            type="checkbox"
                                            value={table.id}
                                            checked={selectedTables.includes(table.id.toString())}
                                            onChange={() => onToggle(table.id.toString())}
                                            className="w-5 h-5 rounded-lg border-gray-200 text-orange-500 focus:ring-orange-500 transition-all cursor-pointer accent-orange-500"
                                        />
                                    </div>
                                    <div className="ml-4 flex flex-col">
                                        <span className={`text-sm transition-colors ${selectedTables.includes(table.id.toString()) ? 'font-black text-orange-600' : 'text-gray-700 font-bold group-hover:text-gray-900'}`}>
                                            {table.name}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReservationTableSelector;
