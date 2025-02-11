// app/api/books/route.js
export const runtime = 'nodejs'; // บังคับใช้ Node runtime (กัน Edge Runtime บางเวอร์ชัน)

import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request) {
  try {
    const [rows] = await db.query('SELECT * FROM rc_book_stock');
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
