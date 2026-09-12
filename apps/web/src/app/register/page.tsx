"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { registerUser } from "@/lib/auth";
import { setUser } from "@/store/features/authSlice";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "creator" as "creator" | "brand",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await registerUser(form);
      dispatch(setUser(user));
      router.push(
        user.role === "brand" ? "/dashboard/brand" : "/dashboard/creator",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-3xl">Create an account</h1>

      <div className="mt-6 flex gap-2 rounded-md border border-border p-1 text-sm">
        <button
          type="button"
          onClick={() => setForm({ ...form, role: "creator" })}
          className={`flex-1 rounded px-3 py-1.5 ${form.role === "creator" ? "bg-signal text-white" : "text-slate"}`}
        >
          I'm a creator
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, role: "brand" })}
          className={`flex-1 rounded px-3 py-1.5 ${form.role === "brand" ? "bg-signal text-white" : "text-slate"}`}
        >
          I'm a brand
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
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
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-clay">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="text-signal-dark underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
