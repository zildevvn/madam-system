import React from 'react';

const ReservationMobileCards = ({ reservations, onView, onEdit, onDone, filterType, formatDate, formatTime }) => {
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
                            rounded-xl p-2 shadow-sm transition-all space-y-2 bg-white
                            ${r.status === 'completed' ? 'opacity-50 line-through' : ''}
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <svg className="text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{formatDate(r.reservation_date)} - {formatTime(r.reservation_time)}</span>
                                </div>
                                <span className="text-base font-black text-gray-900">{r.type === 'group' ? r.tour_guide_name : r.lead_name}</span>
                                {r.company_name && (
                                    <span className="text-[12px] text-gray-400 font-medium">{r.company_name}</span>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-[11px] font-black uppercase ${r.type === 'group' ? 'mdt-text-primary' : 'mdt-text-blue '}`}>
                                    {r.type}
                                </span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100/30 rounded-lg">
                                    <svg className="text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                    <span className="text-[13px] font-black text-gray-700">{r.number_of_guests}</span>
                                </div>
                            </div>
                        </div>

                        <div className={`grid ${(r.type === 'individual' && r.status !== 'completed') ? 'grid-cols-3' : 'grid-cols-2'} gap-3 pt-2`}>
                            <button
                                onClick={() => onView(r)}
                                className="py-2 bg-gray-100 text-gray-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all border-none cursor-pointer"
                            >
                                View
                            </button>
                            <button
                                onClick={() => onEdit(r.id)}
                                className="py-2 bg-orange-100 text-orange-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-200 transition-all border-none cursor-pointer"
                            >
                                Edit
                            </button>
                            {r.type === 'individual' && r.status !== 'completed' && (
                                <button
                                    onClick={() => onDone(r)}
                                    className="py-2 bg-green-100 text-green-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-green-200 transition-all border-none cursor-pointer"
                                >
                                    Arrived
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ReservationMobileCards;
