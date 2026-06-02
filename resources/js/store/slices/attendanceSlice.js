import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

/**
 * fetchTodayAttendanceStatus Async Thunk
 * [WHY] Centralizes the logic to request the current user's today attendance status.
 */
export const fetchTodayAttendanceStatus = createAsyncThunk(
  'attendance/fetchTodayStatus',
  async (signal, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/attendances/today-status', signal ? { signal } : {});
      return res.data.status;
    } catch (err) {
      if (axios.isCancel(err)) {
        throw err;
      }
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch status');
    }
  }
);

const initialState = {
  todayStatus: null, // null represents initial loading/fetching state
  loading: false,
  error: null
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setTodayStatus: (state, action) => {
      state.todayStatus = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayAttendanceStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTodayAttendanceStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.todayStatus = action.payload;
      })
      .addCase(fetchTodayAttendanceStatus.rejected, (state, action) => {
        state.loading = false;
        if (action.error?.name !== 'AbortError') {
          state.error = action.payload || action.error?.message;
        }
      });
  }
});

export const { setTodayStatus } = attendanceSlice.actions;
export default attendanceSlice.reducer;
