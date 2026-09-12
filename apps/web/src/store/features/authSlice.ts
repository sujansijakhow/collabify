import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@collabify/shared";

type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthState {
  user: User | null;
  status: AuthStatus;
}

const initialState: AuthState = { user: null, status: "loading" };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "guest";
    },
    logout(state) {
      state.user = null;
      state.status = "guest";
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;