import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@/utils/db";
import { format } from "date-fns";
import { zonedTimeToUtc, formatInTimeZone } from "date-fns-tz";

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables.");
}

export async function POST(req) {
  const body = await req.json();
  const { step, email, password, std_username, std_password } = body;

  try {
    let user = null;

    if (step === 3) {
      if (!email || !email.trim()) {
        return NextResponse.json({ message: "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง" }, { status: 400 });
      }

      const [rows] = await db.query("SELECT * FROM rc_accounts WHERE rc_ac_email = ?", [email]);

      if (rows.length === 0) {
        return NextResponse.json({ message: "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง" }, { status: 401 });
      }

      user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.rc_ac_password);

      if (!passwordMatch) {
        return NextResponse.json({ message: "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง" }, { status: 401 });
      }
    } else if (step === 5) {
      if (!std_username || !std_username.trim()) {
        return NextResponse.json({ message: "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง" }, { status: 400 });
      }

      const [rows] = await db.query("SELECT * FROM rc_accounts WHERE rc_ac_student_id = ?", [std_username]);

      if (rows.length === 0) {
        return NextResponse.json({ message: "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง" }, { status: 401 });
      }

      user = rows[0];
      const passwordMatch = await bcrypt.compare(std_password, user.rc_ac_password);

      if (!passwordMatch) {
        return NextResponse.json({ message: "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ message: "Invalid step" }, { status: 400 });
    }

    const token = jwt.sign(
      { id: user.rc_ac_pid, role: user.rc_ac_permissions },
      SECRET_KEY,
      { expiresIn: "7d" } // อายุ 7 วัน
    );

    const decoded = jwt.verify(token, SECRET_KEY);

    let redirectURL;

    if (user.rc_ac_permissions === 1) {
      redirectURL = "/dashboard/admin";
    } else if (user.rc_ac_permissions === 2) {
      redirectURL = "/dashboard/user";
    } else {
      return NextResponse.json(
        { message: "สิทธิ์การเข้าถึงไม่ถูกต้อง" },
        { status: 403 } // Forbidden
      );
    }

    // บันทึกข้อมูลลงในตาราง rc_log_login
    const timeZone = "Asia/Bangkok";
    const loginDate = formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd HH:mm:ss");
    await db.query(
      "INSERT INTO rc_log_login (rc_log_login_date, rc_ac_pid) VALUES (?, ?)",
      [loginDate, user.rc_ac_pid]
    );

    return NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token, // ส่ง token กลับไปยัง frontend
      redirectURL,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในระบบ" },
      { status: 500 }
    );
  }
}