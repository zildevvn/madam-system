import { createSlice } from '@reduxjs/toolkit';

// Static data for now, can be moved to an API fetch later
export const staticProducts = [
    // 🍜 BÚN BÒ (category_id: 3)
    { id: 1, name: "Bún bò đặc biệt", price: 70000, type: "food", category_id: 3, image: "https://images.unsplash.com/photo-1604908176997-4311c3c57d86" },
    { id: 2, name: "Bún bò giò heo", price: 65000, type: "food", category_id: 3, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246" },
    { id: 3, name: "Bún bò tái", price: 60000, type: "food", category_id: 3, image: "https://images.unsplash.com/photo-1626803775151-61d756612f97" },

    // 🍲 LẨU (category_id: 4)
    { id: 4, name: "Lẩu hải sản", price: 300000, type: "food", category_id: 4, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950" },
    { id: 5, name: "Lẩu bò", price: 280000, type: "food", category_id: 4, image: "https://images.unsplash.com/photo-1559847844-d721426d6edc" },
    { id: 6, name: "Lẩu thái", price: 320000, type: "food", category_id: 4, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38" },

    // 🌯 ĐẶC SẢN HUẾ (category_id: 2)
    { id: 7, name: "Nem lụi Huế", price: 80000, type: "food", category_id: 2, image: "https://images.unsplash.com/photo-1625944525903-c6b4f90f5d42" },
    { id: 8, name: "Bánh bèo", price: 50000, type: "food", category_id: 2, image: "https://images.unsplash.com/photo-1604908811754-1f5a9f8c8e6c" },
    { id: 9, name: "Bánh nậm", price: 45000, type: "food", category_id: 2, image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3" },

    // 🍱 SET MENU (category_id: 1)
    { id: 10, name: "Set menu gia đình", price: 500000, type: "food", category_id: 1, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" },
    { id: 11, name: "Set menu hải sản", price: 700000, type: "food", category_id: 1, image: "https://images.unsplash.com/photo-1553621042-f6e147245754" },
    { id: 12, name: "Set menu BBQ", price: 600000, type: "food", category_id: 1, image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092" },

    // 🥤 THỨC UỐNG (category_id: 5)
    { id: 13, name: "Trà đào", price: 40000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b" },
    { id: 14, name: "Trà chanh", price: 30000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1527169402691-a5c32f27a9b0" },
    { id: 15, name: "Nước cam", price: 45000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1553530666-ba11a90bb0d8" },
    { id: 16, name: "Sinh tố xoài", price: 50000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1577805947697-89e18249d767" },

    // 🥤 NƯỚC NGỌT (category_id: 5)
    { id: 17, name: "Coca Cola", price: 20000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1580910051074-3eb694886505" },
    { id: 18, name: "Pepsi", price: 20000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97" },
    { id: 19, name: "Sprite", price: 20000, type: "drink", category_id: 5, image: "https://images.unsplash.com/photo-1617196039897-4dcb3e89e329" },

    // 🍷 RƯỢU (category_id: 6)
    { id: 20, name: "Rượu vang đỏ", price: 600000, type: "drink", category_id: 6, image: "https://images.unsplash.com/photo-1510626176961-4b37d2ce7c8b" },
    { id: 21, name: "Rượu vang trắng", price: 550000, type: "drink", category_id: 6, image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb" },
    { id: 22, name: "Whisky", price: 800000, type: "drink", category_id: 6, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e" },

    // 🍸 COCKTAIL (category_id: 7)
    { id: 23, name: "Mojito", price: 120000, type: "drink", category_id: 7, image: "https://images.unsplash.com/photo-1582450871972-ab5ca641643d" },
    { id: 24, name: "Margarita", price: 130000, type: "drink", category_id: 7, image: "https://images.unsplash.com/photo-1582571352035-7f6a2b0a7b3c" },
    { id: 25, name: "Martini", price: 150000, type: "drink", category_id: 7, image: "https://images.unsplash.com/photo-1564758866810-5b3a8c8c8f94" },
    { id: 26, name: "Blue Lagoon", price: 140000, type: "drink", category_id: 7, image: "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f" },

    // 🍜 EXTRA FOOD
    { id: 27, name: "Cơm chiên hải sản", price: 90000, type: "food", category_id: 1, image: "https://images.unsplash.com/photo-1604908554025-0b8f4d98f9b0" },
    { id: 28, name: "Mì xào bò", price: 85000, type: "food", category_id: 1, image: "https://images.unsplash.com/photo-1617191519102-5baf7c6c9d34" },
    { id: 29, name: "Gỏi cuốn", price: 60000, type: "food", category_id: 2, image: "https://images.unsplash.com/photo-1604908177225-7bfa1c7d5dba" },
    { id: 30, name: "Chả giò", price: 70000, type: "food", category_id: 2, image: "https://images.unsplash.com/photo-1604908177120-0e3d0c5a2dd8" }
];

export const staticCategories = [
    { id: 1, name: "Set Menu", type: "food" },
    { id: 2, name: "Đặc sản Huế", type: "food" },
    { id: 3, name: "Bún bò", type: "food" },
    { id: 4, name: "Lẩu", type: "food" },
    { id: 5, name: "Thức uống", type: "drink" },
    { id: 6, name: "Rượu", type: "drink" },
    { id: 7, name: "Cocktail", type: "drink" }
];

const initialState = {
  products: {
    byId: staticProducts.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}),
    allIds: staticProducts.map(p => p.id)
  },
  categories: {
    byId: staticCategories.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}),
    allIds: staticCategories.map(c => c.id)
  },
  status: 'succeeded', // Since they are static for now
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
});

export const { setSearchQuery } = productSlice.actions;

export default productSlice.reducer;
