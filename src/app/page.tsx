"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();

        if (!data.success) {
          router.replace("/setup");
          return;
        }

        const { hasPin, isAuthenticated, pinEnabled } = data.data;

        if (!hasPin) {
          router.replace("/setup");
        } else if (!pinEnabled) {
          // PIN is disabled — auto-create session and go to dashboard
          if (isAuthenticated) {
            router.replace("/dashboard");
          } else {
            const sessionRes = await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "auto_session" }),
            });
            const sessionData = await sessionRes.json();
            if (sessionData.success) {
              router.replace("/dashboard");
            } else {
              router.replace("/lock");
            }
          }
        } else if (!isAuthenticated) {
          router.replace("/lock");
        } else {
          router.replace("/dashboard");
        }
      } catch {
        router.replace("/setup");
      } finally {
        setChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  if (!checking) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-base">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-sage-400">CardPulse</h1>
        <p className="mt-1 text-sm text-text-muted">Loading...</p>
      </div>
    </main>
  );
}
