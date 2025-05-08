import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET() {
  try {
    // Join stock and description to gather all required fields
    const [rows] = await db.query(
      `
      SELECT
        s.rc_bo_pid            AS id,
        s.rc_bo_call_no        AS callNo,
        s.rc_bo_title          AS title,
        d.rc_bo_des_img        AS coverUrl,
        d.rc_bo_des_author_name AS author,
        s.rc_bo_create_date    AS createdAt,
        s.rc_bo_update_date    AS updatedAt
      FROM rc_book_stock AS s
      LEFT JOIN rc_book_descriptions AS d
        ON s.rc_bo_pid = d.rc_bo_pid
      ORDER BY s.rc_bo_create_date DESC
      `
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching existing books:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลหนังสือได้' },
      { status: 500 }
    );
  }
}
