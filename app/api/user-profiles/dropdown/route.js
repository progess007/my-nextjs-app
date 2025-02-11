import { NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");     // faculty, department, category
  const facId = searchParams.get("facId");   // ใช้สำหรับ query department หรือ category

  try {
    if (type === "faculty") {
      // ดึงข้อมูลคณะทั้งหมด
      const [rows] = await db.query("SELECT rc_fac_pid, rc_fac_name FROM rc_faculty");
      return NextResponse.json({ success: true, data: rows });
    }

    if (type === "department") {
      // ดึงข้อมูล department ตาม faculty ที่เลือก
      // facId = rc_fac_pid
      if (!facId) {
        return NextResponse.json({ success: false, message: "Missing facId" });
      }
      const [rows] = await db.query(
        "SELECT rc_dep_pid, rc_dep_name FROM rc_department WHERE rc_dep_fac_pid = ?",
        [facId]
      );
      return NextResponse.json({ success: true, data: rows });
    }

    if (type === "category") {
      // ดึงข้อมูล book category ตาม groupAsso
      // สมมติเราจะ check groupAsso_pid ด้วยเงื่อนไขในโจทย์
      // rc_fac_pid (1,2,3) => groupAsso = 1
      // rc_fac_pid (5,7,11) => groupAsso = 2
      // rc_fac_pid (4,6,8,9,10) => groupAsso = 3
      if (!facId) {
        return NextResponse.json({ success: false, message: "Missing facId" });
      }

      let groupAsso = 0;
      const facIdNum = parseInt(facId, 10);
      if ([1, 2, 3].includes(facIdNum)) groupAsso = 1;
      else if ([5, 7, 11].includes(facIdNum)) groupAsso = 2;
      else if ([4, 6, 8, 9, 10].includes(facIdNum)) groupAsso = 3;

      if (groupAsso === 0) {
        // สมมติถ้า facId ไม่ตรงตามเงื่อนไขอะไรเลย ก็รีเทิร์นเป็น array ว่าง
        return NextResponse.json({ success: true, data: [] });
      }

      const [rows] = await db.query(
        "SELECT rc_bo_cat_pid, rc_bo_cat_name FROM rc_book_category WHERE rc_bo_cat_groupAsso_pid = ?",
        [groupAsso]
      );
      return NextResponse.json({ success: true, data: rows });
    }

    return NextResponse.json({ success: false, message: "Invalid type" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message });
  }
}
