import { NextResponse } from 'next/server'
import { db } from '@/utils/db' // ตามที่คุณกำหนดไว้

export async function GET() {
  try {
    // Query เฉพาะคอลัมน์ที่ต้องการ
    const [rows] = await db.query(`
      SELECT 
        rc_ac_pid,
        rc_ac_student_id,
        rc_ac_email,
        rc_ac_name,
        rc_ac_lastname,
        rc_ac_token_status,
        rc_ac_permissions,
        rc_ac_create_date
      FROM rc_accounts
      ORDER BY rc_ac_pid ASC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
