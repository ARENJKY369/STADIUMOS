import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchIncidents = createAsyncThunk('incidents/fetchAll', async ({ stadiumId, status }) => {
  const params = new URLSearchParams();
  if (stadiumId) params.append('stadiumId', stadiumId);
  if (status) params.append('status', status);
  const response = await api.get(`/incidents?${params.toString()}`);
  return response.data.data;
});

export const createIncident = createAsyncThunk('incidents/create', async (data) => {
  const response = await api.post('/incidents', data);
  return response.data.data;
});

const incidentSlice = createSlice({
  name: 'incidents',
  initialState: {
    incidents: [],
    activeIncidents: [],
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    addIncident: (state, action) => {
      state.incidents.unshift(action.payload);
      if (['reported','acknowledged','in_progress'].includes(action.payload.status)) {
        state.activeIncidents.unshift(action.payload);
      }
    },
    updateIncident: (state, action) => {
      const index = state.incidents.findIndex(i => i.id === action.payload.id);
      if (index !== -1) state.incidents[index] = action.payload;
    },
    resolveIncident: (state, action) => {
      state.activeIncidents = state.activeIncidents.filter(i => i.id !== action.payload.id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncidents.pending, (state) => { state.loading = true; })
      .addCase(fetchIncidents.fulfilled, (state, action) => {
        state.loading = false;
        state.incidents = action.payload;
        state.activeIncidents = action.payload.filter(i => ['reported','acknowledged','in_progress'].includes(i.status));
      })
      .addCase(createIncident.fulfilled, (state, action) => {
        state.incidents.unshift(action.payload);
      });
  },
});

export const { addIncident, updateIncident, resolveIncident } = incidentSlice.actions;
export default incidentSlice.reducer;
