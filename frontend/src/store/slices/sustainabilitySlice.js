import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchLeaderboard = createAsyncThunk('sustainability/leaderboard', async (stadiumId) => {
  const response = await api.get(`/sustainability/leaderboard/${stadiumId}?limit=10`);
  return response.data.data;
});

export const fetchMyStats = createAsyncThunk('sustainability/myStats', async () => {
  const response = await api.get('/sustainability/my-stats');
  return response.data.data;
});

const sustainabilitySlice = createSlice({
  name: 'sustainability',
  initialState: {
    leaderboard: [],
    myStats: null,
    report: null,
    loading: false,
  },
  reducers: {
    setReport: (state, action) => {
      state.report = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboard = action.payload;
      })
      .addCase(fetchMyStats.fulfilled, (state, action) => {
        state.myStats = action.payload;
      });
  },
});

export const { setReport } = sustainabilitySlice.actions;
export default sustainabilitySlice.reducer;
