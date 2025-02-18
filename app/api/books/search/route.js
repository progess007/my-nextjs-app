import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request) {
  try {
    // สร้าง URL object เพื่อดึง query param
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // ถ้าไม่มี query เลย ก็ส่งกลับเป็น array เปล่า
    if (!query) {
      return NextResponse.json([]);
    }

    // ค้นหาในตาราง rc_book_stock
    const [rows] = await db.query(
      `SELECT 
        s.rc_bo_pid,
        s.rc_bo_call_no,
        s.rc_bo_title,
        d.rc_bo_des_lang,
        d.rc_bo_des_public_year,
        d.rc_bo_des_collection_name,
        d.rc_bo_des_author_name,
        d.rc_bo_des_mattype_name,
        d.rc_bo_des_location,
        d.rc_bo_des_img
      FROM 
        rc_book_stock AS s
      JOIN 
        rc_book_descriptions AS d ON s.rc_bo_pid = d.rc_bo_pid
      WHERE
        s.rc_bo_title LIKE ? LIMIT 5;`,
      [`%${query}%`]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error searching books:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}