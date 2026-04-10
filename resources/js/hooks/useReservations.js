import { useState, useCallback, useEffect } from 'react';
import { reservationApi } from '../services/reservationApi';
// Importing tableApi if it exists, or just direct axios for now since we haven't ported tables to API service layer fully, but let's assume raw axios or we create a small one.
import axios from 'axios';

export const useReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resData, tablesRes] = await Promise.all([
                reservationApi.getAll(),
                axios.get('/api/tables') // Keeping this simple for this scope, ideally tableApi.getAll()
            ]);
            
            // Due to standard JSON response array is in data.data
            setReservations(resData.data || []);
            setTables(tablesRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch reservations data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        reservations,
        tables,
        loading,
        refetch: fetchData
    };
};
