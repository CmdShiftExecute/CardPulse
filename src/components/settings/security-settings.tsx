"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/ui/pin-input";
import { Loader2, ShieldCheck, ShieldOff, KeyRound } from "lucide-react";

type Flow = null | "disable" | "enable" | "change";
type ChangeStep = "current" | "new" | "confirm";

export function SecuritySettings() {
  const [pinEnabled, setPinEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [flow, setFlow] = useState<Flow>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Change PIN flow state
  const [changeStep, setChangeStep] = useState<ChangeStep>("current");
  const [currentPin, setCurrentPin] = useState("");
  const [pinKey, setPinKey] = useState(0);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setPinEnabled(data.data.pinEnabled);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resetFlow = useCallback(() => {
    setFlow(null);
    setError("");
    setSuccess("");
    setChangeStep("current");
    setCurrentPin("");
    setPinKey((k) => k + 1);
  }, []);

  const handleDisablePin = useCallback(async (pin: string) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable_pin", pin }),
      });
      const data = await res.json();
      if (data.success) {
        setPinEnabled(false);
        setSuccess("PIN protection disabled.");
        setFlow(null);
      } else {
        setError(data.error || "Failed to disable PIN");
        setPinKey((k) => k + 1);
      }
    } catch {
      setError("Something went wrong");
      setPinKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleEnablePin = useCallback(async (pin: string) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable_pin", pin }),
      });
      const data = await res.json();
      if (data.success) {
        setPinEnabled(true);
        setSuccess("PIN protection enabled.");
        setFlow(null);
      } else {
        setError(data.error || "Failed to enable PIN");
        setPinKey((k) => k + 1);
      }
    } catch {
      setError("Something went wrong");
      setPinKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const handleChangePin = useCallback(async (pin: string) => {
    if (changeStep === "current") {
      setCurrentPin(pin);
      setChangeStep("new");
      setError("");
      setPinKey((k) => k + 1);
      return;
    }

    if (changeStep === "new") {
      // Store new PIN temporarily and go to confirm
      setCurrentPin((prev) => prev + "|" + pin);
      setChangeStep("confirm");
      setError("");
      setPinKey((k) => k + 1);
      return;
    }

    // Confirm step
    const parts = currentPin.split("|");
    const currPin = parts[0];
    const newPin = parts[1];

    if (pin !== newPin) {
      setError("PINs don't match. Try again.");
      setChangeStep("new");
      setCurrentPin(currPin);
      setPinKey((k) => k + 1);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_pin", current_pin: currPin, new_pin: newPin }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("PIN changed successfully.");
        resetFlow();
      } else {
        setError(data.error || "Failed to change PIN");
        setChangeStep("current");
        setCurrentPin("");
        setPinKey((k) => k + 1);
      }
    } catch {
      setError("Something went wrong");
      setChangeStep("current");
      setCurrentPin("");
      setPinKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }, [changeStep, currentPin, resetFlow]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">Security</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your PIN lock screen protection.
        </p>
      </div>

      {/* Current Status */}
      <div className="flex items-center gap-3 rounded-button border border-border bg-surface-2 px-4 py-3">
        {pinEnabled ? (
          <>
            <ShieldCheck size={20} className="text-success" />
            <div>
              <div className="text-sm font-medium text-text-primary">PIN Protection: Enabled</div>
              <div className="text-xs text-text-secondary">App requires PIN to unlock</div>
            </div>
          </>
        ) : (
          <>
            <ShieldOff size={20} className="text-warning" />
            <div>
              <div className="text-sm font-medium text-text-primary">PIN Protection: Disabled</div>
              <div className="text-xs text-text-secondary">App opens directly without PIN</div>
            </div>
          </>
        )}
      </div>

      {/* Success message */}
      {success && !flow && (
        <div className="rounded-button border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          {success}
        </div>
      )}

      {/* Action buttons (when no flow is active) */}
      {!flow && (
        <div className="flex flex-wrap gap-3">
          {pinEnabled ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { resetFlow(); setFlow("change"); setSuccess(""); }}
              >
                <KeyRound size={14} />
                Change PIN
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { resetFlow(); setFlow("disable"); setSuccess(""); }}
              >
                <ShieldOff size={14} />
                Disable PIN
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { resetFlow(); setFlow("enable"); setSuccess(""); }}
            >
              <ShieldCheck size={14} />
              Enable PIN
            </Button>
          )}
        </div>
      )}

      {/* Disable PIN flow */}
      {flow === "disable" && (
        <div className="space-y-4 rounded-card border border-border bg-surface-2 p-5">
          <div className="text-sm font-medium text-text-primary">
            Enter your current PIN to disable protection
          </div>
          <div className="flex justify-center">
            <PinInput
              key={pinKey}
              length={4}
              onComplete={handleDisablePin}
              disabled={submitting}
              error={!!error}
            />
          </div>
          {error && <p className="text-center text-sm text-danger">{error}</p>}
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={resetFlow}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Enable PIN flow */}
      {flow === "enable" && (
        <div className="space-y-4 rounded-card border border-border bg-surface-2 p-5">
          <div className="text-sm font-medium text-text-primary">
            Set a new 4-digit PIN
          </div>
          <div className="flex justify-center">
            <PinInput
              key={pinKey}
              length={4}
              onComplete={handleEnablePin}
              disabled={submitting}
              error={!!error}
            />
          </div>
          {error && <p className="text-center text-sm text-danger">{error}</p>}
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={resetFlow}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Change PIN flow */}
      {flow === "change" && (
        <div className="space-y-4 rounded-card border border-border bg-surface-2 p-5">
          <div className="text-sm font-medium text-text-primary">
            {changeStep === "current" && "Enter your current PIN"}
            {changeStep === "new" && "Enter your new PIN"}
            {changeStep === "confirm" && "Confirm your new PIN"}
          </div>
          <div className="flex justify-center">
            <PinInput
              key={pinKey}
              length={4}
              onComplete={handleChangePin}
              disabled={submitting}
              error={!!error}
            />
          </div>
          {error && <p className="text-center text-sm text-danger">{error}</p>}
          <div className="flex items-center justify-center gap-4">
            <span className="text-xs text-text-muted">
              Step {changeStep === "current" ? 1 : changeStep === "new" ? 2 : 3} of 3
            </span>
            <Button variant="ghost" size="sm" onClick={resetFlow}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
