import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET(request) {
  try {
    // สร้าง connection ไปยังฐานข้อมูล
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,       // อ่านค่าจากไฟล์ .env
      user: process.env.DB_USER,
      port: Number(process.env.DB_PORT),
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    // Query ดึงข้อมูล Top 5 จากตาราง rc_algorithm_book_rating_depart JOIN rc_book_stock
    const [rows] = await connection.execute(`
      SELECT 
        stock.rc_bo_title AS title,
        stock.rc_bo_pid,
        algo.rc_alg_bo_count AS borrow_count,
        des.rc_bo_des_img AS imageUrl
        FROM rc_algorithm_book_rating_depart AS algo
        JOIN rc_book_stock AS stock ON algo.rc_alg_bo_pid = stock.rc_bo_pid
        JOIN rc_book_descriptions AS des ON des.rc_bo_pid = stock.rc_bo_pid
        ORDER BY algo.rc_alg_bo_count DESC LIMIT 6;
    `);

    // ปิดการเชื่อมต่อ
    await connection.end();

    // ส่งข้อมูลกลับเป็น JSON
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching top books:', error);
    // ส่ง Error กลับไปยัง Client
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
