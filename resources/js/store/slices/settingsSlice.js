import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/system-settings');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch settings');
    }
  }
);

export const updateSetting = createAsyncThunk(
  'settings/updateSetting',
  async ({ key, value }, { rejectWithValue }) => {
    try {
      const res = await axios.put('/api/system-settings', { [key]: value });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update setting');
    }
  }
);

const initialState = {
  settings: {
    attendance_enabled: 'false' // default to 'false' (disabled)
  },
  loading: false,
  error: null
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSetting: (state, action) => {
      const { key, value } = action.payload;
      state.settings[key] = value;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })
      .addCase(updateSetting.fulfilled, (state, action) => {
        state.settings = { ...state.settings, ...action.payload };
      });
  }
});

export const { setSetting } = settingsSlice.actions;
export default settingsSlice.reducer;
