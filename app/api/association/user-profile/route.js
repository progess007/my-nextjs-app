// app/api/user-profile.js
import { db } from "@/utils/db";
import { NextResponse } from "next/server";


export async function GET(request) {
    // ดึง userID จาก URL searchParams
    const { searchParams } = new URL(request.url);
    const userID = searchParams.get('userID');
    
    if (!userID) {
        return NextResponse.json(
            { error: 'userID is required' },
            { status: 400 }
        );
    }

    try {
        const query = `
            SELECT 
                u.rc_ac_us_pr_fac_pid AS facultyId,
                u.rc_ac_us_pr_dep_pid AS departmentId,
                u.rc_ac_us_pr_p1 AS category1Id,
                u.rc_ac_us_pr_p2 AS category2Id,
                u.rc_ac_us_pr_p3 AS category3Id,
                u.rc_ac_us_pr_revision AS revision,
                f.rc_fac_name AS facultyName,
                d.rc_dep_name AS departmentName,
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
        `;

        // ใช้ parameterized query เพื่อป้องกัน SQL injection
        const [results] = await db.query(query, [userID]);

        if (!results || results.length === 0) {
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(results);

    } catch (err) {
        console.error("Database query error:", err);
        return NextResponse.json(
            { error: "Failed to fetch user profile", details: err.message },
            { status: 500 }
        );
    }
}