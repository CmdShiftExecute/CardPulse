"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PinInput } from "@/components/ui/pin-input";

const MAX_ATTEMPTS = 3;
const COOLDOWN_SECONDS = 30;

export default function LockPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [pinKey, setPinKey] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          setAttempts(0);
          setError("");
          setPinKey((k) => k + 1);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handlePin = useCallback(async (pin: string) => {
    if (cooldown > 0) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", pin }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setCooldown(COOLDOWN_SECONDS);
          setError(`Too many attempts. Wait ${COOLDOWN_SECONDS} seconds.`);
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? "" : "s"} remaining.`);
          setPinKey((k) => k + 1);
        }
      }
    } catch {
      setError("Something went wrong. Try again.");
      setPinKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }, [cooldown, attempts, router]);

  const isLocked = cooldown > 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-sage-400">CardPulse</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enter your PIN to continue
          </p>
        </div>

        <PinInput
          key={pinKey}
          length={4}
          onComplete={handlePin}
          disabled={loading || isLocked}
          error={!!error}
        />

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        {isLocked && (
          <div className="flex flex-col items-center gap-1">
            <div className="relative h-10 w-10">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#2A3145"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#C87070"
                  strokeWidth="2"
                  strokeDasharray={`${(cooldown / COOLDOWN_SECONDS) * 100.53} 100.53`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-text-secondary">
                {cooldown}
              </span>
            </div>
          </div>
        )}

        {!isLocked && !error && (
          <p className="text-xs text-text-muted">
            Enter your 4-digit PIN
          </p>
        )}
      </div>
    </main>
  );
}
