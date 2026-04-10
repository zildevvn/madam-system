import React from 'react';

const ReservationDetailModal = ({ reservation, tables, onClose }) => {
    if (!reservation) return null;

    const assignedTableNames = tables
        .filter(t => reservation.table_ids?.includes(t.id.toString()) || reservation.table_id === t.id)
        .map(t => t.name)
        .join(', ') || 'Not Assigned';

    const cardClasses = "bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 transition-all hover:bg-white hover:shadow-sm";
    const labelClasses = "text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] block mb-1";
    const valueClasses = "text-[13px] font-black text-gray-800 block";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-2xl rounded-[16px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header Section */}
                <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${reservation.type === 'group' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                            {reservation.type === 'group' ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            )}
                        </div>
                        <div>
                            <h4 className="text-gray-900 m-0 leading-tight">{reservation.lead_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${reservation.type === 'group' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {reservation.type}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all border-none cursor-pointer text-gray-400 hover:text-gray-900">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content Section */}
                <div className="p-3 overflow-y-auto custom-scrollbar flex-1 space-y-8">

                    {/* Primary Contact Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={cardClasses}>
                            <span className={labelClasses}>Phone Number</span>
                            <span className={valueClasses}>{reservation.phone || 'N/A'}</span>
                        </div>
                        <div className={cardClasses}>
                            <span className={labelClasses}>Email Address</span>
                            <span className={valueClasses}>{reservation.email || 'No email provided'}</span>
                        </div>
                    </div>

                    {/* Booking Logistics */}
                    <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Booking Logistics</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className={labelClasses}>Date</span>
                                <span className={valueClasses}>{reservation.reservation_date ? reservation.reservation_date.toString().split('T')[0] : 'N/A'}</span>
                            </div>
                            <div>
                                <span className={labelClasses}>Time</span>
                                <span className={valueClasses}>{reservation.reservation_time ? reservation.reservation_time.substring(0, 5) : 'N/A'}</span>
                            </div>
                            <div>
                                <span className={labelClasses}>Guests</span>
                                <span className={valueClasses}>{reservation.number_of_guests} Persons</span>
                            </div>
                            <div>
                                <span className={labelClasses}>Nationality</span>
                                <span className={valueClasses}>{reservation.nationality || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Location & Tables */}
                    <div className="bg-orange-50/30 p-5 rounded-[24px] border border-orange-100/50">
                        <div className="flex items-center gap-3 mb-1">
                            <svg className="text-orange-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">Table Assignments</span>
                        </div>
                        <span className="text-base font-black text-gray-900">{assignedTableNames}</span>
                    </div>

                    {/* Group & Business Info */}
                    {reservation.type === 'group' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                <div>
                                    <span className={labelClasses}>Tour Guide</span>
                                    <span className={valueClasses}>{reservation.tour_guide_name || 'Individual Booking'}</span>
                                </div>
                                <div>
                                    <span className={labelClasses}>Company / Organization</span>
                                    <span className={valueClasses}>{reservation.company_name || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Pre-ordered Dishes</span>
                                <div className="bg-gray-50/50 rounded-[24px] border border-gray-100/80 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-100/30">
                                                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item</th>
                                                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                                                <th className="px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Unit Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100/50">
                                            {reservation.dishes?.map((dish, i) => (
                                                <tr key={i} className="hover:bg-white transition-colors">
                                                    <td className="px-5 py-4 font-bold text-gray-800 text-sm">{dish.name}</td>
                                                    <td className="px-5 py-4 font-black text-gray-700 text-sm text-center bg-gray-100/20">{dish.quantity}</td>
                                                    <td className="px-5 py-4 font-black text-orange-600 text-sm text-right">{(Number(dish.price) || 0).toLocaleString()} ₫</td>
                                                </tr>
                                            ))}
                                            {(!reservation.dishes || reservation.dishes.length === 0) && (
                                                <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-400 italic text-xs">No specific dishes pre-ordered.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Note Section */}
                    <div>
                        <span className={labelClasses}>Internal Notes & Special Requests</span>
                        <div className="bg-gray-50 p-5 rounded-[24px] border border-dashed border-gray-200 text-[13px] text-gray-600 leading-relaxed min-h-[80px]">
                            {reservation.note || "No special requests or additional information recorded for this reservation."}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 bg-gray-900 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)] hover:translate-y-0.5 active:scale-[0.98] transition-all border-none cursor-pointer">
                        Close Information
                    </button>
                    {reservation.type === 'group' && (
                        <div className="w-14"> {/* Placeholder or secondary action space */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationDetailModal;

