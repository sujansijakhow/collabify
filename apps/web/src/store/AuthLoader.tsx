"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCurrentUser, saveFcmToken } from "@/lib/auth";
import { requestPushToken } from "@/lib/firebase";
import { setUser } from "./features/authSlice";

export function AuthLoader() {
  const dispatch = useDispatch();

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const user = await fetchCurrentUser();
      if (!active) return;

      dispatch(setUser(user));

      if (!user) return;

      try {
        const token = await requestPushToken();
        if (token) {
          await saveFcmToken(token);
        }
      } catch (error) {
        console.warn("Failed to register push token:", error);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [dispatch]);

  return null;
}