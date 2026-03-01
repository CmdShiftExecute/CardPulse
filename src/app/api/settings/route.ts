import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { invalidateFormatCache } from "@/lib/format";

// Settings that are safe to read/write via this API.
// Sensitive settings like pin_hash and session_token are excluded.
const PUBLIC_SETTINGS = [
  "currency",
  "app_name",
  "date_format",
  "number_format",
  "pin_enabled",
  "theme",
  "color_mode",
  "first_run_complete",
] as const;

type PublicSettingKey = (typeof PUBLIC_SETTINGS)[number];

function isPublicSetting(key: string): key is PublicSettingKey {
  return PUBLIC_SETTINGS.includes(key as PublicSettingKey);
}

// Valid values for enum-type settings
const VALID_VALUES: Partial<Record<PublicSettingKey, string[]>> = {
  date_format: ["DD/MM", "MM/DD"],
  number_format: ["comma_period", "period_comma"],
  pin_enabled: ["true", "false"],
  theme: ["sage", "midnight", "cyberpunk", "molten", "mono", "terminal"],
  color_mode: ["dark", "light"],
  first_run_complete: ["true", "false"],
};

// GET /api/settings — return all public settings
export async function GET() {
  try {
    const allSettings = db.select().from(settings).all();

    const publicSettings: Record<string, string> = {};
    for (const row of allSettings) {
      if (isPublicSetting(row.key)) {
        publicSettings[row.key] = row.value;
      }
    }

    return NextResponse.json({ success: true, data: publicSettings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch settings";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/settings — update one or more settings
// Body: { key: value, ... } e.g. { "currency": "USD", "theme": "cyberpunk" }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Request body must be an object of key-value pairs" },
        { status: 400 }
      );
    }

    const updates: Record<string, string> = {};
    const errors: string[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (!isPublicSetting(key)) {
        errors.push(`"${key}" is not a configurable setting`);
        continue;
      }

      if (typeof value !== "string" || value.trim() === "") {
        errors.push(`"${key}" must be a non-empty string`);
        continue;
      }

      // Validate enum values
      const validValues = VALID_VALUES[key];
      if (validValues && !validValues.includes(value)) {
        errors.push(`"${key}" must be one of: ${validValues.join(", ")}`);
        continue;
      }

      updates[key] = value;
    }

    if (errors.length > 0 && Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: errors.join("; ") },
        { status: 400 }
      );
    }

    // Apply updates using INSERT OR REPLACE (upsert)
    for (const [key, value] of Object.entries(updates)) {
      const existing = db.select().from(settings).where(eq(settings.key, key)).get();
      if (existing) {
        db.update(settings).set({ value }).where(eq(settings.key, key)).run();
      } else {
        db.insert(settings).values({ key, value }).run();
      }
    }

    // Invalidate format cache so subsequent server-side renders pick up changes
    if ("currency" in updates || "number_format" in updates || "date_format" in updates) {
      invalidateFormatCache();
    }

    // Return all public settings after update
    const allSettings = db.select().from(settings).all();
    const publicSettings: Record<string, string> = {};
    for (const row of allSettings) {
      if (isPublicSetting(row.key)) {
        publicSettings[row.key] = row.value;
      }
    }

    return NextResponse.json({
      success: true,
      data: publicSettings,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update settings";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
