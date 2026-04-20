import React from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';

const ReservationDetailModal = ({ reservation, tables, onClose }) => {
    if (!reservation) return null;

    const isGroup = reservation.type === 'group';

    // Refined styles for high-density layout
    const labelStyle = "text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-0.5 block";
    const valueStyle = "text-[13px] sm:text-[14px] font-bold text-gray-800 block";

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-[2px] animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="relative bg-[#FAFAFA] w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500 flex flex-col font-primary">

                {/* Mobile Drag Handle */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden bg-white">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                </div>

                {/* Clean Minimalist Header */}
                <div className="px-3 py-3 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-20 font-second">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={`w-2 h-2 rounded-full ${isGroup ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{reservation.type} Booking</span>
                        </div>
                        <h3 className="text-gray-900 m-0 tracking-tight leading-tight truncate pr-4 text-lg">
                            {isGroup ? (reservation.tour_guide_name || 'Group Booking') : reservation.lead_name}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl transition-all border-none cursor-pointer flex-shrink-0"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto mdt-scrollbar px-3 py-4 space-y-4">

                    {/* Overview Bar - 2 Columns on Mobile, Single Row on Desktop */}
                    <div className="grid grid-cols-2 lg:flex lg:flex-wrap lg:items-center gap-4 lg:gap-x-12 lg:gap-y-4 p-3">
                        <div className="flex-shrink-0">
                            <span className={labelStyle}>Date</span>
                            <span className={valueStyle}>{reservation.reservation_date?.toString().split('T')[0] || 'N/A'}</span>
                        </div>
                        <div className="flex-shrink-0">
                            <span className={labelStyle}>Time</span>
                            <span className={valueStyle}>{reservation.reservation_time?.substring(0, 5) || 'N/A'}</span>
                        </div>
                        <div className="flex-shrink-0">
                            <span className={labelStyle}>Guests</span>
                            <span className={valueStyle}>{reservation.number_of_guests} Persons</span>
                        </div>
                        <div className="flex-shrink-0">
                            <span className={labelStyle}>Nationality</span>
                            <span className={valueStyle}>{reservation.nationality || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Location & Assignments - SINGLE ROW MERGE */}
                    {isGroup && (
                        <div className="flex flex-wrap items-center gap-4 px-1 py-1">
                            <div className="flex items-center gap-2 text-[11px] sm:text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] whitespace-nowrap">
                                <svg className="text-orange-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                Tables:
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tables.filter(t => reservation.table_ids?.includes(t.id.toString()) || reservation.table_id === t.id).map(t => (
                                    <div key={t.id} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></div>
                                        <span className="text-[12px] font-black text-gray-800 tracking-tight">{t.name}</span>
                                    </div>
                                ))}
                                {tables.filter(t => reservation.table_ids?.includes(t.id.toString()) || reservation.table_id === t.id).length === 0 && (
                                    <span className="text-gray-400 italic text-[11px] font-bold uppercase tracking-widest py-1 px-3 bg-gray-50 rounded-lg">Not assigned</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contact Intelligence - More Compact */}
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block px-1">Contact Details</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-1">
                            <div>
                                <span className={labelStyle}>Phone</span>
                                <span className="text-[13px] font-bold text-gray-800 break-all">{reservation.phone || 'N/A'}</span>
                            </div>
                            <div className="col-span-1 md:col-span-1">
                                <span className={labelStyle}>Email</span>
                                <span className="text-[13px] font-bold text-gray-800 truncate block">{reservation.email || 'N/A'}</span>
                            </div>
                            {isGroup && (
                                <>
                                    <div>
                                        <span className={labelStyle}>Company</span>
                                        <span className="text-[13px] font-bold text-gray-800 truncate block">{reservation.company_name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className={labelStyle}>Guide</span>
                                        <span className="text-[13px] font-bold text-gray-800 truncate block">{reservation.tour_guide_name || 'N/A'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Pre-ordered Items - Responsive View */}
                    {isGroup && reservation.dishes?.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-gray-50">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block px-1">Pre-ordered Menu</span>

                            {/* Desktop Table View */}
                            <div className="hidden lg:block border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                                <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Name</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {reservation.dishes.map((dish, i) => (
                                        <div key={i} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50/30 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800">{dish.name}</span>
                                                <span className="text-[11px] text-gray-400 font-medium">{dish.quantity}x @ {formatPrice(dish.price || 0)}đ</span>
                                            </div>
                                            <span className="text-sm font-black text-orange-600">
                                                {formatPrice((dish.price || 0) * (dish.quantity || 1))}đ
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile/Tablet Card View */}
                            <div className="lg:hidden space-y-2">
                                {reservation.dishes.map((dish, i) => (
                                    <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[13px] font-bold text-gray-800 flex-1">{dish.name}</span>
                                            <span className="text-[13px] font-black text-orange-600 ml-2">
                                                {formatPrice((dish.price || 0) * (dish.quantity || 1))}đ
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            <span>Qty: {dish.quantity}</span>
                                            <span>•</span>
                                            <span>{formatPrice(dish.price || 0)}đ</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes & Special Requests */}
                    <div className="space-y-3 pt-4 border-t border-gray-50">
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest block px-1">Special Requests</span>
                        <div className="bg-white p-4 rounded-xl border border-dashed border-gray-200 shadow-inner">
                            <p className="text-[12px] text-gray-600 leading-relaxed font-medium m-0 italic">
                                "{reservation.note || "No special requests recorded."}"
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer Action */}
                <div className="px-3 py-3 bg-white border-t border-gray-100 flex justify-center sticky bottom-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                    <button
                        onClick={onClose}
                        className="w-full py-3 mdt-btn text-xs uppercase tracking-widest font-black"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReservationDetailModal;
