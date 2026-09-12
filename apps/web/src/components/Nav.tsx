"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { logout } from "@/store/features/authSlice";
import { logoutUser } from "@/lib/auth";

export function Nav() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, status } = useSelector((s: RootState) => s.auth);

  async function handleLogout() {
    await logoutUser();
    dispatch(logout());
    router.push("/");
  }

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-medium">
          Collabify
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {status === "authenticated" && user ? (
            <>
              <Link
                href={
                  user.role === "brand"
                    ? "/dashboard/brand"
                    : "/dashboard/creator"
                }
                className="text-slate hover:text-ink"
              >
                Dashboard
              </Link>
              <span className="text-slate">{user.name}</span>
              <button
                onClick={handleLogout}
                className="text-slate hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : status === "guest" ? (
            <>
              <Link href="/login" className="text-slate hover:text-ink">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-signal px-3 py-1.5 font-medium text-white"
              >
                Sign up
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
