import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCrowdMetrics = createAsyncThunk('crowd/fetchMetrics', async ({ stadiumId }) => {
  const response = await api.get(`/crowd?stadiumId=${stadiumId}&limit=100`);
  return response.data.data;
});

export const fetchHeatmap = createAsyncThunk('crowd/fetchHeatmap', async ({ stadiumId, eventId }) => {
  const url = eventId ? `/crowd/heatmap/${stadiumId}?eventId=${eventId}` : `/crowd/heatmap/${stadiumId}`;
  const response = await api.get(url);
  return response.data.data;
});

const crowdSlice = createSlice({
  name: 'crowd',
  initialState: {
    metrics: [],
    heatmap: [],
    anomalies: [],
    loading: false,
    lastUpdate: null,
  },
  reducers: {
    addMetric: (state, action) => {
      state.metrics.unshift(action.payload);
      if (state.metrics.length > 100) state.metrics.pop();
      state.lastUpdate = new Date().toISOString();
    },
    setAnomalies: (state, action) => {
      state.anomalies = action.payload;
    },
    updateZoneOccupancy: (state, action) => {
      const { zoneId, occupancy } = action.payload;
      const metric = state.metrics.find(m => m.zone_id === zoneId);
      if (metric) metric.occupancy_count = occupancy;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCrowdMetrics.pending, (state) => { state.loading = true; })
      .addCase(fetchCrowdMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchHeatmap.fulfilled, (state, action) => {
        state.heatmap = action.payload;
      });
  },
});

export const { addMetric, setAnomalies, updateZoneOccupancy } = crowdSlice.actions;
export default crowdSlice.reducer;
