import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { reservationApi } from '../../services/reservationApi';
import ReservationDishesForm from '../../components/reservations/ReservationDishesForm';
import ReservationTableSelector from '../../components/reservations/ReservationTableSelector';

const ReservationCreate = () => {
    const { id } = useParams();
    const isEdit = !!id;
    const [activeTab, setActiveTab] = useState('individual'); // 'individual' | 'group'
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            type: 'individual',
            number_of_guests: 1,
            dishes: [{ product_id: 1001, name: '', quantity: 1, price: 0 }],
            table_ids: [],
            status: 'pending'
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "dishes"
    });

    const selectedTables = watch('table_ids') || [];

    useEffect(() => {

        // If editing, fetch existing reservation
        if (isEdit) {
            reservationApi.getById(id)
                .then(res => {
                    const data = res.data;
                    reset(data);
                    setActiveTab(data.type);
                    setFetching(false);
                })
                .catch(err => {
                    console.error('Failed to fetch reservation:', err);
                    setMessage({ type: 'error', text: 'Reservation not found.' });
                    setFetching(false);
                });
        }
    }, [id, isEdit, reset]);

    const handleTabChange = (type) => {
        setActiveTab(type);
        setValue('type', type);
    };

    const onSubmit = async (data) => {
        setLoading(true);
        setMessage(null);

        // Clean up data based on type
        const payload = { ...data };
        if (payload.type === 'individual') {
            payload.dishes = [];
            payload.table_ids = [];
            delete payload.tour_guide_name;
            delete payload.company_name;
            delete payload.set_menu;
        } else if (payload.type === 'group') {
            // Filter out dishes that don't have an ID or name
            if (payload.dishes && Array.isArray(payload.dishes)) {
                payload.dishes = payload.dishes.filter(dish =>
                    dish.product_id && String(dish.product_id).trim() !== '' &&
                    dish.name && String(dish.name).trim() !== ''
                ).map(dish => ({
                    ...dish,
                    product_id: parseInt(dish.product_id, 10),
                    quantity: parseInt(dish.quantity, 10),
                    price: parseFloat(dish.price)
                }));
            }
        }

        try {
            if (isEdit) {
                await reservationApi.update(id, payload);
            } else {
                await reservationApi.create(payload);
            }
            setMessage({ type: 'success', text: `Reservation ${isEdit ? 'updated' : 'saved'} successfully!` });
            setTimeout(() => navigate('/reservations'), 2000);
        } catch (err) {
            console.error('Failed to save reservation:', err);

            if (err.response && err.response.status === 422) {
                const errors = err.response.data.errors;
                const errorMessages = Object.values(errors).flat().join(' | ');
                setMessage({ type: 'error', text: `Validation Error: ${errorMessages}` });
            } else {
                setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-[14px] focus:border-orange-200 outline-none transition-all";
    const labelClasses = "block text-[12px] font-bold text-gray-800  tracking-widest mb-2";
    const sectionTitle = "text-[13px] font-bold text-gray-800 tracking-wider mb-4 flex items-center gap-2";

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-2 md:p-4 bg-white rounded-[16px]  shadow-sm border border-gray-100 mt-4 mb-10 overflow-hidden text-gray-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h4 className="text-gray-900 m-0 tracking-tight">{isEdit ? 'Edit Reservation' : 'New Reservation'}</h4>
                {!isEdit && (
                    <div className="flex bg-gray-100 p-1.5 rounded-[20px] w-full md:w-auto shadow-inner">
                        <button
                            type="button"
                            onClick={() => handleTabChange('individual')}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-2xl text-[10px] md:text-[12px] font-black uppercase tracking-widest transition-all border-none cursor-pointer ${activeTab === 'individual' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Individual
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('group')}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-2xl text-[10px] md:text-[12px] font-black uppercase tracking-widest transition-all border-none cursor-pointer ${activeTab === 'group' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Group/Co
                        </button>
                    </div>
                )}
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300 border ${message.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    <div className="flex items-center gap-2">
                        {message.type === 'success' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
                        )}
                        {message.text}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <input type="hidden" {...register('type')} />

                {/* Status Selection (Only for Edit) */}
                {isEdit && (
                    <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100/50">
                        <label className={labelClasses}>Booking Status</label>
                        <select {...register('status')} className={inputClasses}>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                )}

                {/* Contact Identity - Prioritized Top */}
                <div className="bg-gray-50/30 p-1 md:p-0 rounded-2xl">
                    <label className={labelClasses}>{activeTab === 'individual' ? "Lead's Name" : "Contact Person"}</label>
                    <input {...register('lead_name', { required: 'Required' })} className={inputClasses} placeholder="Full Name" />
                    {errors.lead_name && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">{errors.lead_name.message}</p>}
                </div>

                {/* Row 1: Primary Booking Info (Date, Time, Guests, Nationality) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClasses}>Date</label>
                        <input 
                            type="date" 
                            {...register('reservation_date', { required: 'Required' })} 
                            className={`${inputClasses} cursor-pointer`} 
                            onClick={(e) => e.target.showPicker()} 
                        />
                        {errors.reservation_date && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">{errors.reservation_date.message}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>Time</label>
                        <input 
                            type="time" 
                            {...register('reservation_time', { required: 'Required' })} 
                            className={`${inputClasses} cursor-pointer`} 
                            onClick={(e) => e.target.showPicker()} 
                        />
                        {errors.reservation_time && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">{errors.reservation_time.message}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>Guests</label>
                        <input type="number" {...register('number_of_guests', { required: 'Required', min: 1 })} className={inputClasses} />
                        {errors.number_of_guests && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">{errors.number_of_guests.message}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>Nationality</label>
                        <input {...register('nationality')} className={inputClasses} placeholder="Country" />
                    </div>
                </div>

                {/* Row 2: Contact Info (Phone, Email) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Phone Number</label>
                        <input {...register('phone', { required: 'Required' })} className={inputClasses} placeholder="090..." />
                        {errors.phone && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">{errors.phone.message}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>Email Address</label>
                        <input type="email" {...register('email')} className={inputClasses} placeholder="example@email.com" />
                    </div>
                </div>

                {/* Group Specific Fields */}
                {activeTab === 'group' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                            <div>
                                <label className={labelClasses}>Tour Guide Name</label>
                                <input {...register('tour_guide_name')} className={inputClasses} />
                            </div>
                            <div>
                                <label className={labelClasses}>Company Name</label>
                                <input {...register('company_name')} className={inputClasses} />
                            </div>
                        </div>

                        <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 flex flex-col gap-6">
                            <ReservationDishesForm
                                fields={fields}
                                register={register}
                                append={append}
                                remove={remove}
                                inputClasses={inputClasses}
                                sectionTitle={sectionTitle}
                            />

                            <div className="pt-6 border-t border-gray-200/50">
                                <div className={sectionTitle}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></svg>
                                    Table Assignment
                                </div>
                                <ReservationTableSelector
                                    selectedTables={selectedTables}
                                    register={register}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100/50">
                    <label className={labelClasses}>Special Requests & Notes</label>
                    <textarea {...register('note')} rows="2" className={`${inputClasses} resize-none`} placeholder="Enter any extra details here..." />
                </div>

                <div className="pt-4 flex flex-col md:flex-row gap-3">
                    <button type="button" onClick={() => navigate('/reservations')} className="order-2 md:order-1 flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] cursor-pointer border-none hover:bg-gray-200 transition-colors">Back</button>
                    <button type="submit" disabled={loading} className="order-1 md:order-2 flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-black text-xs shadow-[0_12px_24px_-8px_rgba(249,115,22,0.4)] hover:shadow-none hover:translate-y-0.5 active:scale-[0.98] transition-all uppercase tracking-[0.2em] cursor-pointer border-none disabled:opacity-50">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </div>
                        ) : 'Confirm Reservation'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReservationCreate;
