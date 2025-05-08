import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET() {
    try {
      const [groups] = await db.query(`
        SELECT 
          rc_groupAsso_pid  AS id,
          rc_groupAsso_name AS name
        FROM rc_groupasso
      `);
      return NextResponse.json(groups);
    } catch (error) {
      console.error('Error fetching groupAsso:', error);
      return NextResponse.json(
        { message: 'ไม่สามารถโหลดกลุ่มได้' },
        { status: 500 }
      );
    }
}

export async function POST(request) {
  try {
    const { groupId, minSupport, minConfidence, rules } = await request.json();
    if (
      !groupId ||
      typeof minSupport !== 'number' ||
      typeof minConfidence !== 'number' ||
      !Array.isArray(rules) ||
      rules.length === 0
    ) {
      return NextResponse.json(
        { message: 'กรุณาส่ง groupId, minSupport, minConfidence, rules ให้ครบและถูกต้อง' },
        { status: 400 }
      );
    }

    for (const [i, r] of rules.entries()) {
      if (
        typeof r.rule_number !== 'number' ||
        !Array.isArray(r.antecedents) ||
        r.antecedents.some(t => typeof t !== 'string') ||
        typeof r.consequent !== 'string' ||
        typeof r.support !== 'number' ||
        typeof r.confidence !== 'number' ||
        typeof r.lift !== 'number' ||
        typeof r.leverage !== 'number' ||
        typeof r.conviction !== 'number'
      ) {
        return NextResponse.json(
          { message: `Rule ลำดับที่ ${i + 1} มีรูปแบบไม่ถูกต้อง` },
          { status: 400 }
        );
      }
    }

    // หา version ล่าสุด
    const [verRows] = await db.query(
      `SELECT MAX(r.rc_rev_as_version) AS maxVersion
       FROM rc_association_json AS a
       JOIN rc_revision_association_json AS r
         ON a.rc_as_js_revision_pid = r.rc_rev_as_pid
       WHERE a.rc_as_js_GroupAsso_pid = ?`,
      [groupId]
    );
    const maxVersion = verRows[0]?.maxVersion ?? 0;
    const newVersion = maxVersion + 1;

    // สร้าง revision ใหม่ โดยตั้ง active = 0
    const [revResult] = await db.query(
      `INSERT INTO rc_revision_association_json
         (rc_rev_as_version, rc_rev_as_active, rc_rev_as_update_date)
       VALUES (?, 0, NOW())`,
      [newVersion]
    );
    const newRevisionPid = revResult.insertId;

    // Insert แต่ละ rule
    for (const r of rules) {
      await db.query(
        `INSERT INTO rc_association_json
           (rc_as_js_rule,
            rc_as_js_min_support,
            rc_as_js_min_confident,
            rc_as_js_GroupAsso_pid,
            rc_as_js_revision_pid)
         VALUES (?, ?, ?, ?, ?)`,
        [
          JSON.stringify(r),
          minSupport,
          minConfidence,
          groupId,
          newRevisionPid
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in addAssociation:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500 }
    );
  }
}
