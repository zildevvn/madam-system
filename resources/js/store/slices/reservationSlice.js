import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { reservationApi } from '../../services/reservationApi';

// Thunks
export const fetchReservationsAsync = createAsyncThunk(
    'reservation/fetchAll',
    async (params = {}) => {
        const response = await reservationApi.getAll(params);
        return response.data; // data field from standard response
    }
);

export const saveReservationAsync = createAsyncThunk(
    'reservation/save',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            let response;
            if (id) {
                response = await reservationApi.update(id, data);
            } else {
                response = await reservationApi.create(data);
            }
            return response.data;
        } catch (err) {
            // [WHY] Forward the full axios error response so the UI can show exact Laravel validation messages
            return rejectWithValue(err.response?.data || { message: err.message });
        }
    }
);

export const deleteReservationAsync = createAsyncThunk(
    'reservation/delete',
    async (id) => {
        await reservationApi.remove(id);
        return id; // return the ID so the reducer can remove it
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
            })
            .addCase(deleteReservationAsync.fulfilled, (state, action) => {
                const id = action.payload;
                state.allIds = state.allIds.filter(rid => rid !== id);
                delete state.byId[id];
                state.lastUpdated = Date.now();
            });
    }
});

export const { updateReservationFromSocket } = reservationSlice.actions;

// Selectors
const selectReservationState = state => state.reservation;

export const selectAllReservations = createSelector(
    [selectReservationState],
    // [WHY] Filter out undefined — guards against the race window between an optimistic
    // delete (removes byId entry) and the next fetchReservationsAsync response arriving.
    (reservationState) => reservationState.allIds
        .map(id => reservationState.byId[id])
        .filter(Boolean)
);

export const selectReservationById = (id) => createSelector(
    [selectReservationState],
    (reservationState) => reservationState.byId[id]
);

export default reservationSlice.reducer;
