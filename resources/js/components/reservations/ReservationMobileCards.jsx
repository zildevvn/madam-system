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
                                onClick={() => onView(r)}
                                className="py-3 bg-gray-100 text-gray-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all border-none cursor-pointer"
                            >
                                View Detail
                            </button>
                            {r.type === 'group' && (
                                <button
                                    onClick={() => onEdit(r.id)}
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
    );
};

export default ReservationMobileCards;
