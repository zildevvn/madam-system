import React from 'react';

const ReservationTable = ({ reservations, onView, onEdit, onDone, isManager, formatTime, formatDate }) => {
    return (
        <div className="hidden md:block bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Booking Time</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Guests</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Note</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {reservations.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-10 text-center text-gray-500 italic">
                                    No reservations found.
                                </td>
                            </tr>
                        ) : (
                            reservations.map((r) => (
                                <tr
                                    key={r.id}
                                    className={`
                                        transition-colors
                                        ${r.status === 'completed' ? 'opacity-50 line-through' : ''}
                                        ${r.type === 'group' ? 'bg-purple-50/20 hover:bg-purple-50/50' : 'bg-blue-50/20 hover:bg-blue-50/50'}
                                    `}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-700">{formatDate(r.reservation_date)} - {formatTime(r.reservation_time)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-700">{r.type === 'group' ? r.tour_guide_name : r.lead_name}</span>
                                            {r.company_name && (
                                                <span className="text-[12px] text-gray-400 font-medium">{r.company_name}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <svg className="text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                            <span className="text-sm font-black text-gray-800">{r.number_of_guests}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className={`text-[11px] font-black uppercase ${r.type === 'group' ? 'mdt-text-primary' : 'mdt-text-blue '}`}>
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
                                                onClick={() => onView(r)}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 transition-all border-none cursor-pointer"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => onEdit(r.id)}
                                                className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-orange-200 transition-all border-none cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            {r.type === 'individual' && r.status !== 'completed' && (
                                                <button
                                                    onClick={() => onDone(r)}
                                                    className="px-3 py-1.5 bg-green-100 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-green-200 transition-all border-none cursor-pointer"
                                                >
                                                    Arrived
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
    );
};

export default ReservationTable;
