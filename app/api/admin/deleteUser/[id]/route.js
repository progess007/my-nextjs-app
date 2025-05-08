import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function DELETE(req, { params }) {
  const { id } = params;

  try {
    // 1) ลบประวัติการล็อกอินใน rc_log_login
    await db.query(
      'DELETE FROM rc_log_login WHERE rc_ac_pid = ?',
      [id]
    );

    // 2) ลบบัญชีผู้ใช้จาก rc_accounts
    const [result] = await db.query(
      'DELETE FROM rc_accounts WHERE rc_ac_pid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบผู้ใช้ที่ต้องการลบ' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'ลบผู้ใช้งานและประวัติการล็อกอินเรียบร้อย' }
    );
  } catch (error) {
    console.error('Error deleting user and logs:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
