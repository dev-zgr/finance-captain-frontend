import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import investmentAccountReducer from './slices/investmentAccountSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    investmentAccount: investmentAccountReducer,
  },
});

// Types for use in hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
