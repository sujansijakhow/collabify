"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import type { UserRole } from "@collabify/shared";

export function RequireAuth({
  role,
  children,
}: {
  role?: UserRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, status } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (status === "guest") router.replace("/login");
    else if (status === "authenticated" && role && user?.role !== role)
      router.replace("/");
  }, [status, user, role, router]);

  if (status === "loading")
    return (
      <p className="mx-auto max-w-5xl px-6 py-12 text-sm text-slate">
        Loading…
      </p>
    );
  if (status === "guest" || (role && user?.role !== role)) return null;

  return <>{children}</>;
}
