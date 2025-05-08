import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function DELETE(request) {
  try {
    // ดึง param จาก query string
    const { revisionId, groupId } = Object.fromEntries(request.nextUrl.searchParams);
    if (!revisionId || !groupId) {
      return NextResponse.json(
        { message: 'ต้องระบุ revisionId และ groupId' },
        { status: 400 }
      );
    }

    // 1) ลบกฎทั้งหมดใน rc_association_json ของเวอร์ชันนั้น
    await db.query(
      `DELETE FROM rc_association_json
       WHERE rc_as_js_GroupAsso_pid = ?
         AND rc_as_js_revision_pid = ?`,
      [groupId, revisionId]
    );

    // 2) ลบแถวเวอร์ชันใน rc_revision_association_json
    await db.query(
      `DELETE FROM rc_revision_association_json
       WHERE rc_rev_as_pid = ?`,
      [revisionId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting association version:', error);
    return NextResponse.json(
      { message: 'ลบไม่สำเร็จ' },
      { status: 500 }
    );
  }
}
