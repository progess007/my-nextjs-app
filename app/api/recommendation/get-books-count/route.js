import { NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const groupID = searchParams.get("groupID");
  const facID = searchParams.get("facID");
  const depID = searchParams.get("depID");
  const catID = searchParams.get("catID");
  const favID_1 = searchParams.get("favID_1");
  const favID_2 = searchParams.get("favID_2");
  const favID_3 = searchParams.get("favID_3");

  // ฟังก์ชัน query จำนวนหนังสือจากตาราง rc_algorithm_book_rating_depart
  async function queryCountDepart(cat) {
    const sql = `
      SELECT COUNT(*) as total
      FROM rc_algorithm_book_rating_depart
      WHERE rc_alg_bo_groupasso_pid = ?
        AND rc_alg_bo_fac_pid = ?
        AND rc_alg_bo_dep_pid = ?
        AND rc_alg_bo_cat_pid = ?
    `;
    const [rows] = await db.query(sql, [groupID, facID, depID, cat]);
    return rows[0].total;
  }

  // ฟังก์ชัน query จำนวนหนังสือจากตาราง rc_algorithm_book_rating_faculty
  async function queryCountFaculty(cat) {
    const sql = `
      SELECT COUNT(*) as total
      FROM rc_algorithm_book_rating_faculty
      WHERE rc_alg_bo_groupasso_pid = ?
        AND rc_alg_bo_fac_pid = ?
        AND rc_alg_bo_cat_pid = ?
    `;
    const [rows] = await db.query(sql, [groupID, facID, cat]);
    return rows[0].total;
  }

  let total = await queryCountDepart(catID);
  if (total < 5) {
    total = await queryCountDepart(favID_1);
    if (total < 5) {
      total = await queryCountDepart(favID_2);
      if (total < 5) {
        total = await queryCountDepart(favID_3);
      }
    }
  }
  if (total < 5) {
    total = await queryCountFaculty(catID);
    if (total < 5) {
      total = await queryCountFaculty(favID_1);
      if (total < 5) {
        total = await queryCountFaculty(favID_2);
        if (total < 5) {
          total = await queryCountFaculty(favID_3);
        }
      }
    }
  }

  return NextResponse.json({ total });
}
