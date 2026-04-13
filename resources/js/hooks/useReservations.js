import { useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchReservationsAsync, selectAllReservations } from '../store/slices/reservationSlice';
import { fetchTables } from '../store/slices/tableSlice';
import { selectTables } from '../store/selectors/tableSelectors';

export const useReservations = (type = null) => {
    const dispatch = useAppDispatch();
    const reservations = useAppSelector(selectAllReservations);
    const tables = useAppSelector(selectTables);
    const reservationStatus = useAppSelector(state => state.reservation.status);
    const tableStatus = useAppSelector(state => state.table.status);

    const fetchData = useCallback(async () => {
        dispatch(fetchReservationsAsync(type));
        if (tableStatus === 'idle') {
            dispatch(fetchTables());
        }
    }, [dispatch, type, tableStatus]);

    useEffect(() => {
        // [WHY] Only fetch if idle or if we want a specific type (type might have changed)
        fetchData();
    }, [dispatch, type]); // Dependency on type ensures refetch if type changes

    return {
        reservations: type ? reservations.filter(r => r.type === type) : reservations,
        tables,
        loading: reservationStatus === 'loading' || tableStatus === 'loading',
        refetch: fetchData
    };
};
