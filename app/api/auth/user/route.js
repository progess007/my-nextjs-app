// app/api/auth/user/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "@/utils/db";

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables.");
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    
    const [rows] = await db.query(
      `SELECT rc_ac_pid, rc_ac_student_id, rc_ac_name, rc_ac_lastname, rc_ac_email, rc_ac_img, rc_ac_permissions 
       FROM rc_accounts WHERE rc_ac_pid = ?`,
      [userId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const user = rows[0];
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
}
