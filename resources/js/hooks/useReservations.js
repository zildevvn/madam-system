import { useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchReservationsAsync, selectAllReservations } from '../store/slices/reservationSlice';
import { fetchTables } from '../store/slices/tableSlice';
import { selectTables } from '../store/selectors/tableSelectors';

export const useReservations = (filters = {}) => {
    const dispatch = useAppDispatch();
    const reservations = useAppSelector(selectAllReservations);
    const tables = useAppSelector(selectTables);
    const reservationStatus = useAppSelector(state => state.reservation.status);
    const tableStatus = useAppSelector(state => state.table.status);

    const fetchData = useCallback(async () => {
        dispatch(fetchReservationsAsync(filters));
        if (tableStatus === 'idle') {
            dispatch(fetchTables());
        }
    }, [dispatch, JSON.stringify(filters), tableStatus]);

    useEffect(() => {
        // [WHY] Only fetch if idle or if we want a specific type (type might have changed)
        fetchData();
    }, [dispatch, JSON.stringify(filters)]); // Dependency on filters ensures refetch if filters change

    return {
        reservations,
        tables,
        loading: reservationStatus === 'loading' || tableStatus === 'loading',
        refetch: fetchData
    };
};
