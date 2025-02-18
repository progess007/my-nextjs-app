// app/api/recommendation/get-book-details/route.js
import { NextResponse } from "next/server";
import { db } from "@/utils/db"; // ตรวจสอบให้แน่ใจว่า db ถูก export จาก utils/db

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
  }

  // แปลง ids (รูปแบบ "id1,id2,id3,...") เป็น array
  const ids = idsParam.split(",").map((id) => id.trim()).filter((id) => id !== "");

  // สร้าง query เพื่อดึงข้อมูลรายละเอียดหนังสือ
  // ใช้คำสั่ง SQL IN กับค่า ids ที่ได้มา
  const placeholders = ids.map(() => "?").join(",");
  const sql = `
    SELECT 
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
      st.rc_bo_pid
    FROM rc_book_stock st
    JOIN rc_book_descriptions de ON st.rc_bo_pid = de.rc_bo_pid
    WHERE st.rc_bo_pid IN (${placeholders})
  `;

  try {
    const [rows] = await db.query(sql, ids);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error querying book details:", error);
    return NextResponse.json(
      { error: "Error querying book details" },
      { status: 500 }
    );
  }
}
