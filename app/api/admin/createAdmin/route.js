import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/utils/db';

export async function POST(req) {
  try {
    const { username, email, password, firstname, lastname } = await req.json();
    if (!username||!email||!password||!firstname||!lastname) {
      return NextResponse.json({ success:false, message:'กรอกข้อมูลไม่ครบ' }, { status:400 });
    }

    // ตรวจสอบซ้ำ
    const [exists] = await db.query(
      `SELECT 1 FROM rc_accounts WHERE rc_ac_email = ? OR rc_ac_student_id = ?`,
      [email, username]
    );
    if (exists.length) {
      return NextResponse.json({ success:false, message:'อีเมลหรือ username ซ้ำ' }, { status:400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const now = new Date();
    await db.query(
      `INSERT INTO rc_accounts 
        (rc_ac_student_id, rc_ac_email, rc_ac_password, rc_ac_name, rc_ac_lastname,
         rc_ac_img, rc_ac_permissions, rc_ac_token_reg, rc_ac_token_status, rc_ac_create_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        email,
        hashed,
        firstname,
        lastname,
        '/user_img/default.png',
        1,          // permissions = admin
        '',         // token_reg ไม่ใช้
        1,          // token_status = ยืนยันแล้ว
        now
      ]
    );

    return NextResponse.json({ success:true, message:'สร้างผู้ดูแลระบบเรียบร้อย' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success:false, message:'เกิดข้อผิดพลาด' }, { status:500 });
  }
}
