import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { reservationApi } from '../../services/reservationApi';

// Thunks
export const fetchReservationsAsync = createAsyncThunk(
    'reservation/fetchAll',
    async (type = null) => {
        const response = await reservationApi.getAll(type);
        return response.data; // data field from standard response
    }
);

export const saveReservationAsync = createAsyncThunk(
    'reservation/save',
    async ({ id, data }) => {
        let response;
        if (id) {
            response = await reservationApi.update(id, data);
        } else {
            response = await reservationApi.create(data);
        }
        return response.data;
    }
);

const initialState = {
    byId: {},
    allIds: [],
    status: 'idle', // 'idle' | 'loading' | 'failed'
    lastUpdated: null,
};

const reservationSlice = createSlice({
    name: 'reservation',
    initialState,
    reducers: {
        // [WHY] Allow manual updates from realtime socket events
        updateReservationFromSocket: (state, action) => {
            const { id, reservation } = action.payload;
            if (reservation) {
                state.byId[id] = reservation;
                if (!state.allIds.includes(id)) {
                    state.allIds.push(id);
                }
            } else if (action.payload.action === 'deleted') {
                state.allIds = state.allIds.filter(rid => rid !== id);
                delete state.byId[id];
            }
            state.lastUpdated = Date.now();
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReservationsAsync.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchReservationsAsync.fulfilled, (state, action) => {
                state.status = 'idle';
                const reservations = action.payload;
                state.byId = {};
                state.allIds = [];
                reservations.forEach(r => {
                    state.byId[r.id] = r;
                    state.allIds.push(r.id);
                });
                state.lastUpdated = Date.now();
            })
            .addCase(fetchReservationsAsync.rejected, (state) => {
                state.status = 'failed';
            })
            .addCase(saveReservationAsync.fulfilled, (state, action) => {
                const reservation = action.payload;
                state.byId[reservation.id] = reservation;
                if (!state.allIds.includes(reservation.id)) {
                    state.allIds.push(reservation.id);
                }
                state.lastUpdated = Date.now();
            });
    }
});

export const { updateReservationFromSocket } = reservationSlice.actions;

// Selectors
const selectReservationState = state => state.reservation;

export const selectAllReservations = createSelector(
    [selectReservationState],
    (reservationState) => reservationState.allIds.map(id => reservationState.byId[id])
);

export const selectReservationById = (id) => createSelector(
    [selectReservationState],
    (reservationState) => reservationState.byId[id]
);

export default reservationSlice.reducer;
