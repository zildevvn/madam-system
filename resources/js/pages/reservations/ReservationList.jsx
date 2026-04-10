import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useReservations } from '../../hooks/useReservations';
import ReservationDetailModal from '../../components/reservations/ReservationDetailModal';

const ReservationList = () => {
    const { reservations, tables, loading } = useReservations();
    const [viewingReservation, setViewingReservation] = useState(null);
    const [filterType, setFilterType] = useState('all'); // 'all' | 'individual' | 'group'
    const navigate = useNavigate();

    const filteredReservations = reservations.filter(r => {
        if (filterType === 'all') return true;
        return r.type === filterType;
    });

    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5); // Return HH:mm
    };

    const formatDate = (date) => {
        if (!date) return '';
        return date.split('T')[0]; // Return YYYY-MM-DD
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
                <button
                    onClick={() => setFilterType('all')}
                    className={`px-6 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${filterType === 'all' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilterType('individual')}
                    className={`px-6 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${filterType === 'individual' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Individual
                </button>
                <button
                    onClick={() => setFilterType('group')}
                    className={`px-6 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${filterType === 'group' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Group
                </button>
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Booking Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Note</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredReservations.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500 italic">
                                        No {filterType !== 'all' ? filterType : ''} reservations found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReservations.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-700">{r.lead_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-gray-700">{formatDate(r.reservation_date)} - {formatTime(r.reservation_time)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${r.type === 'group' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {r.type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-gray-500 truncate block max-w-[150px]">{r.note || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setViewingReservation(r)}
                                                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 transition-all border-none cursor-pointer"
                                                >
                                                    View
                                                </button>
                                                {r.type === 'group' && (
                                                    <button
                                                        onClick={() => navigate(`/reservations/edit/${r.id}`)}
                                                        className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-orange-200 transition-all border-none cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View - Card List */}
            <div className="md:hidden space-y-4">
                {filteredReservations.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center text-gray-500 italic border border-gray-100">
                        No {filterType !== 'all' ? filterType : ''} reservations found.
                    </div>
                ) : (
                    filteredReservations.map((r) => (
                        <div key={r.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-base font-black text-gray-900">{r.lead_name}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${r.type === 'group' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {r.type}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl">
                                <div className="flex flex-col flex-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</span>
                                    <span className="text-sm font-black text-gray-700">{formatDate(r.reservation_date)}</span>
                                </div>
                                <div className="w-[1px] h-8 bg-gray-200"></div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</span>
                                    <span className="text-sm font-black text-gray-700">{formatTime(r.reservation_time)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => setViewingReservation(r)}
                                    className="py-3 bg-gray-100 text-gray-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all border-none cursor-pointer"
                                >
                                    View Detail
                                </button>
                                {r.type === 'group' && (
                                    <button
                                        onClick={() => navigate(`/reservations/edit/${r.id}`)}
                                        className="py-3 bg-orange-100 text-orange-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-200 transition-all border-none cursor-pointer"
                                    >
                                        Edit Booking
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ReservationDetailModal
                reservation={viewingReservation}
                tables={tables}
                onClose={() => setViewingReservation(null)}
            />
        </div>
    );
};

export default ReservationList;
