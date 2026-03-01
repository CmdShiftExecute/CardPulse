"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinInput } from "@/components/ui/pin-input";

type SetupStep = "create" | "confirm";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>("create");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmKey, setConfirmKey] = useState(0);

  async function handleFirstPin(pin: string) {
    setFirstPin(pin);
    setStep("confirm");
    setError("");
    setConfirmKey((k) => k + 1);
  }

  async function handleConfirmPin(pin: string) {
    if (pin !== firstPin) {
      setError("PINs don't match. Try again.");
      setStep("create");
      setFirstPin("");
      setConfirmKey((k) => k + 1);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup", pin }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to set up PIN");
        setStep("create");
        setFirstPin("");
        setConfirmKey((k) => k + 1);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setStep("create");
      setFirstPin("");
      setConfirmKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome to CardPulse
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {step === "create"
              ? "Create a PIN to secure your data"
              : "Confirm your PIN"}
          </p>
        </div>

        <PinInput
          key={confirmKey}
          length={4}
          onComplete={step === "create" ? handleFirstPin : handleConfirmPin}
          disabled={loading}
          error={!!error}
        />

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-text-muted">
            Enter a 4-digit PIN
          </p>
          {step === "confirm" && (
            <button
              onClick={() => {
                setStep("create");
                setFirstPin("");
                setError("");
                setConfirmKey((k) => k + 1);
              }}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Start over
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
