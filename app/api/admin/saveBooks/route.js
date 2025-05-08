import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function POST(request) {
  const { books } = await request.json();

  const requiredCols = [ /* เหมือนฝั่งคลายเอนท์ */ ];

  // ตรวจคอลัมน์
  for (const row of books) {
    if (!requiredCols.every(c => row.hasOwnProperty(c))) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ตรงตามเงื่อนไข template' },
        { status: 400 }
      );
    }
  }

  try {
    const insertedIds = [];
    for (const row of books) {
      const [stockResult] = await db.query(
        `INSERT INTO rc_book_stock
           (rc_bo_barcode, rc_bo_bib_id, rc_bo_item_id,
            rc_bo_call_no, rc_bo_title, rc_bo_update_date, rc_bo_create_date)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [ row.rc_bo_barcode, row.rc_bo_bib_id, row.rc_bo_item_id,
          row.rc_bo_call_no, row.rc_bo_title ]
      );
      const newPid = stockResult.insertId;
      insertedIds.push(newPid);

      await db.query(
        `INSERT INTO rc_book_descriptions
           (rc_bo_des_lang, rc_bo_des_public_year,
            rc_bo_des_collection_name, rc_bo_des_author_name,
            rc_bo_des_mattype_name, rc_bo_des_location, rc_bo_des_img,
            rc_bo_des_entry_date, rc_bo_des_act_date, rc_bo_pid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.rc_bo_des_lang, row.rc_bo_des_public_year,
          row.rc_bo_des_collection_name, row.rc_bo_des_author_name,
          row.rc_bo_des_mattype_name, row.rc_bo_des_location,
          row.rc_bo_des_img, row.rc_bo_des_entry_date,
          row.rc_bo_des_act_date, newPid
        ]
      );
    }

    // ส่งกลับ insertedIds
    return NextResponse.json({ success: true, insertedIds });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกข้อมูลได้' }, { status: 500 });
  }
}
