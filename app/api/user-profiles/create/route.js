import { NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(request) {
  try {
    const body = await request.json();
    // body ประกอบไปด้วย:
    // {
    //   userID, // rc_ac_pid
    //   faculty, // rc_ac_us_pr_fac_pid
    //   department, // rc_ac_us_pr_dep_pid
    //   p1, p2, p3, // rc_ac_us_pr_p1, p2, p3
    // }

    const { userID, faculty, department, p1, p2, p3 } = body;
    const p1Num = parseInt(p1, 10);
    const p2Num = parseInt(p2, 10);
    const p3Num = parseInt(p3, 10);

    console.log("API received =>", { userID, faculty, department, p1Num, p2Num, p3Num });



    // console.log("API /create =>", body); // Debug

    // 1) ตรวจสอบค่าว่าง
    if (!userID || !faculty || !department) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields",
      });
    }

    // 2) ตรวจสอบการซ้ำกันของ p1, p2, p3
    // ถ้า p1 === p2 หรือ p1 === p3 หรือ p2 === p3 แสดงว่าซ้ำ
    if ((p1Num === p2Num) || (p1Num === p3Num) || (p2Num === p3Num)) {
      console.log("Found duplicates =>", p1, p2, p3);
      return NextResponse.json({
        success: false,
        message: "Duplicate categories found",
      });
    }

    // 3) หา revision ล่าสุดของ user
    const [rows] = await db.query(
      "SELECT MAX(rc_ac_us_pr_revision) AS maxRevision FROM rc_accounts_user_profiles WHERE rc_ac_pid = ?",
      [userID]
    );
    const currentMaxRevision = rows && rows[0]?.maxRevision ? rows[0].maxRevision : 0;
    const newRevision = currentMaxRevision + 1;

    // 4) Insert ข้อมูลใหม่ (แทนที่จะ update)
    // สมมติว่าใช้ NOW() หรือ CURRENT_TIMESTAMP() ใน timezone ของไทย หรืออาจใช้ CONVERT_TZ() ก็ว่าไป
    const sqlInsert = `
      INSERT INTO rc_accounts_user_profiles
      (rc_ac_us_pr_fac_pid, rc_ac_us_pr_dep_pid, rc_ac_us_pr_p1, rc_ac_us_pr_p2, rc_ac_us_pr_p3,
       rc_ac_us_pr_revision, rc_ac_us_pr_create_date, rc_ac_pid)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
    `;
    await db.query(sqlInsert, [
      faculty,
      department,
      p1Num,
      p2Num,
      p3Num,
      newRevision,
      userID,
    ]);

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully",
      newRevision,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ 
      success: false, 
      message: err.message 
    });
  }
}
