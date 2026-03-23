import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTables } from '../store/slices/tableSlice';
import TableGrid from '../components/TableGrid';

export default function StaffOrder() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { items: tables, status, error } = useAppSelector(state => state.table);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchTables());
        }
    }, [status, dispatch]);

    const loading = status === 'loading';

    const handleTableClick = (tableId) => {
        navigate(`/order/${tableId}`);
    };

    const emptyTablesCount = tables.filter(t => t.status?.toLowerCase() === 'available' || t.status?.toLowerCase() === 'empty').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="md-management-page pb-20">
            <div className="bg-white py-3 border-t border-b border-gray-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 w-full max-w-[1200px] mx-auto px-[20px] justify-between">
                    <p className="item-info flex items-center gap-1 m-0 text-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        Tổng số đơn hiện tại: 8
                    </p>

                    <p className="item-info flex items-center gap-1 m-0 text-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Bàn trống {emptyTablesCount}/{tables.length}
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="md-management-page__content py-8">
                <div className="w-full max-w-[1200px] mx-auto px-[20px] flex items-start gap-3 md:gap-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <TableGrid
                        tables={tables}
                        onTableClick={handleTableClick}
                        error={error}
                    />
                </div>
            </div>
        </div>
    );
}