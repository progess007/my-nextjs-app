import { NextResponse } from "next/server";
import { db } from "@/utils/db";

// GET: ดึงรายการโปรดของผู้ใช้ตาม userId (query parameter)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "Missing userId parameter" },
      { status: 400 }
    );
  }

  // Query โดย join กับตารางของหนังสือเพื่อดึงรายละเอียดเพิ่มเติม
  const sql = `
    SELECT 
      st.rc_bo_pid AS fbookID,
      st.rc_bo_barcode,
      st.rc_bo_bib_id,
      st.rc_bo_item_id,
      st.rc_bo_call_no,
      st.rc_bo_title,
      de.rc_bo_des_lang,
      de.rc_bo_des_public_year,
      de.rc_bo_des_collection_name,
      de.rc_bo_des_author_name,
      de.rc_bo_des_mattype_name,
      de.rc_bo_des_location,
      de.rc_bo_des_img,
      de.rc_bo_des_entry_date,
      de.rc_bo_des_act_date,
      lf.rc_log_fav_bo_pid,
      lf.rc_log_fav_bo_rating
    FROM rc_log_favorite lf
    JOIN rc_book_stock st ON lf.rc_log_fav_bo_pid = st.rc_bo_pid
    JOIN rc_book_descriptions de ON st.rc_bo_pid = de.rc_bo_pid
    WHERE lf.rc_log_fav_ac_pid = ?
  `;
  try {
    const [rows] = await db.query(sql, [userId]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching favorite books:", error);
    return NextResponse.json(
      { error: "Error fetching favorite books" },
      { status: 500 }
    );
  }
}

// POST: บันทึกหนังสือเข้ารายการโปรด
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      rc_log_fav_book,
      rc_log_fav_date,
      rc_log_fav_ac_pid,
      rc_log_fav_bo_pid,
      rc_log_fav_bo_rating,
    } = body;
    const sql = `
      INSERT INTO rc_log_favorite 
        (rc_log_fav_book, rc_log_fav_date, rc_log_fav_ac_pid, rc_log_fav_bo_pid, rc_log_fav_bo_rating)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(sql, [
      rc_log_fav_book,
      rc_log_fav_date,
      rc_log_fav_ac_pid,
      rc_log_fav_bo_pid,
      rc_log_fav_bo_rating,
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging favorite:", error);
    return NextResponse.json(
      { error: "Error logging favorite" },
      { status: 500 }
    );
  }
}

// DELETE: ลบหนังสือออกจากรายการโปรด
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { rc_log_fav_ac_pid, rc_log_fav_bo_pid } = body;
    const sql = `
      DELETE FROM rc_log_favorite 
      WHERE rc_log_fav_ac_pid = ? AND rc_log_fav_bo_pid = ?
    `;
    await db.query(sql, [rc_log_fav_ac_pid, rc_log_fav_bo_pid]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Error removing favorite" },
      { status: 500 }
    );
  }
}
