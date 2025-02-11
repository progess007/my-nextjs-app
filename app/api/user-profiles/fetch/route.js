import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

export async function GET(request) {
  // ดึงค่าจาก query string
  const { searchParams } = new URL(request.url);
  const userID = searchParams.get('userID');
  
  // ถ้าไม่มี userID ที่ส่งมา ถือว่าผิดพลาด
  if (!userID) {
    return NextResponse.json({
      success: false,
      message: 'Missing userID',
    });
  }

  try {
    // Query ข้อมูลทั้งหมดจากตาราง rc_accounts_user_profiles ที่ rc_ac_pid = userID
    const [rows] = await db.query(`
      SELECT 
          u.rc_ac_us_pr_fac_pid,
          u.rc_ac_us_pr_dep_pid,
          u.rc_ac_us_pr_p1,
          u.rc_ac_us_pr_p2,
          u.rc_ac_us_pr_p3,
          u.rc_ac_us_pr_revision,
          f.rc_fac_name,
          d.rc_dep_name,
          c1.rc_bo_cat_name AS category1,
          c2.rc_bo_cat_name AS category2,
          c3.rc_bo_cat_name AS category3
      FROM 
          rc_accounts_user_profiles u
      JOIN 
          rc_faculty f ON u.rc_ac_us_pr_fac_pid = f.rc_fac_pid
      JOIN 
          rc_department d ON u.rc_ac_us_pr_dep_pid = d.rc_dep_pid
      LEFT JOIN 
          rc_book_category c1 ON u.rc_ac_us_pr_p1 = c1.rc_bo_cat_pid
      LEFT JOIN 
          rc_book_category c2 ON u.rc_ac_us_pr_p2 = c2.rc_bo_cat_pid
      LEFT JOIN 
          rc_book_category c3 ON u.rc_ac_us_pr_p3 = c3.rc_bo_cat_pid
      WHERE 
          u.rc_ac_pid = ?
      ORDER BY 
          u.rc_ac_us_pr_revision DESC
      LIMIT 1;
    `, [userID]);

    // ถ้าไม่เจอข้อมูล rows จะเป็น []
    // แต่เราจะให้ success = true เพื่อให้ฝั่ง client จัดการว่าไม่มีข้อมูล -> เด้ง modal
    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
    });
  }
}
