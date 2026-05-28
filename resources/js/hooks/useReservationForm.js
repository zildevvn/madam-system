import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../store/hooks';
import { saveReservationAsync } from '../store/slices/reservationSlice';
import { reservationApi } from '../services/reservationApi';
import { getUsersApi } from '../services/userService';

export const useReservationForm = (id = null, user = null) => {
    const isEdit = !!id;
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [fetching, setFetching] = useState(isEdit);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('individual');
    const [reservationData, setReservationData] = useState(null);

    const [sellers, setSellers] = useState([]);

    const form = useForm({
        defaultValues: {
            type: 'individual',
            number_of_guests: 1,
            dishes: [{ name: '', quantity: 1, price: 0, type: 'food' }],
            table_ids: [],
            status: 'pending',
            apply_vat: false,
            vat_percentage: 0,
            staff_id: ''
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "dishes"
    });

    // [WHY] Fetch active sellers list for dropdown selection
    useEffect(() => {
        getUsersApi()
            .then(res => {
                if (res && res.data) {
                    const activeSellers = res.data.filter(u => u.role === 'seller' && u.status === 'active');
                    setSellers(activeSellers);
                }
            })
            .catch(err => console.error('Failed to fetch sellers:', err));
    }, []);

    // [WHY] Fetch existing data if in edit mode
    useEffect(() => {
        if (isEdit) {
            reservationApi.getById(id)
                .then(res => {
                    const data = res.data;
                    setReservationData(data); // [WHY] Store raw data for display-only fields (e.g. updated_at, updater)
                    
                    if (data.reservation_date) {
                        // [FIX] Robustly extract ONLY the YYYY-MM-DD part to prevent timezone shifts or invalid input values
                        // Handles both ISO (T separator) and DB (space separator) formats
                        data.reservation_date = data.reservation_date.toString().split(/[\sT]/)[0];
                    }

                    // [FIX] Map dishes with VAT and Child Pricing reverse-calculations
                    if (data.items) {
                        data.dishes = data.items.map(item => {
                            let basePrice = item.price;
                            if (data.apply_vat) {
                                const vatRate = 1 + (data.vat_percentage / 100);
                                basePrice = Math.round(item.price / vatRate);
                            }
                            
                            const isChild = item.name && item.name.includes('(Trẻ em)');
                            const originalPrice = isChild ? Math.round(basePrice / 0.75) : basePrice;
                            
                            return {
                                ...item,
                                price: basePrice,
                                original_price: originalPrice,
                                is_child: isChild
                            };
                        });
                    }

                    form.reset(data);
                    setActiveTab(data.type);
                    setFetching(false);
                })
                .catch(err => {
                    console.error('Failed to fetch reservation:', err);
                    setMessage({ type: 'error', text: 'Reservation not found.' });
                    setFetching(false);
                });
        }
    }, [id, isEdit, form]);

    const handleTabChange = useCallback((type) => {
        setActiveTab(type);
        form.setValue('type', type);
    }, [form]);

    const onSubmit = async (data) => {
        setLoading(true);
        setMessage(null);

        // [WHY] Sanitization before sending to Redux/API
        const payload = { ...data };

        if (user && user.id) {
            payload.updated_by = user.id;
            // If the logged in user is a seller, set staff_id to user.id automatically
            if (user.role === 'seller') {
                payload.staff_id = user.id;
            }
        }

        if (payload.reservation_date) {
            // [FIX] Ensure we send a clean YYYY-MM-DD string to the API
            payload.reservation_date = payload.reservation_date.toString().split(/[\sT]/)[0];
        }

        if (payload.table_id === "") payload.table_id = null;
        if (payload.staff_id === "") payload.staff_id = null;

        if (payload.type === 'individual') {
            payload.dishes = [];
        } else if (payload.type === 'group') {
            if (payload.dishes && Array.isArray(payload.dishes)) {
                payload.dishes = payload.dishes.filter(dish =>
                    dish.name && String(dish.name).trim() !== ''
                ).map(dish => {
                    const mappedDish = {
                        ...dish,
                        quantity: parseInt(dish.quantity, 10),
                        price: parseFloat(dish.price),
                        type: dish.type || 'food'
                    };
                    delete mappedDish.is_child;
                    delete mappedDish.original_price;
                    return mappedDish;
                });
            }
        }

        try {
            await dispatch(saveReservationAsync({ id, data: payload })).unwrap();
            toast.success(`Reservation ${isEdit ? 'updated' : 'saved'} successfully!`);
            navigate('/reservations');
        } catch (err) {
            console.error('Failed to save reservation:', err);
            const responseData = err?.response?.data || err;
            let msg = 'An error occurred. Please try again.';
            if (responseData?.errors && typeof responseData.errors === 'object') {
                msg = Object.values(responseData.errors).flat().join(' | ');
            } else if (responseData?.message) {
                msg = responseData.message;
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return {
        form,
        fields,
        append,
        remove,
        fetching,
        loading,
        message,
        activeTab,
        reservationData,
        sellers,
        handleTabChange,
        onSubmit: form.handleSubmit(onSubmit)
    };
};
