import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';

// Thunks for fetching data from API
export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts();
      // Handle the data structure returned by the API (which has a 'data' wrapper)
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải danh sách món.');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'product/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoryService.getCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải danh mục.');
    }
  }
);

export const addCategory = createAsyncThunk(
  'product/addCategory',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      await categoryService.createCategory(data);
      dispatch(fetchCategories());
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || 'Không thể thêm danh mục.');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'product/updateCategory',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      await categoryService.updateCategory(id, data);
      dispatch(fetchCategories());
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || 'Không thể cập nhật danh mục.');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'product/deleteCategory',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await categoryService.deleteCategory(id);
      dispatch(fetchCategories());
      return true;
    } catch (error) {
      // Return the specific error message from backend (e.g. "Category has products")
      const message = error.response?.data?.errors || 'Không thể xóa danh mục.';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  products: {
    byId: {},
    allIds: []
  },
  categories: {
    byId: {},
    allIds: []
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  searchQuery: '',
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const products = action.payload;
        state.products.byId = products.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        state.products.allIds = products.map(p => p.id);
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        const categories = action.payload;
        state.categories.byId = categories.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
        state.categories.allIds = categories.map(c => c.id);
      });
  }
});

export const { setSearchQuery } = productSlice.actions;

export default productSlice.reducer;
