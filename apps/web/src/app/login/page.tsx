"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { loginUser } from "@/lib/auth";
import { setUser } from "@/store/features/authSlice";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await loginUser(form);
      dispatch(setUser(user));
      router.push(
        user.role === "brand" ? "/dashboard/brand" : "/dashboard/creator",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-3xl">Log in</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-clay">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate">
        No account?{" "}
        <Link href="/register" className="text-signal-dark underline">
          Register
        </Link>
      </p>
    </main>
  );
}
