import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function PATCH(request) {
  try {
    const { groupId, revisionId } = Object.fromEntries(request.nextUrl.searchParams);
    if (!groupId || !revisionId) {
      return NextResponse.json(
        { message: 'ต้องระบุ groupId และ revisionId' },
        { status: 400 }
      );
    }

    // 1) ปิด active ทั้งหมดในกลุ่มนี้
    await db.query(
      `UPDATE rc_revision_association_json AS r
       JOIN (
         SELECT DISTINCT rc_as_js_revision_pid AS revId
         FROM rc_association_json
         WHERE rc_as_js_GroupAsso_pid = ?
       ) AS g ON r.rc_rev_as_pid = g.revId
       SET r.rc_rev_as_active = 0`,
      [groupId]
    );

    // 2) เปิด active ที่ revisionId ที่เลือก
    await db.query(
      `UPDATE rc_revision_association_json
       SET rc_rev_as_active = 1
       WHERE rc_rev_as_pid = ?`,
      [revisionId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error activating association:', err);
    return NextResponse.json(
      { message: 'เปลี่ยนสถานะไม่สำเร็จ' },
      { status: 500 }
    );
  }
}
