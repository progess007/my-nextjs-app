import { db } from "@/utils/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { translatedConsequent, groupID } = await req.json();
    
    // ตรวจสอบว่ามี translatedConsequent และ groupID ถูกส่งมาหรือไม่
    if (!translatedConsequent || groupID === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }
    
    // แปลง groupID ให้เป็นตัวเลขและตรวจสอบว่าเป็น NaN หรือไม่
    const groupIdNum = Number(groupID);
    if (isNaN(groupIdNum)) {
      return NextResponse.json({ error: "Invalid groupID" }, { status: 400 });
    }
    
    const [rows] = await db.query(
      `SELECT rc_bo_cat_pid FROM rc_book_category 
       WHERE rc_bo_cat_name = ? 
       AND rc_bo_cat_groupAsso_pid = ? 
       LIMIT 1`,
      [translatedConsequent, groupIdNum]
    );

    if (rows.length > 0) {
      return NextResponse.json({ rc_bo_cat_pid: rows[0].rc_bo_cat_pid });
    } else {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error in recommendation API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
