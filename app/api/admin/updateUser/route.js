import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import bcrypt from 'bcrypt';

export async function PUT(req) {
  try {
    const {
      rc_ac_pid,
      rc_ac_student_id,
      rc_ac_email,
      rc_ac_password,
      rc_ac_name,
      rc_ac_lastname
    } = await req.json();

    // ตรวจสอบข้อมูลครบ
    if (!rc_ac_pid || !rc_ac_student_id || !rc_ac_email || !rc_ac_name || !rc_ac_lastname) {
      return NextResponse.json(
        { success: false, message: 'กรอกข้อมูลไม่ครบ' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่
    const [exists] = await db.query(
      'SELECT 1 FROM rc_accounts WHERE rc_ac_pid = ?',
      [rc_ac_pid]
    );
    if (exists.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบผู้ใช้' },
        { status: 404 }
      );
    }

    // ตัดสินใจว่าจะอัปเดตรหัสผ่านใหม่หรือไม่
    if (rc_ac_password) {
      const hashed = await bcrypt.hash(rc_ac_password, 10);
      await db.query(
        `UPDATE rc_accounts
         SET rc_ac_student_id = ?, rc_ac_email = ?, rc_ac_password = ?, rc_ac_name = ?, rc_ac_lastname = ?
         WHERE rc_ac_pid = ?`,
        [rc_ac_student_id, rc_ac_email, hashed, rc_ac_name, rc_ac_lastname, rc_ac_pid]
      );
    } else {
      await db.query(
        `UPDATE rc_accounts
         SET rc_ac_student_id = ?, rc_ac_email = ?, rc_ac_name = ?, rc_ac_lastname = ?
         WHERE rc_ac_pid = ?`,
        [rc_ac_student_id, rc_ac_email, rc_ac_name, rc_ac_lastname, rc_ac_pid]
      );
    }

    return NextResponse.json({ success: true, message: 'อัปเดตผู้ใช้เรียบร้อย' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    );
  }
}
