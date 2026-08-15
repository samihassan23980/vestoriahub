"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Expected localStorage shape (example):
 * adminuser = JSON.stringify({
 *   id: "123",
 *   name: "Admin Name",
 *   role: "admin",          // optional but recommended
 *   token: "jwt-or-random", // optional
 *   expiresAt: 1735660800000 // ms epoch (optional)
 * })
 */

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isExpired(ts) {
  if (!ts) return false; // if you don’t store expiry, skip
  const now = Date.now();
  return Number(ts) <= now;
}

function isValidAdmin(user) {
  // adjust these checks to your app’s rules
  if (!user) return false;
  if (user.role && user.role !== "admin") return false;
  if (isExpired(user.expiresAt)) return false;
  return true;
}

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState("checking"); // "checking" | "authed" | "unauthed"

  // Read once on mount
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("adminuser") : null;
    const user = safeParse(raw);

    if (isValidAdmin(user)) {
      setStatus("authed");
    } else {
      setStatus("unauthed");
      // preserve where the user wanted to go
      const returnTo = encodeURIComponent(pathname || "/admin");
      router.replace(`/signin`);
    }
  }, [router, pathname]);

  // Keep all tabs in sync (logout in one tab -> others react)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "adminuser") {
        const user = safeParse(e.newValue);
        if (!isValidAdmin(user)) {
          const returnTo = encodeURIComponent(pathname || "/admin");
          router.replace(`/signin?returnTo=${returnTo}`);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router, pathname]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2.5 w-2.5 animate-ping rounded-full bg-indigo-500" />
          <p className="text-slate-600">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthed") return null; // will redirect

  // authenticated
  return <>{children}</>;
}
