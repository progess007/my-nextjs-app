import { db } from '@/utils/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { translatedConsequent, groupID } = await req.json();
        console.log("API Received:", { translatedConsequent, groupID });

        const [rows] = await db.query(
            `SELECT rc_bo_cat_pid FROM rc_book_category 
             WHERE rc_bo_cat_name = ? 
             AND rc_bo_cat_groupAsso_pid = ? 
             LIMIT 1`,
            [translatedConsequent, groupID]
        );

        console.log("Query Result:", rows); // Debug ว่าได้ข้อมูลอะไรจาก DB

        if (rows.length > 0) {
            return NextResponse.json({ rc_bo_cat_pid: rows[0].rc_bo_cat_pid });
        } else {
            return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
        }
    } catch (error) {
        console.error("Database query error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
