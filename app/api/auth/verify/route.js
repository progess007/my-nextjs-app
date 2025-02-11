import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token'); // ดึง token จาก URL

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ตรวจสอบ token ในฐานข้อมูล
    const [rows] = await db.query(
      `SELECT rc_ac_pid FROM rc_accounts WHERE rc_ac_token_reg = ? AND rc_ac_token_status = 2`,
      [token]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' },
        { status: 400 }
      );
    }

    // อัปเดต token_status เป็น 1 (ยืนยันแล้ว)
    await db.query(
      `UPDATE rc_accounts SET rc_ac_token_status = 1 WHERE rc_ac_token_reg = ?`,
      [token]
    );

    return NextResponse.json({ success: true, message: 'ยืนยันตัวตนสำเร็จ' });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
