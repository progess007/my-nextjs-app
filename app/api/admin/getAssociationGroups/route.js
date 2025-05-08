import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET() {
  try {
    // เรา JOIN กับตาราง rc_association_json เพื่อให้รู้ว่าแต่ละ revisionId
    // เกี่ยวข้องกับ groupไหน (แต่ DISTINCT ให้เหลือ 1 แถวต่อ revision)
    const [rows] = await db.query(`
      SELECT
        a.rc_as_js_GroupAsso_pid   AS groupId,
        r.rc_rev_as_pid            AS revisionId,
        r.rc_rev_as_version        AS version,
        r.rc_rev_as_active         AS active,
        r.rc_rev_as_update_date    AS updateDate
      FROM rc_revision_association_json AS r
      JOIN (
        SELECT DISTINCT rc_as_js_revision_pid, rc_as_js_GroupAsso_pid
        FROM rc_association_json
      ) AS a
        ON a.rc_as_js_revision_pid = r.rc_rev_as_pid
      ORDER BY
        a.rc_as_js_GroupAsso_pid ASC,
        r.rc_rev_as_version    ASC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching association groups:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถโหลดข้อมูลกลุ่มได้' },
      { status: 500 }
    );
  }
}
