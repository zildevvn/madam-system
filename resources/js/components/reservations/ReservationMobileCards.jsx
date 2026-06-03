import React from 'react';
import Icon from '../shared/Icon';

const ReservationMobileCards = ({ reservations, onView, onEdit, onDone, onCancel, filterType, formatDate, formatTime }) => {
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
                            rounded-lg p-2 shadow-sm transition-all space-y-2 bg-white
                            ${r.status === 'completed' ? 'bg-emerald-50/20 border-l-4 border-l-emerald-500 border-y border-r border-y-emerald-100/30 border-r-emerald-100/30 opacity-75 line-through' : ''}
                            ${r.status === 'cancelled' ? 'bg-red-50/20 border-l-4 border-l-red-500 border-y border-r border-y-red-100/30 border-r-red-100/30 opacity-60 line-through' : ''}
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <Icon name="clock" className="text-gray-400" size={12} strokeWidth={3} />
                                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{formatTime(r.reservation_time)} - {formatDate(r.reservation_date)}</span>
                                    </div>
                                    {r.apply_vat && (
                                        <span className="px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase rounded-[4px] tracking-widest shadow-sm animate-in zoom-in duration-300">
                                            CÓ VAT
                                        </span>
                                    )}
                                </div>
                                <span className="text-[13px] font-black text-gray-900">
                                    {r.type === 'group' ? r.tour_guide_name : r.lead_name}
                                    {r.phone && ` | ${r.phone}`}
                                </span>
                                {r.company_name && (
                                    <span className="text-[12px] text-gray-400 font-medium">{r.company_name}</span>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-[11px] font-black uppercase ${r.type === 'group' ? 'mdt-text-primary' : 'mdt-text-blue '}`}>
                                    {r.type}
                                </span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100/30 rounded-lg">
                                    <Icon name="user" className="text-gray-400" size={12} strokeWidth={3} />
                                    <span className="text-[12px] font-black text-gray-700">{r.number_of_guests}</span>
                                </div>
                            </div>
                        </div>

                        {r.note && (
                            <div className="px-2">
                                <p className="text-[11px] text-gray-500 leading-relaxed italic line-clamp-2">
                                    "{r.note}"
                                </p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                            <button
                                onClick={() => onView(r)}
                                className="flex-1 min-w-[70px] py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all border-none cursor-pointer text-center"
                            >
                                View
                            </button>
                            <button
                                onClick={() => onEdit(r.id)}
                                className="flex-1 min-w-[70px] py-1.5 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-200 transition-all border-none cursor-pointer text-center"
                            >
                                Edit
                            </button>
                            {r.type === 'individual' && r.status !== 'completed' && r.status !== 'cancelled' && (
                                <button
                                    onClick={() => onDone(r)}
                                    className="flex-1 min-w-[70px] py-1.5 bg-green-100 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-200 transition-all border-none cursor-pointer text-center"
                                >
                                    Arrived
                                </button>
                            )}
                            {r.status !== 'completed' && r.status !== 'cancelled' && (
                                <button
                                    onClick={() => onCancel(r)}
                                    className="flex-1 min-w-[70px] py-1.5 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-all border-none cursor-pointer text-center"
                                >
                                    Cancel
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
