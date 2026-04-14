import React from 'react';

const ReservationMobileCards = ({ reservations, onView, onEdit, filterType, formatDate, formatTime }) => {
    return (
        <div className="md:hidden space-y-4">
            {reservations.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center text-gray-500 italic border border-gray-100">
                    No {filterType !== 'all' ? filterType : ''} reservations found.
                </div>
            ) : (
                reservations.map((r) => (
                    <div
                        key={r.id}
                        className={`
                            rounded-3xl p-5 shadow-sm border transition-all space-y-4
                            ${r.type === 'group' ? 'bg-purple-50/30 border-purple-100/50' : 'bg-blue-50/30 border-blue-100/50'}
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <svg className="text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{formatDate(r.reservation_date)} - {formatTime(r.reservation_time)}</span>
                                </div>
                                <span className="text-base font-black text-gray-900">{r.lead_name}</span>
                                {r.company_name && (
                                    <span className="text-[12px] text-gray-400 font-medium">{r.company_name}</span>
                                )}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm text-white ${r.type === 'group' ? 'mdt-bg-primary' : 'mdt-bg-blue'}`}>
                                    {r.type}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center bg-gray-50 p-3 rounded-2xl">
                            <div className="flex items-center gap-2">
                                <svg className="text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Guests:</span>
                                <span className="text-sm font-black text-gray-700">{r.number_of_guests}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={() => onView(r)}
                                className="py-3 bg-gray-100 text-gray-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all border-none cursor-pointer"
                            >
                                View Detail
                            </button>
                            <button
                                onClick={() => onEdit(r.id)}
                                className="py-3 bg-orange-100 text-orange-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-200 transition-all border-none cursor-pointer"
                            >
                                Edit Booking
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ReservationMobileCards;
