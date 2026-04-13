import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { saveReservationAsync } from '../store/slices/reservationSlice';
import { reservationApi } from '../services/reservationApi';

export const useReservationForm = (id = null, user = null) => {
    const isEdit = !!id;
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [fetching, setFetching] = useState(isEdit);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('individual');
    const [reservationData, setReservationData] = useState(null);

    const form = useForm({
        defaultValues: {
            type: 'individual',
            number_of_guests: 1,
            dishes: [{ name: '', quantity: 1, price: 0, type: 'food' }],
            table_ids: [],
            status: 'pending'
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "dishes"
    });

    // [WHY] Fetch existing data if in edit mode
    useEffect(() => {
        if (isEdit) {
            reservationApi.getById(id)
                .then(res => {
                    const data = res.data;
                    setReservationData(data); // [WHY] Store raw data for display-only fields (e.g. updated_at, updater)
                    
                    if (data.reservation_date) {
                        data.reservation_date = data.reservation_date.toString().split('T')[0];
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
        }

        if (payload.reservation_date) {
            payload.reservation_date = payload.reservation_date.toString().split('T')[0];
        }

        if (payload.table_id === "") payload.table_id = null;

        if (payload.type === 'individual') {
            payload.dishes = [];
        } else if (payload.type === 'group') {
            if (payload.dishes && Array.isArray(payload.dishes)) {
                payload.dishes = payload.dishes.filter(dish =>
                    dish.name && String(dish.name).trim() !== ''
                ).map(dish => ({
                    ...dish,
                    quantity: parseInt(dish.quantity, 10),
                    // [WHY] Sanitize price: Convert formatted strings (e.g. 30.000) to clean numbers (30000) 
                    // before parseFloat to prevent truncation at the thousand separator dot.
                    price: parseFloat(String(dish.price).replace(/[^0-9]/g, '')) || 0,
                    type: dish.type || 'food'
                }));
            }
        }

        try {
            await dispatch(saveReservationAsync({ id, data: payload })).unwrap();
            setMessage({ type: 'success', text: `Reservation ${isEdit ? 'updated' : 'saved'} successfully!` });
            setTimeout(() => navigate('/reservations'), 2000);
        } catch (err) {
            console.error('Failed to save reservation:', err);
            const msg = err.response?.data?.errors 
                ? Object.values(err.response.data.errors).flat().join(' | ')
                : 'An error occurred. Please try again.';
            setMessage({ type: 'error', text: msg });
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
        handleTabChange,
        onSubmit: form.handleSubmit(onSubmit)
    };
};
