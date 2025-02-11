import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/utils/db"; // เชื่อมต่อฐานข้อมูล

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables.");
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  console.log("Authorization Header Received:", authHeader);

  // ตรวจสอบว่า Authorization Header มีค่าและเริ่มต้นด้วย Bearer
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Missing or invalid Authorization Header:", authHeader);
    return NextResponse.json(
      { message: "Unauthorized: Missing or invalid Authorization Header" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];


  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const [rows] = await db.query(`
        SELECT 
          rc_ac_pid, 
          rc_ac_student_id, 
          rc_ac_name, 
          rc_ac_lastname, 
          rc_ac_email,
          rc_ac_img,
          rc_ac_permissions 
          FROM rc_accounts WHERE rc_ac_pid = ?
      `, 
      [userId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ 
        message: "User not found" 
      }, 
      { status: 404 });
    }

    const user = rows[0];
    return NextResponse.json({ user });
  } catch (error) {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    // console.log("token:", token)
    // console.log("decode: ", decoded)
    // console.log("userID: ", userId)
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
}
