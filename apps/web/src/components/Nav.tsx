"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { logout } from "@/store/features/authSlice";
import { logoutUser } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user, status } = useSelector((s: RootState) => s.auth);

  async function handleLogout() {
    await logoutUser();
    dispatch(logout());
    router.push("/");
  }

  const dashboardHref =
    user?.role === "brand" ? "/dashboard/brand" : "/dashboard/creator";
  const dashboardActive = pathname?.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-medium">
          Collabify
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          {status === "authenticated" && user ? (
            <>
              <Link
                href={dashboardHref}
                className={
                  dashboardActive
                    ? "font-medium text-ink"
                    : "text-slate hover:text-ink"
                }
              >
                Dashboard
              </Link>
              <span className="hidden text-slate sm:inline">{user.name}</span>
              <span className="hidden sm:inline">
                <Badge tone={user.role === "brand" ? "signal" : "neutral"}>
                  {user.role}
                </Badge>
              </span>
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
                className="rounded-md bg-signal px-3 py-1.5 font-medium text-white hover:bg-signal-dark"
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
