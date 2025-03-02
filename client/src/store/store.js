import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice'; // Adjust based on your file structure

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export default store;
