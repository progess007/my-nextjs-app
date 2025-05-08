import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // อ่านพารามิเตอร์
    const page    = parseInt(searchParams.get('page')  || '1',  10);
    const limit   = parseInt(searchParams.get('limit') || '50', 10);
    const search  = searchParams.get('search')         || '';
    const offset  = (page - 1) * limit;
    const like    = `%${search}%`;

    // ดึงข้อมูลหนังสือตามเงื่อนไข search + pagination
    const [rows] = await db.query(
      `SELECT
         s.rc_bo_pid             AS id,
         s.rc_bo_call_no         AS callNo,
         s.rc_bo_title           AS title,
         d.rc_bo_des_img         AS coverUrl,
         d.rc_bo_des_author_name AS author,
         s.rc_bo_create_date     AS createdAt,
         s.rc_bo_update_date     AS updatedAt
       FROM rc_book_stock AS s
       LEFT JOIN rc_book_descriptions AS d
         ON s.rc_bo_pid = d.rc_bo_pid
       WHERE s.rc_bo_title           LIKE ?
          OR s.rc_bo_call_no         LIKE ?
          OR d.rc_bo_des_author_name LIKE ?
       ORDER BY s.rc_bo_create_date DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, limit, offset]
    );

    // นับจำนวนทั้งหมด (สำหรับคำนวณ totalPages)
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
         FROM rc_book_stock AS s
         LEFT JOIN rc_book_descriptions AS d
           ON s.rc_bo_pid = d.rc_bo_pid
        WHERE s.rc_bo_title           LIKE ?
           OR s.rc_bo_call_no         LIKE ?
           OR d.rc_bo_des_author_name LIKE ?`,
      [like, like, like]
    );

    return NextResponse.json({
      data: rows,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching existing books:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลหนังสือได้' },
      { status: 500 }
    );
  }
}
