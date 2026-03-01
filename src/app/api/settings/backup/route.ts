import { NextRequest, NextResponse } from "next/server";
import { sqlite } from "@/lib/db";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DB_PATH || "./data/cardpulse.db";

// GET — export/download the database file
export async function GET(): Promise<NextResponse> {
  try {
    const absolutePath = path.resolve(DB_PATH);
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { success: false, error: "Database file not found" },
        { status: 404 }
      );
    }

    // Checkpoint WAL to ensure all data is in the main db file
    sqlite.pragma("wal_checkpoint(TRUNCATE)");

    const buffer = fs.readFileSync(absolutePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="cardpulse-backup-${new Date().toISOString().slice(0, 10)}.db"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to export database";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST — import/replace the database file
export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Basic validation: SQLite files start with "SQLite format 3"
    const header = buffer.slice(0, 16).toString("utf-8");
    if (!header.startsWith("SQLite format 3")) {
      return NextResponse.json(
        { success: false, error: "Invalid SQLite database file" },
        { status: 400 }
      );
    }

    const absolutePath = path.resolve(DB_PATH);

    // Close the current connection, write the new file, then exit
    // The server will restart and pick up the new database
    sqlite.close();

    // Remove WAL and SHM files if they exist
    const walPath = absolutePath + "-wal";
    const shmPath = absolutePath + "-shm";
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    fs.writeFileSync(absolutePath, buffer);

    return NextResponse.json({
      success: true,
      data: { message: "Database imported successfully. Please reload." },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to import database";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE — reset transactional data (keep categories, labels, settings)
export async function DELETE(): Promise<NextResponse> {
  try {
    // Delete in order that respects foreign key constraints
    sqlite.exec("DELETE FROM transaction_labels");
    sqlite.exec("DELETE FROM transactions");
    sqlite.exec("DELETE FROM cycle_payments");
    sqlite.exec("DELETE FROM emis");
    sqlite.exec("DELETE FROM budgets");
    sqlite.exec("DELETE FROM cards");

    return NextResponse.json({
      success: true,
      data: { message: "All transactional data has been reset" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reset data";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
