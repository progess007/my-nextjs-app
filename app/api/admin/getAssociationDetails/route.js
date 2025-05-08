// File: app/api/admin/getAssociationDetails/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const revision = searchParams.get('revision');
    if (!groupId || !revision) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const [rows] = await db.query(
      `
      SELECT
        a.rc_as_js_GroupAsso_pid,
        a.rc_as_js_rule,
        a.rc_as_js_min_support,
        a.rc_as_js_min_confident,
        a.rc_as_js_revision_pid,
        r.rc_rev_as_pid,
        r.rc_rev_as_version,
        r.rc_rev_as_active,
        r.rc_rev_as_update_date
      FROM rc_association_json AS a
      JOIN rc_revision_association_json AS r
        ON a.rc_as_js_revision_pid = r.rc_rev_as_pid
      WHERE a.rc_as_js_GroupAsso_pid = ?
        AND a.rc_as_js_revision_pid = ?
      ORDER BY r.rc_rev_as_update_date DESC
      `,
      [groupId, revision]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching details:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดรายละเอียดได้' },
      { status: 500 }
    );
  }
}
