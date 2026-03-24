import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tableService from '../../services/tableService';

export const fetchTables = createAsyncThunk('table/fetchTables', async () => {
  const response = await tableService.getAllTables();
  return response.data; // The backend now wraps the payload in { data: [...], message: ... }
});

const initialState = {
  byId: {},
  allIds: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const tableSlice = createSlice({
  name: 'table',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTables.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const tables = action.payload;
        tables.forEach(table => {
            state.byId[table.id] = table;
        });
        state.allIds = tables.map(table => table.id);
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default tableSlice.reducer;
