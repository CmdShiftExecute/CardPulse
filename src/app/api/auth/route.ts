import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SESSION_COOKIE = "cardpulse_session";
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function createSessionResponse(body: object, token: string): NextResponse {
  const response = NextResponse.json(body);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

// GET /api/auth — check session + whether PIN is set up
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
    const storedToken = db
      .select()
      .from(settings)
      .where(eq(settings.key, "session_token"))
      .get();

    const pinHash = db
      .select()
      .from(settings)
      .where(eq(settings.key, "pin_hash"))
      .get();

    const pinEnabledRow = db
      .select()
      .from(settings)
      .where(eq(settings.key, "pin_enabled"))
      .get();

    const hasPin = !!pinHash;
    const pinEnabled = pinEnabledRow?.value !== "false";
    const isAuthenticated =
      !!sessionToken && !!storedToken && sessionToken === storedToken.value;

    return NextResponse.json({
      success: true,
      data: { hasPin, isAuthenticated, pinEnabled },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to check auth status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function isValidPin(pin: unknown): pin is string {
  return (
    typeof pin === "string" &&
    pin.length >= 4 &&
    pin.length <= 6 &&
    /^\d+$/.test(pin)
  );
}

function upsertSessionToken(token: string) {
  const existing = db
    .select()
    .from(settings)
    .where(eq(settings.key, "session_token"))
    .get();

  if (existing) {
    db.update(settings)
      .set({ value: token })
      .where(eq(settings.key, "session_token"))
      .run();
  } else {
    db.insert(settings).values({ key: "session_token", value: token }).run();
  }
}

function upsertSetting(key: string, value: string) {
  const existing = db.select().from(settings).where(eq(settings.key, key)).get();
  if (existing) {
    db.update(settings).set({ value }).where(eq(settings.key, key)).run();
  } else {
    db.insert(settings).values({ key, value }).run();
  }
}

// POST /api/auth — setup, verify, change, enable, or disable PIN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    // --- auto_session: create session without PIN (only when PIN is disabled) ---
    if (action === "auto_session") {
      const pinEnabledRow = db
        .select()
        .from(settings)
        .where(eq(settings.key, "pin_enabled"))
        .get();

      if (pinEnabledRow?.value !== "false") {
        return NextResponse.json(
          { success: false, error: "PIN is enabled — authenticate with your PIN" },
          { status: 403 }
        );
      }

      const token = generateSessionToken();
      upsertSessionToken(token);
      return createSessionResponse(
        { success: true, data: { message: "Session created (PIN disabled)" } },
        token
      );
    }

    // --- setup: first-time PIN creation ---
    if (action === "setup") {
      const { pin } = body as { pin: string };

      if (!isValidPin(pin)) {
        return NextResponse.json(
          { success: false, error: "PIN must be 4-6 digits" },
          { status: 400 }
        );
      }

      const existing = db
        .select()
        .from(settings)
        .where(eq(settings.key, "pin_hash"))
        .get();

      if (existing) {
        return NextResponse.json(
          { success: false, error: "PIN already set up" },
          { status: 400 }
        );
      }

      const hash = await bcrypt.hash(pin, 10);
      db.insert(settings).values({ key: "pin_hash", value: hash }).run();

      const token = generateSessionToken();
      upsertSessionToken(token);
      return createSessionResponse({ success: true, data: { message: "PIN created" } }, token);
    }

    // --- verify: unlock with existing PIN ---
    if (action === "verify") {
      const { pin } = body as { pin: string };

      if (!isValidPin(pin)) {
        return NextResponse.json(
          { success: false, error: "PIN must be 4-6 digits" },
          { status: 400 }
        );
      }

      const stored = db
        .select()
        .from(settings)
        .where(eq(settings.key, "pin_hash"))
        .get();

      if (!stored) {
        return NextResponse.json(
          { success: false, error: "No PIN set up" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(pin, stored.value);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Incorrect PIN" },
          { status: 401 }
        );
      }

      const token = generateSessionToken();
      upsertSessionToken(token);
      return createSessionResponse({ success: true, data: { message: "Authenticated" } }, token);
    }

    // --- change_pin: verify current PIN, set new PIN ---
    if (action === "change_pin") {
      const { current_pin, new_pin } = body as {
        current_pin: string;
        new_pin: string;
      };

      if (!isValidPin(current_pin)) {
        return NextResponse.json(
          { success: false, error: "Current PIN must be 4-6 digits" },
          { status: 400 }
        );
      }

      if (!isValidPin(new_pin)) {
        return NextResponse.json(
          { success: false, error: "New PIN must be 4-6 digits" },
          { status: 400 }
        );
      }

      const stored = db
        .select()
        .from(settings)
        .where(eq(settings.key, "pin_hash"))
        .get();

      if (!stored) {
        return NextResponse.json(
          { success: false, error: "No PIN set up" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(current_pin, stored.value);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Current PIN is incorrect" },
          { status: 401 }
        );
      }

      const newHash = await bcrypt.hash(new_pin, 10);
      db.update(settings)
        .set({ value: newHash })
        .where(eq(settings.key, "pin_hash"))
        .run();

      return NextResponse.json({
        success: true,
        data: { message: "PIN changed successfully" },
      });
    }

    // --- disable_pin: verify current PIN, then disable PIN protection ---
    if (action === "disable_pin") {
      const { pin } = body as { pin: string };

      if (!isValidPin(pin)) {
        return NextResponse.json(
          { success: false, error: "PIN must be 4-6 digits" },
          { status: 400 }
        );
      }

      const stored = db
        .select()
        .from(settings)
        .where(eq(settings.key, "pin_hash"))
        .get();

      if (!stored) {
        return NextResponse.json(
          { success: false, error: "No PIN set up" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(pin, stored.value);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Incorrect PIN" },
          { status: 401 }
        );
      }

      upsertSetting("pin_enabled", "false");

      return NextResponse.json({
        success: true,
        data: { message: "PIN protection disabled" },
      });
    }

    // --- enable_pin: set a new PIN and enable PIN protection ---
    if (action === "enable_pin") {
      const { pin } = body as { pin: string };

      if (!isValidPin(pin)) {
        return NextResponse.json(
          { success: false, error: "PIN must be 4-6 digits" },
          { status: 400 }
        );
      }

      const newHash = await bcrypt.hash(pin, 10);
      upsertSetting("pin_hash", newHash);
      upsertSetting("pin_enabled", "true");

      return NextResponse.json({
        success: true,
        data: { message: "PIN protection enabled" },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
