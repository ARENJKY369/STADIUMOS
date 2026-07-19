import { configureStore } from '@reduxjs/toolkit';

// Slices
import authReducer from './slices/authSlice';
import stadiumReducer from './slices/stadiumSlice';
import crowdReducer from './slices/crowdSlice';
import incidentReducer from './slices/incidentSlice';
import notificationReducer from './slices/notificationSlice';
import analyticsReducer from './slices/analyticsSlice';
import sustainabilityReducer from './slices/sustainabilitySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    stadium: stadiumReducer,
    crowd: crowdReducer,
    incidents: incidentReducer,
    notifications: notificationReducer,
    analytics: analyticsReducer,
    sustainability: sustainabilityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
