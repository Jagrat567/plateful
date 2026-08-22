import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, accessToken: null },
  reducers: {
    sessionReceived: (_state, action) => action.payload,
    sessionCleared: () => ({ user: null, accessToken: null }),
  },
});

export const { sessionReceived, sessionCleared } = authSlice.actions;
export default authSlice.reducer;
