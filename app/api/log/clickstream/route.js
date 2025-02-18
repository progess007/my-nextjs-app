// app/api/log/clickstream/route.js
import { NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("Logging data:", body); // เพิ่ม log เพื่อตรวจสอบข้อมูล
    const {
      rc_log_cli_click,
      rc_log_cli_date_click,
      rc_log_ac_pid,
      rc_log_bo_pid,
      rc_log_bo_rating,
    } = body;
    const sql = `
      INSERT INTO rc_log_clickstream 
        (rc_log_cli_click, rc_log_cli_date_click, rc_log_ac_pid, rc_log_bo_pid, rc_log_bo_rating)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(sql, [
      rc_log_cli_click,
      rc_log_cli_date_click,
      rc_log_ac_pid,
      rc_log_bo_pid,
      rc_log_bo_rating,
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging click:", error);
    return NextResponse.json(
      { error: "Error logging click" },
      { status: 500 }
    );
  }
}
