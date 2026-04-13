import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useReservations } from '../../hooks/useReservations';
import { useAppSelector } from '../../store/hooks';
import ReservationDetailModal from '../../components/reservations/ReservationDetailModal';
import ReservationTable from '../../components/reservations/ReservationTable';
import ReservationMobileCards from '../../components/reservations/ReservationMobileCards';

const ReservationList = () => {
    const [filterType, setFilterType] = useState('all'); // 'all' | 'individual' | 'group'
    const { reservations, tables, loading } = useReservations(filterType === 'all' ? null : filterType);
    const { user } = useAppSelector(state => state.auth);
    const [viewingReservation, setViewingReservation] = useState(null);
    const navigate = useNavigate();

    // [WHY] Filter out past reservations and sort chronologically by full datetime
    const sortedReservations = useMemo(() => {
        if (!reservations || reservations.length === 0) return [];
        
        const now = new Date().getTime();

        return [...reservations]
            .filter(r => {
                // [RULE] Hide past bookings (compare full datetime) and completed bookings
                const datePart = typeof r.reservation_date === 'string' ? r.reservation_date.split('T')[0] : '';
                const timestamp = new Date(`${datePart}T${r.reservation_time}`).getTime();
                return timestamp >= now && r.status !== 'completed';
            })
            .sort((a, b) => {
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
        onEdit: (id) => navigate(`/reservations/edit/${id}`)
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
                    <p className="text-sm text-gray-500">Manage all incoming individual and group bookings.</p>
                </div>
                <Link to="/reservations/create" className="mdt-btn w-full sm:w-auto text-center">
                    + Create Reservation
                </Link>
            </div>

            <div className="flex bg-gray-100/80 p-1 rounded-[18px] w-fit mb-6 shadow-inner border border-gray-200/50">
                {['all', 'individual', 'group'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-6 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${filterType === type ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            {/* Desktop View */}
            <ReservationTable 
                reservations={sortedReservations}
                isManager={isManager}
                formatDate={formatDate}
                formatTime={formatTime}
                onView={handlers.onView}
                onEdit={handlers.onEdit}
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

