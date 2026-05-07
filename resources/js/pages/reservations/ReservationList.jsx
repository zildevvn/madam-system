import React, { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useReservations } from '../../hooks/useReservations';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { saveReservationAsync } from '../../store/slices/reservationSlice';
import ReservationDetailModal from '../../components/reservations/ReservationDetailModal';
import ReservationTable from '../../components/reservations/ReservationTable';
import ReservationMobileCards from '../../components/reservations/ReservationMobileCards';
import { capitalizeWords } from '../../shared/utils/formatCurrency';

const months = Array.from({ length: 12 }, (_, i) => ({
    full: new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(2021, i, 1)),
    short: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(2021, i, 1))
}));

const ReservationList = () => {
    const [filterType, setFilterType] = useState('all'); // 'all' | 'individual' | 'group'
    const [dateFilter, setDateFilter] = useState('today'); // 'today' | '1'...'12'

    // [STABILITY] Use a stable reference for the current time to avoid filter jumping on re-renders
    const [renderTime] = useState(new Date());

    const filters = useMemo(() => {
        const params = { type: filterType === 'all' ? null : filterType };
        if (dateFilter === 'today') {
            const y = renderTime.getFullYear();
            const m = String(renderTime.getMonth() + 1).padStart(2, '0');
            const d = String(renderTime.getDate()).padStart(2, '0');
            params.date = `${y}-${m}-${d}`;
        } else if (dateFilter === 'yesterday') {
            const yesterday = new Date(renderTime);
            yesterday.setDate(yesterday.getDate() - 1);
            const y = yesterday.getFullYear();
            const m = String(yesterday.getMonth() + 1).padStart(2, '0');
            const d = String(yesterday.getDate()).padStart(2, '0');
            params.date = `${y}-${m}-${d}`;
        } else if (dateFilter !== 'all') {
            params.month = dateFilter;
        }
        return params;
    }, [filterType, dateFilter, renderTime]);

    const { reservations, tables, loading } = useReservations(filters);
    const user = useAppSelector(state => state.auth.user);
    const dispatch = useAppDispatch();
    const [viewingReservation, setViewingReservation] = useState(null);
    const navigate = useNavigate();

    // [WHY] Prepare and sort reservations for the current view.
    // [FIX] Ensure items don't disappear due to aggressive "past booking" filters.
    const sortedReservations = useMemo(() => {
        if (!reservations || !Array.isArray(reservations)) return [];

        const activeNowMs = renderTime.getTime();
        const ONE_HOUR_MS = 60 * 60 * 1000;

        return reservations
            .map(r => {
                // [ROBUST] Safe date/time parsing
                const datePart = r.reservation_date ? r.reservation_date.split('T')[0] : '';
                const timePart = r.reservation_time ? r.reservation_time : '00:00';
                const timestamp = datePart ? new Date(`${datePart}T${timePart}`).getTime() : 0;
                return { ...r, _timestamp: timestamp || 0 };
            })
            .filter(r => {
                // [RULE] If showing Today or a specific Month, show ALL matching items for that period.
                // We only hide stale "pending" items if we were looking at a general "Upcoming Events" view.
                if (dateFilter === 'today' || dateFilter !== 'all') return true;

                const isCompleted = r.status === 'completed';
                const isRecentOrUpcoming = r._timestamp >= (activeNowMs - ONE_HOUR_MS);
                return isCompleted || isRecentOrUpcoming;
            })
            .sort((a, b) => {
                // [RULE] Completed items always go to the bottom
                const aDone = a.status === 'completed';
                const bDone = b.status === 'completed';
                if (aDone && !bDone) return 1;
                if (!aDone && bDone) return -1;

                // [RULE] Ascending chronological order
                return a._timestamp - b._timestamp;
            })
            .map(r => ({
                ...r,
                lead_name: capitalizeWords(r.lead_name || ''),
                tour_guide_name: capitalizeWords(r.tour_guide_name || ''),
                company_name: capitalizeWords(r.company_name || '')
            }));
    }, [reservations, dateFilter, renderTime]);

    const isManager = user?.role === 'cashier' || user?.role === 'admin';

    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5); // Return HH:mm
    };

    const formatDate = (date) => {
        if (!date) return '';
        const dateStr = typeof date === 'string' ? date.split('T')[0] : '';
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const [year, month, day] = parts;
        return `${day}-${month}-${year}`;
    };

    const handlers = useMemo(() => ({
        onView: (r) => setViewingReservation(r),
        onEdit: (id) => navigate(`/reservations/edit/${id}`),
        onDone: async (r) => {
            if (window.confirm(`Mark reservation for ${r.lead_name} as done?`)) {
                await dispatch(saveReservationAsync({
                    id: r.id,
                    data: { ...r, status: 'completed' }
                }));
            }
        }
    }), [navigate, dispatch]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-gray-900 tracking-tight">Reservation List</h3>
                </div>
                <Link to="/reservations/create" className="mdt-btn w-full sm:w-auto text-center">
                    + Create Reservation
                </Link>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
                {/* Type Filter */}
                <div className="flex bg-gray-100/80 p-1 rounded-[18px] w-fit shadow-inner border border-gray-200/50">
                    {['all', 'individual', 'group'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-2 py-1 md:px-3 md:py-2 md:rounded-[10px] rounded-[8px] md:text-[10px] text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${filterType === type ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Date Filter */}
                <div className="flex bg-gray-100/80 p-1 rounded-[10px] w-fit shadow-inner border border-gray-200/50 overflow-x-auto no-scrollbar max-w-full">
                    <button
                        onClick={() => setDateFilter('yesterday')}
                        className={`px-2 py-1 md:px-3 md:py-2  md:rounded-[10px] rounded-[8px] md:text-[10px] text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none whitespace-nowrap ${dateFilter === 'yesterday' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Yesterday
                    </button>

                    <button
                        onClick={() => setDateFilter('today')}
                        className={`px-2 py-1 md:px-3 md:py-2  md:rounded-[10px] rounded-[8px] md:text-[10px] text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none whitespace-nowrap ${dateFilter === 'today' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Today
                    </button>
                    <div className="w-[1px] bg-gray-200 mx-1 my-2" />
                    {months.map((month, idx) => (
                        <button
                            key={month.full}
                            onClick={() => setDateFilter((idx + 1).toString())}
                            className={`px-2 py-1 md:px-3 md:py-2  md:rounded-[10px] rounded-[8px] md:text-[10px] text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border-none whitespace-nowrap ${dateFilter === (idx + 1).toString() ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {month.short}
                        </button>
                    ))}
                </div>
            </div>

            {/* Statistics Summary Bar */}
            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {(() => {
                    const stats = [
                        { label: 'Total Bookings', value: sortedReservations.length, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'blue' },
                        { label: 'Total Guests', value: sortedReservations.reduce((sum, r) => sum + (r.number_of_guests || 0), 0), icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m12-9a4 4 0 11-8 0 4 4 0 018 0z', color: 'orange' },
                        { label: 'Individual', value: sortedReservations.filter(r => r.type === 'individual').length, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'teal' },
                        { label: 'Group', value: sortedReservations.filter(r => r.type === 'group').length, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5', color: 'purple' },
                    ];

                    return stats.map((stat, i) => (
                        <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-500 shadow-sm`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={stat.icon} />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                                <span className="text-xl font-black text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ));
                })()}
            </div> */}

            {/* Desktop View */}
            <ReservationTable
                reservations={sortedReservations}
                isManager={isManager}
                formatDate={formatDate}
                formatTime={formatTime}
                onView={handlers.onView}
                onEdit={handlers.onEdit}
                onDone={handlers.onDone}
            />

            {/* Mobile View */}
            <ReservationMobileCards
                reservations={sortedReservations}
                filterType={filterType}
                formatDate={formatDate}
                formatTime={formatTime}
                {...handlers}
            />

            <ReservationDetailModal
                reservation={viewingReservation}
                tables={tables}
                onClose={() => setViewingReservation(null)}
            />
        </div>
    );
};

export default ReservationList;

