// app/api/bookSearch/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('query')?.trim() || '';
  if (!q) {
    return NextResponse.json({ books: [] });
  }

  const like = `%${q}%`;
  const [rows] = await db.query(
    `SELECT 
       bs.rc_bo_pid, bs.rc_bo_title,
       bd.rc_bo_des_img, bd.rc_bo_des_author_name,
       bd.rc_bo_des_public_year, bd.rc_bo_des_collection_name,
       bd.rc_bo_des_mattype_name, bd.rc_bo_des_lang,
       bd.rc_bo_des_location, bd.rc_bo_des_entry_date,
       bd.rc_bo_des_act_date
     FROM rc_book_stock AS bs
     LEFT JOIN rc_book_descriptions AS bd
       ON bs.rc_bo_pid = bd.rc_bo_pid
     WHERE bs.rc_bo_title LIKE ?
     ORDER BY bs.rc_bo_title
     LIMIT 10`,
    [like]
  );

  return NextResponse.json({ books: rows });
}
