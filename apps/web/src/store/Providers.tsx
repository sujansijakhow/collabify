"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import { AuthLoader } from "./AuthLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthLoader />
      {children}
    </Provider>
  );
}