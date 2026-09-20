"use client";

import type { User } from "@collabify/shared";

export async function registerUser(input: { email: string; name: string; password: string; role: "creator" | "brand" }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Registration failed");
  return (await res.json()) as User;
}

export async function loginUser(input: { email: string; password: string }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Login failed");
  return (await res.json()) as User;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as User;
}

export async function saveFcmToken(token: string) {
  const res = await fetch("/api/auth/me/fcm-token", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to save FCM token");
  }
}

export async function logoutUser() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}