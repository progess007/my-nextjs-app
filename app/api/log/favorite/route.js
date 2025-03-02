import { NextResponse } from "next/server";
import { db } from "@/utils/db";

// GET: ดึงรายการโปรดของผู้ใช้ตาม userID
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // ใช้ parameter "userID" (รองรับทั้ง "userID" และ "userId" ถ้าต้องการ)
  const userID = searchParams.get("userID") || searchParams.get("userId");
  if (!userID) {
    return NextResponse.json(
      { error: "Missing userID parameter" },
      { status: 400 }
    );
  }

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
    const [rows] = await db.query(sql, [userID]);
    return NextResponse.json(rows, { status: 200 });
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
      rc_log_fav_book,       // 1 = favorite, 0 = dislike
      rc_log_fav_date,       // วันที่ในรูปแบบ "YYYY-MM-DD HH:mm:ss"
      rc_log_fav_ac_pid,     // userID
      rc_log_fav_bo_pid,     // bookID
      rc_log_fav_bo_rating,  // rating ของหนังสือ (optional)
    } = body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (
      rc_log_fav_book === undefined ||
      !rc_log_fav_date ||
      !rc_log_fav_ac_pid ||
      !rc_log_fav_bo_pid
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ตรวจสอบ duplicate ว่ามีรายการโปรดนี้อยู่แล้วหรือไม่
    const checkSql = `
      SELECT COUNT(*) AS count FROM rc_log_favorite
      WHERE rc_log_fav_ac_pid = ? AND rc_log_fav_bo_pid = ?
    `;
    const [checkRows] = await db.query(checkSql, [rc_log_fav_ac_pid, rc_log_fav_bo_pid]);
    if (checkRows && checkRows[0].count > 0) {
      return NextResponse.json(
        { error: "รายการโปรดนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

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
      rc_log_fav_bo_rating || null,
    ]);
    return NextResponse.json({ success: true }, { status: 200 });
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
    if (!rc_log_fav_ac_pid || !rc_log_fav_bo_pid) {
      return NextResponse.json(
        { error: "Missing userID or bookID" },
        { status: 400 }
      );
    }
    const sql = `
      DELETE FROM rc_log_favorite
      WHERE rc_log_fav_ac_pid = ? AND rc_log_fav_bo_pid = ?
    `;
    const [result] = await db.query(sql, [rc_log_fav_ac_pid, rc_log_fav_bo_pid]);
    if (result.affectedRows > 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: "No record deleted" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Error removing favorite" },
      { status: 500 }
    );
  }
}
