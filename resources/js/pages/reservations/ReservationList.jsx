import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useReservations } from '../../hooks/useReservations';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { saveReservationAsync } from '../../store/slices/reservationSlice';
import ReservationDetailModal from '../../components/reservations/ReservationDetailModal';
import ReservationTable from '../../components/reservations/ReservationTable';
import ReservationMobileCards from '../../components/reservations/ReservationMobileCards';
import { capitalizeWords } from '../../shared/utils/formatCurrency';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const ReservationList = () => {
    const [filterType, setFilterType] = useState('all'); // 'all' | 'individual' | 'group'
    const [dateFilter, setDateFilter] = useState('today'); // 'today' | '1'...'12'
    
    const filters = useMemo(() => {
        const params = { type: filterType === 'all' ? null : filterType };
        if (dateFilter === 'today') {
            params.date = format(new Date(), 'yyyy-MM-dd');
        } else if (dateFilter !== 'all') {
            params.month = dateFilter;
        }
        return params;
    }, [filterType, dateFilter]);

    const { reservations, tables, loading } = useReservations(filters);
    const user = useAppSelector(state => state.auth.user);
    const dispatch = useAppDispatch();
    const [viewingReservation, setViewingReservation] = useState(null);
    const navigate = useNavigate();

    // [WHY] Filter out past reservations and sort chronologically by full datetime
    const sortedReservations = useMemo(() => {
        if (!reservations || reservations.length === 0) return [];

        const now = new Date().getTime();

        return [...reservations]
            .filter(r => {
                // [RULE] If showing a specific month, show everything. If "Today", only show active/upcoming/completed.
                if (dateFilter !== 'today' && dateFilter !== 'all') return true;

                const now = new Date().getTime();
                const datePart = typeof r.reservation_date === 'string' ? r.reservation_date.split('T')[0] : '';
                const timestamp = new Date(`${datePart}T${r.reservation_time}`).getTime();
                
                // [RULE] Hide past bookings (compare full datetime) but keep those within 1 hour or marked as completed
                return timestamp >= (now - 3600000) || r.status === 'completed';
            })
            .map(r => ({
                ...r,
                lead_name: capitalizeWords(r.lead_name),
                tour_guide_name: capitalizeWords(r.tour_guide_name),
                company_name: capitalizeWords(r.company_name)
            }))
            .sort((a, b) => {
                // [RULE] Completed items always go to the bottom
                if (a.status === 'completed' && b.status !== 'completed') return 1;
                if (a.status !== 'completed' && b.status === 'completed') return -1;

                const parseToTimestamp = (d, t) => {
                    const datePart = typeof d === 'string' ? d.split('T')[0] : '';
                    return new Date(`${datePart}T${t}`).getTime();
                };

                const timestampA = parseToTimestamp(a.reservation_date, a.reservation_time);
                const timestampB = parseToTimestamp(b.reservation_date, b.reservation_time);

                // [RULE] Earlier time comes first (ascending chronological)
                return timestampA - timestampB;
            });
    }, [reservations]);

    const isManager = user?.role === 'cashier' || user?.role === 'admin';

    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5); // Return HH:mm
    };

    const formatDate = (date) => {
        if (!date) return '';
        return typeof date === 'string' ? date.split('T')[0] : '';
    };

    const handlers = {
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
    };

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
                            className={`px-4 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${filterType === type ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Date Filter */}
                <div className="flex bg-gray-100/80 p-1 rounded-[18px] w-fit shadow-inner border border-gray-200/50 overflow-x-auto no-scrollbar max-w-full">
                    <button
                        onClick={() => setDateFilter('today')}
                        className={`px-6 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none whitespace-nowrap ${dateFilter === 'today' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Today
                    </button>
                    <div className="w-[1px] bg-gray-200 mx-1 my-2" />
                    {months.map((month, idx) => (
                        <button
                            key={month}
                            onClick={() => setDateFilter((idx + 1).toString())}
                            className={`px-4 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none whitespace-nowrap ${dateFilter === (idx + 1).toString() ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {month.substring(0, 3)}
                        </button>
                    ))}
                </div>
            </div>

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

