import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDashboardStats = createAsyncThunk('analytics/dashboard', async (stadiumId) => {
  const response = await api.get(`/analytics/dashboard/${stadiumId}`);
  return response.data.data;
});

export const fetchKpis = createAsyncThunk('analytics/kpis', async (stadiumId) => {
  const response = await api.get(`/analytics/kpis/${stadiumId}`);
  return response.data.data;
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    dashboard: null,
    kpis: null,
    trends: [],
    loading: false,
  },
  reducers: {
    setTrends: (state, action) => {
      state.trends = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchKpis.fulfilled, (state, action) => {
        state.kpis = action.payload;
      });
  },
});

export const { setTrends } = analyticsSlice.actions;
export default analyticsSlice.reducer;
