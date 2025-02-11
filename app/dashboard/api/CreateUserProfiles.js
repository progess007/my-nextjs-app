import { db } from '@/utils/db';
import { NextResponse } from 'next/server';

// ตรวจสอบว่าผู้ใช้สร้างโปรไฟล์แล้วหรือยัง
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'); // rc_ac_pid

  try {
    // ตรวจสอบว่าโปรไฟล์ของ user มีอยู่หรือไม่
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM rc_accounts_user_profiles WHERE rc_ac_pid = ?',
      [userId]
    );

    if (rows[0].count > 0) {
      // ดึงข้อมูลโปรไฟล์ถ้ามี
      const [profile] = await db.query(
        'SELECT * FROM rc_accounts_user_profiles WHERE rc_ac_pid = ?',
        [userId]
      );
      return NextResponse.json({ isProfileCreated: true, profile });
    } else {
      return NextResponse.json({ isProfileCreated: false });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, facultyId, departmentId, createDate } = body;

    // เพิ่มข้อมูลโปรไฟล์ใหม่
    await db.query(
      `INSERT INTO rc_accounts_user_profiles 
      (rc_ac_pid, rc_ac_us_pr_fac_pid, rc_ac_us_pr_dep_pid, rc_ac_us_pr_create_date) 
      VALUES (?, ?, ?, ?)`,
      [userId, facultyId, departmentId, createDate]
    );

    return NextResponse.json({ message: 'Profile created successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
