import { NextResponse } from "next/server";
import { db } from "@/utils/db"; // การเชื่อมต่อฐานข้อมูล

export async function POST(req) {
    try {
        const body = await req.json(); // อ่าน body ที่ส่งมาจากคำขอ
        const { query } = body;

        if (!query) {
            return NextResponse.json({ error: "Query is required." }, { status: 400 });
        }

        // console.log("Executing query:", query); // Log เพื่อช่วย Debug

        const [rows] = await db.query(query); // รัน Query
        return NextResponse.json(rows, { status: 200 }); // ส่งผลลัพธ์กลับ
    } catch (err) {
        console.error("Database query error:", err);
        return NextResponse.json(
            { error: "Database query failed." },
            { status: 500 }
        );
    }
}
