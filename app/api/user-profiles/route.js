import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import moment from "moment-timezone";

// ฟังก์ชันสำหรับดึง timestamp ใน Timezone Asia/Bangkok
const getBangkokTimestamp = () => {
  return moment().tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss");
};

// ฟังก์ชันสำหรับตัดช่องว่าง (trim) ของข้อมูล input
const cleanInput = (input) => {
  return typeof input === "string" ? input.trim() : input;
};

// GET method สำหรับ action: fetch และ dropdown
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "fetch") {
      const userID = searchParams.get("userID");
      if (!userID) {
        return NextResponse.json({ success: false, message: "Missing userID" });
      }
      const [rows] = await db.query(
        `SELECT
            u.rc_ac_pid,
            u.rc_ac_us_pr_fac_pid,
            u.rc_ac_us_pr_dep_pid,
            u.rc_ac_us_pr_p1,
            u.rc_ac_us_pr_p2,
            u.rc_ac_us_pr_p3,
            u.rc_ac_us_pr_revision,
            f.rc_fac_name,
            d.rc_dep_name,
            c1.rc_bo_cat_name AS category1,
            c2.rc_bo_cat_name AS category2,
            c3.rc_bo_cat_name AS category3
         FROM rc_accounts_user_profiles u
         JOIN rc_faculty f ON u.rc_ac_us_pr_fac_pid = f.rc_fac_pid
         JOIN rc_department d ON u.rc_ac_us_pr_dep_pid = d.rc_dep_pid
         LEFT JOIN rc_book_category c1 ON u.rc_ac_us_pr_p1 = c1.rc_bo_cat_pid
         LEFT JOIN rc_book_category c2 ON u.rc_ac_us_pr_p2 = c2.rc_bo_cat_pid
         LEFT JOIN rc_book_category c3 ON u.rc_ac_us_pr_p3 = c3.rc_bo_cat_pid
         WHERE u.rc_ac_pid = ?
         ORDER BY u.rc_ac_us_pr_revision DESC
         LIMIT 1;`,
         [userID]
      );
      return NextResponse.json({ success: true, data: rows });
    } else if (action === "dropdown") {
      const type = searchParams.get("type"); // faculty, department, category
      const facId = searchParams.get("facId");

      if (type === "faculty") {
        const [rows] = await db.query("SELECT rc_fac_pid, rc_fac_name FROM rc_faculty");
        return NextResponse.json({ success: true, data: rows });
      }
      if (type === "department") {
        if (!facId) return NextResponse.json({ success: false, message: "Missing facId" });
        const [rows] = await db.query(
          "SELECT rc_dep_pid, rc_dep_name FROM rc_department WHERE rc_dep_fac_pid = ?",
          [facId]
        );
        return NextResponse.json({ success: true, data: rows });
      }
      if (type === "category") {
        if (!facId) return NextResponse.json({ success: false, message: "Missing facId" });
        let groupAsso = 0;
        const facIdNum = parseInt(facId, 10);
        if ([1, 2, 3].includes(facIdNum)) groupAsso = 1;
        else if ([5, 7, 11].includes(facIdNum)) groupAsso = 2;
        else if ([4, 6, 8, 9, 10].includes(facIdNum)) groupAsso = 3;
        if (groupAsso === 0) return NextResponse.json({ success: true, data: [] });
        const [rows] = await db.query(
          "SELECT rc_bo_cat_pid, rc_bo_cat_name FROM rc_book_category WHERE rc_bo_cat_groupAsso_pid = ?",
          [groupAsso]
        );
        return NextResponse.json({ success: true, data: rows });
      }
      return NextResponse.json({ success: false, message: "Invalid action/type" });
    }
    return NextResponse.json({ success: false, message: "Invalid action" });
  } catch (error) {
    console.error("User Profiles GET error:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}

// POST method สำหรับสร้าง/แก้ไขโปรไฟล์
export async function POST(req) {
  try {
    const body = await req.json();
    
    // Clean input fields
    const userID = cleanInput(body.userID);
    const faculty = cleanInput(body.faculty);
    const department = cleanInput(body.department);
    const p1 = parseInt(body.p1, 10);
    const p2 = parseInt(body.p2, 10);
    const p3 = parseInt(body.p3, 10);

    if (!userID || !faculty || !department) {
      return NextResponse.json({ success: false, message: "Missing required fields" });
    }

    if ((p1 === p2) || (p1 === p3) || (p2 === p3)) {
      console.log("Duplicate =>" , p1, p2, p3)
      return NextResponse.json({
        success: false,
        message: "Duplicate"
      })
    }
    
    // ค้นหา revision ล่าสุดสำหรับ user นี้
    const [existing] = await db.query(
      "SELECT rc_ac_us_pr_revision FROM rc_accounts_user_profiles WHERE rc_ac_pid = ? ORDER BY rc_ac_us_pr_revision DESC LIMIT 1",
      [userID]
    );

    let revision = 1;
    if (existing.length > 0) {
      revision = existing[0].rc_ac_us_pr_revision + 1;
    }

    // สร้าง timestamp ใน Timezone Asia/Bangkok
    const createDate = getBangkokTimestamp();
    
    if (existing.length > 0) {
      // INSERT ข้อมูลใหม่ (สำหรับการแก้ไขข้อมูลทุกครั้งจะสร้าง record ใหม่)
      await db.query(
        `INSERT INTO rc_accounts_user_profiles 
        (rc_ac_pid, rc_ac_us_pr_fac_pid, rc_ac_us_pr_dep_pid, rc_ac_us_pr_p1, rc_ac_us_pr_p2, rc_ac_us_pr_p3, rc_ac_us_pr_revision, rc_ac_us_pr_create_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userID, faculty, department, p1, p2, p3, revision, createDate]
      );
      return NextResponse.json({ success: true, message: "Profile updated successfully" });
    } else {
      // ถ้าไม่มีโปรไฟล์ ให้ INSERT โปรไฟล์ใหม่ โดยใช้ timestamp ใน Timezone Asia/Bangkok
      await db.query(
        `INSERT INTO rc_accounts_user_profiles 
         (rc_ac_pid, rc_ac_us_pr_fac_pid, rc_ac_us_pr_dep_pid, rc_ac_us_pr_p1, rc_ac_us_pr_p2, rc_ac_us_pr_p3, rc_ac_us_pr_revision, rc_ac_us_pr_create_date)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        [userID, faculty, department, p1, p2, p3, createDate]
      );
      return NextResponse.json({ success: true, message: "Profile created successfully" });
    }
  } catch (error) {
    console.error("User Profiles POST error:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}