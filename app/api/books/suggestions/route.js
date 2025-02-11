import { NextResponse } from 'next/server'
import { db } from '@/utils/db'

// GET /api/books/suggestions?query=...
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''

  if (!query) {
    // ถ้า query ว่างอยู่ ให้ return array ว่าง
    return NextResponse.json([])
  }

  try {
    // ตัวอย่างการค้นหาเฉพาะ title ตามคำค้น
    const [rows] = await db.query(
      `
      SELECT rc_bo_pid, rc_bo_title
      FROM rc_book_stock
      WHERE rc_bo_title LIKE ?
      LIMIT 5
      `,
      [`%${query}%`]
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
