// app/books/[id]/page.js
import { db } from '@/utils/db';            // โมดูลเชื่อมต่อ DB (Node.js)
import BookDetail from './ฺBookDetail';      // import Client Component

export default async function BookDetailPage({ params }) {
  const { id } = await params;

  try {
    // เรียกใช้งาน db.query() ฝั่งเซิร์ฟเวอร์เท่านั้น
    const [rows] = await db.query(
      `SELECT 
        s.rc_bo_pid,
        s.rc_bo_call_no,
        s.rc_bo_title, 
        d.rc_bo_des_author_name,
        d.rc_bo_des_location
       FROM rc_book_stock AS s
       JOIN rc_book_descriptions AS d ON s.rc_bo_pid = d.rc_bo_pid
       WHERE s.rc_bo_pid = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return (
        <div style={{ padding: 20 }}>
          <h2>ไม่พบหนังสือ</h2>
        </div>
      );
    }

    const book = rows[0];

    // ส่งข้อมูล book ไปให้ Client Component แสดง
    return <BookDetail book={book} />;
  } catch (error) {
    console.error(error);
    return (
      <div style={{ padding: 20 }}>
        <h2>เกิดข้อผิดพลาดในการโหลดข้อมูล</h2>
      </div>
    );
  }
}
