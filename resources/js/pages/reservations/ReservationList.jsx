import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { format, isBefore, isAfter, startOfDay } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, FilterX } from 'lucide-react';
import { useReservations } from '../../hooks/useReservations';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { saveReservationAsync } from '../../store/slices/reservationSlice';
import ReservationDetailModal from '../../components/reservations/ReservationDetailModal';
import ReservationTable from '../../components/reservations/ReservationTable';
import ReservationMobileCards from '../../components/reservations/ReservationMobileCards';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar } from '../../components/ui/calendar';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { capitalizeWords } from '../../shared/utils/formatCurrency';

const months = Array.from({ length: 12 }, (_, i) => ({
    full: new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(2021, i, 1)),
    short: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(2021, i, 1))
}));

const ReservationList = () => {
    const [filterType, setFilterType] = useState('all'); // 'all' | 'individual' | 'group'
    const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'yesterday' | 'range' | '1'...'12'
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
    const [isDragging, setIsDragging] = useState(false);

    // [DRAG-TO-SELECT] Implementation for smoother desktop interaction
    useEffect(() => {
        const handleGlobalPointerUp = () => setIsDragging(false);
        window.addEventListener('pointerup', handleGlobalPointerUp);
        return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
    }, []);

    const handleDayPointerDown = useCallback((day) => {
        setIsDragging(true);
        const d = startOfDay(day);
        setDateRange({ from: d, to: d });
        setDateFilter('range');
    }, []);

    const handleDayPointerEnter = useCallback((day) => {
        if (!isDragging || !dateRange.from) return;

        const current = startOfDay(day);
        const from = dateRange.from;

        if (isBefore(current, from)) {
            setDateRange({ from: current, to: from });
        } else {
            setDateRange({ from: from, to: current });
        }
    }, [isDragging, dateRange.from]);

    // [STABILITY] Use a stable reference for the current time to avoid filter jumping on re-renders
    const [renderTime] = useState(new Date());

    const filters = useMemo(() => {
        const params = { type: filterType === 'all' ? null : filterType };

        if (dateFilter === 'range' && dateRange?.from) {
            params.start_date = format(dateRange.from, 'yyyy-MM-dd');
            params.end_date = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : params.start_date;
        } else if (dateFilter === 'today') {
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
    }, [filterType, dateFilter, dateRange, renderTime]);

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

                {/* Date Filter */}
                <div className="flex min-w-full justify-between bg-gray-100/80 p-1 rounded-[10px] w-fit shadow-inner border border-gray-200/50 overflow-x-auto no-scrollbar max-w-full">
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

                {/* Custom Date Range Filter */}
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={`h-[42px] px-4 rounded-[18px] bg-gray-100/80 border-gray-200/50 shadow-inner flex items-center gap-2 transition-all group ${dateFilter === 'range' ? 'bg-white border-orange-200 ring-1 ring-orange-100' : ''}`}
                            >
                                <CalendarIcon className={`w-3.5 h-3.5 ${dateFilter === 'range' ? 'text-orange-500' : 'text-gray-400'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${dateFilter === 'range' ? 'text-orange-500' : 'text-gray-400'}`}>
                                    {dateFilter === 'range' && dateRange?.from ? (
                                        dateRange.to ? (
                                            `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM/yy')}`
                                        ) : (
                                            format(dateRange.from, 'dd/MM/yyyy')
                                        )
                                    ) : (
                                        'dd/MM/yyyy'
                                    )}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={(range) => {
                                    if (!isDragging) {
                                        setDateRange(range || { from: undefined, to: undefined });
                                        if (range?.from && dateFilter !== 'range') {
                                            setDateFilter('range');
                                        }
                                    }
                                }}
                                onDayPointerDown={handleDayPointerDown}
                                onDayPointerEnter={handleDayPointerEnter}
                                numberOfMonths={1}
                                className={cn("rounded-md border shadow", isDragging && "select-none")}
                                classNames={{
                                    outside: "opacity-100 text-slate-900 hover:bg-slate-100 rounded-md aria-selected:bg-orange-600 aria-selected:text-white aria-selected:opacity-100"
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    {dateFilter === 'range' && (
                        <button
                            onClick={() => {
                                setDateFilter('today');
                                setDateRange({ from: undefined, to: undefined });
                            }}
                            className="p-2.5 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                            title="Clear Range"
                        >
                            <FilterX className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Statistics Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {(() => {
                    const stats = [
                        { label: 'Total Bookings', value: sortedReservations.length, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'blue' },
                        { label: 'Individual', value: sortedReservations.filter(r => r.type === 'individual').length, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'teal' },
                        { label: 'Group', value: sortedReservations.filter(r => r.type === 'group').length, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5', color: 'purple' },
                        { label: 'VAT Bookings', value: sortedReservations.filter(r => r.apply_vat).length, icon: 'M9 14l6-6m-5.5.5h.5m.5.5h.5m.5.5h.5m.5.5h.5m.5.5h.5m.5.5h.5m.5.5h.5m.5.5h.5m.5.5h.5m.5.5h.5M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z', color: 'orange' },
                    ];

                    return stats.map((stat, i) => (
                        <div key={i} className="flex items-center gap-2" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-center w-full gap-1">
                                <span className="text-[11px] md:text-[13px] font-black text-gray-900 tracking-widest uppercase">{stat.label}:</span>
                                <span className="text-[11px] md:text-[13px] font-black text-gray-900 tracking-tight">{stat.value}</span>
                            </div>
                        </div>
                    ));
                })()}
            </div>

            {/* Desktop View */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <>
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
                </>
            )}

            <ReservationDetailModal
                reservation={viewingReservation}
                tables={tables}
                onClose={() => setViewingReservation(null)}
            />
        </div>
    );
};

export default ReservationList;

