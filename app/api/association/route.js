import { NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }
    const [rows] = await db.query(query);
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("Association API error:", err);
    return NextResponse.json({ error: "Database query failed." }, { status: 500 });
  }
}
