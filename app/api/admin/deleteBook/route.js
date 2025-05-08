import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: 'Missing book id' },
        { status: 400 }
      );
    }

    // ใช้ transaction เพื่อให้ลบทั้งสองตารางพร้อมกัน
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // ลบจาก descriptions ก่อน (FK)
      await conn.query(
        `DELETE FROM rc_book_descriptions WHERE rc_bo_pid = ?`,
        [id]
      );

      // ลบจาก stock
      await conn.query(
        `DELETE FROM rc_book_stock WHERE rc_bo_pid = ?`,
        [id]
      );

      await conn.commit();
      return NextResponse.json({ success: true });
    } catch (err) {
      await conn.rollback();
      console.error('DeleteBook transaction failed:', err);
      return NextResponse.json(
        { error: 'ไม่สามารถลบข้อมูลได้' },
        { status: 500 }
      );
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('DeleteBook error:', err);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
