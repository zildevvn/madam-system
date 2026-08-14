import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginApi, logoutApi } from '../../services/authService';

export const login = createAsyncThunk('auth/login', async ({ username, password }, { rejectWithValue }) => {
  try {
    const response = await loginApi({ username, password });
    const user = { ...response.data, token: response.token };
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

const getInitialUser = () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      console.warn('Invalid user data in localStorage inside authSlice, clearing...', e);
      localStorage.removeItem('user');
    }
  }
  return null;
};

const initialState = {
  user: getInitialUser(),
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutLocal: (state) => {
      state.user = null;
      localStorage.removeItem('user');
    },
    updateUserInStore: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try {
    await logoutApi();
  } catch (err) {
    console.warn('Logout API failed, continuing local logout...', err);
  }
  dispatch(logoutLocal());
});

export const { logoutLocal, updateUserInStore } = authSlice.actions;
export default authSlice.reducer;
