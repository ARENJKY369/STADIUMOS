import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchStadiums = createAsyncThunk('stadium/fetchAll', async () => {
  const response = await api.get('/zones?limit=100');
  return response.data.data;
});

const stadiumSlice = createSlice({
  name: 'stadium',
  initialState: {
    stadiums: [
      { id: '1', name: 'MetLife Stadium', city: 'East Rutherford', capacity: 82500 },
      { id: '2', name: 'SoFi Stadium', city: 'Inglewood', capacity: 70000 },
      { id: '3', name: 'AT&T Stadium', city: 'Arlington', capacity: 80000 },
    ],
    selectedStadium: { id: '1', name: 'MetLife Stadium', city: 'East Rutherford', capacity: 82500 },
    zones: [],
    loading: false,
  },
  reducers: {
    setSelectedStadium: (state, action) => {
      state.selectedStadium = action.payload;
    },
    setZones: (state, action) => {
      state.zones = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchStadiums.fulfilled, (state, action) => {
      state.zones = action.payload;
    });
  },
});

export const { setSelectedStadium, setZones } = stadiumSlice.actions;
export default stadiumSlice.reducer;
