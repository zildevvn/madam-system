import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useReservationForm } from '../../hooks/useReservationForm';
import { deleteReservationAsync } from '../../store/slices/reservationSlice';
import ReservationDishesForm from '../../components/reservations/ReservationDishesForm';
import ReservationTableSelector from '../../components/reservations/ReservationTableSelector';

const ReservationCreate = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const user = useAppSelector(state => state.auth.user);
    const navigate = useNavigate();
    const isManager = user?.role === 'cashier' || user?.role === 'admin';

    const dispatch = useAppDispatch();

    const {
        form: { register, watch, setValue, formState: { errors } },
        fields, append, remove,
        fetching, loading, message, activeTab,
        reservationData,
        handleTabChange, onSubmit
    } = useReservationForm(id, user);

    const handleRemove = async () => {
        const name = reservationData?.tour_guide_name || reservationData?.lead_name || 'this reservation';
        if (window.confirm(`Xóa đặt chỗ cho "${name}"? Hành động này không thể hoàn tác.`)) {
            await dispatch(deleteReservationAsync(id));
            navigate('/reservations');
        }
    };

    const selectedTables = watch('table_ids') || [];
    const inputClasses = "w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-[14px] focus:border-orange-200 outline-none transition-all";
    const labelClasses = "block text-[12px] font-bold text-gray-800 tracking-widest mb-2";

    if (fetching) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;

    return (
        <div className="max-w-3xl mx-auto p-2 md:p-4 bg-white rounded-[16px] shadow-sm border border-gray-100 mt-4 mb-10 overflow-hidden text-gray-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h4 className="text-gray-900 m-0 tracking-tight">{isEdit ? 'Edit Reservation' : 'New Reservation'}</h4>
                {!isEdit && (
                    <div className="flex bg-gray-100 p-1.5 rounded-[20px] w-full md:w-auto shadow-inner">
                        {['individual', 'group'].map(type => (
                            <button key={type} type="button" onClick={() => handleTabChange(type)} className={`flex-1 md:flex-none px-4 py-2 rounded-2xl text-[10px] md:text-[12px] font-black uppercase tracking-widest transition-all border-none cursor-pointer ${activeTab === type ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{type}</button>
                        ))}
                    </div>
                )}
            </div>

            <form onSubmit={onSubmit} className="relative space-y-4">
                {/* Processing Overlay */}
                {loading && (
                    <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300 -mx-4 -my-4 rounded-[16px]">
                        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-xl border border-gray-100">
                            <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] animate-pulse">
                                Đang lưu dữ liệu...
                            </span>
                        </div>
                    </div>
                )}

                <input type="hidden" {...register('type')} />

                <div className="bg-gray-50/30 p-1 md:p-0 rounded-2xl">
                    <label className={labelClasses}>{activeTab === 'individual' ? "Lead's Name" : "Contact Person"}</label>
                    <input {...register('lead_name', { required: 'Required' })} className={inputClasses} placeholder="Full Name" />
                    {errors.lead_name && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">{errors.lead_name.message}</p>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className={labelClasses}>Date</label><input type="date" {...register('reservation_date', { required: 'Required' })} className={`${inputClasses} cursor-pointer`} onClick={(e) => e.target.showPicker()} /></div>
                    <div><label className={labelClasses}>Time</label><input type="time" {...register('reservation_time', { required: 'Required' })} className={`${inputClasses} cursor-pointer`} onClick={(e) => e.target.showPicker()} /></div>
                    <div><label className={labelClasses}>Guests</label><input type="number" {...register('number_of_guests', { required: 'Required', min: 1 })} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Nationality</label><input {...register('nationality')} className={inputClasses} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClasses}>Phone</label><input {...register('phone')} className={inputClasses} /></div>
                    <div><label className={labelClasses}>Email</label><input type="email" {...register('email')} className={inputClasses} /></div>
                </div>

                {activeTab === 'group' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                            <div><label className={labelClasses}>Tour Guide</label><input {...register('tour_guide_name', { required: 'Required' })} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Company</label><input {...register('company_name', { required: 'Required' })} className={inputClasses} /></div>
                        </div>

                        <div className="bg-gray-50/50 p-3 rounded-[16px] border border-gray-100 flex flex-col gap-6">
                            <ReservationDishesForm
                                fields={fields}
                                register={register}
                                watch={watch}
                                setValue={setValue}
                                append={append}
                                remove={remove}
                                inputClasses={inputClasses}
                            />

                            <div className="section-container">
                                {isManager ? (
                                    <ReservationTableSelector
                                        selectedTables={selectedTables}
                                        onToggle={(tableId) => {
                                            const updated = selectedTables.includes(tableId) ? selectedTables.filter(id => id !== tableId) : [...selectedTables, tableId];
                                            setValue('table_ids', updated);
                                        }}
                                    />
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-gray-100 rounded-[32px] text-center bg-gray-50/50">
                                        <p className="text-sm text-gray-400 font-bold max-w-sm mx-auto">Manager will assign tables later.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50/50 p-3 rounded-[16px] border border-gray-100/50">
                    <label className={labelClasses}>Notes</label>
                    <textarea {...register('note')} rows="2" className={`${inputClasses} resize-none`} />
                </div>

                <div className="pt-4 flex flex-col md:flex-row gap-3">
                    <button type="button" onClick={() => navigate('/reservations')} className="order-2 md:order-1 flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] cursor-pointer border-none">Back</button>
                    <button type="submit" disabled={loading} className="order-1 md:order-2 flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] cursor-pointer border-none disabled:opacity-50">
                        {loading ? 'Saving...' : (isEdit ? 'Update' : 'Save')}
                    </button>
                    {isEdit && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="order-3 py-4 px-6 bg-red-50 text-red-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] cursor-pointer border-none hover:bg-red-100 transition-all"
                        >
                            Remove
                        </button>
                    )}
                </div>

                {isEdit && reservationData && (
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center animate-in fade-in duration-700">
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-medium text-gray-400 italic">
                            {(reservationData.histories || []).map((history, idx) => (
                                <React.Fragment key={history.id || idx}>
                                    <span className="whitespace-nowrap">
                                        <span className="font-bold text-gray-500 not-italic uppercase tracking-tight">{history.user?.name || 'Hệ thống'}</span>
                                        {' '}{history.action === 'created' ? 'created' : 'edited'} at{' '}
                                        <span className="font-bold text-gray-500 not-italic">
                                            {new Date(history.created_at).toLocaleDateString('vi-VN')} {new Date(history.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </span>
                                    </span>
                                    {idx < reservationData.histories.length - 1 && <span className="text-gray-200 not-italic">—</span>}
                                </React.Fragment>
                            ))}
                            {(!reservationData.histories || reservationData.histories.length === 0) && (
                                <span className="whitespace-nowrap">
                                    Last updated by <span className="font-bold text-gray-500 not-italic uppercase tracking-tight">{reservationData.updater?.name || 'Unknown'}</span> at <span className="font-bold text-gray-500 not-italic">{new Date(reservationData.updated_at).toLocaleDateString()}</span>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default ReservationCreate;

