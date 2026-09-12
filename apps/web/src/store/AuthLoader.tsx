"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCurrentUser } from "@/lib/auth";
import { setUser } from "./features/authSlice";

export function AuthLoader() {
  const dispatch = useDispatch();

  useEffect(() => {
    fetchCurrentUser().then((user) => dispatch(setUser(user)));
  }, [dispatch]);

  return null;
}