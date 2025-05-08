import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end   = searchParams.get('end');

  // กำหนด default ถ้าไม่มี
  const startDate = start || '2025-03-02';
  const endDate   = end   || '2025-03-10';

  try {
    const [rows] = await db.query(
      `
      SELECT
        DATE(rc_log_cli_date_click) AS day,
        SUM(rc_log_cli_click)       AS clicks
      FROM rc_log_clickstream
      WHERE rc_log_cli_click = 1
        AND DATE(rc_log_cli_date_click) BETWEEN ? AND ?
      GROUP BY day
      ORDER BY day
      `,
      [startDate, endDate]
    );
    // แปลงรูปแบบวันให้สั้นลง
    const data = rows.map(r => ({
      name: r.day.toISOString().slice(0,10),
      value: r.clicks
    }));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching clicks:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
