import { db } from '@/utils/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { facID, depID, groupID, catID } = await req.json();

        // Query หนังสือที่มี rating และทำ weighting
        const [books] = await db.query(
            `SELECT rc_alg_bo_pid, rc_alg_bo_rating FROM rc_algorithm_book_rating_depart
             WHERE rc_alg_bo_fac_pid = ? AND rc_alg_bo_pid = ? 
             AND rc_alg_bo_groupasso_pid = ? AND rc_alg_bo_cat_pid = ?`,
            [facID, depID, groupID, catID]
        );

        if (!books.length) {
            return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
        }

        // 🟢 Weighting Algorithm
        const weightedBooks = books.sort((a, b) => b.rc_alg_bo_rating - a.rc_alg_bo_rating).slice(0, 10);

        // Query ข้อมูลหนังสือจาก rc_book_stock
        const bookIDs = weightedBooks.map(book => book.rc_alg_bo_pid);
        const [bookDetails] = await db.query(
            `SELECT * FROM rc_book_stock WHERE rc_bo_pid IN (?)`,
            [bookIDs]
        );

        return NextResponse.json(bookDetails);
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
