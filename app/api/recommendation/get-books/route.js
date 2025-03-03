import { NextResponse } from "next/server";
import { db } from "@/utils/db";

const TOTAL_TARGET = 10; // ต้องการหนังสือ 10 เล่ม

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // รับพารามิเตอร์
  const groupID = searchParams.get("groupID");
  const facID = searchParams.get("facID");
  const depID = searchParams.get("depID");
  const catID = searchParams.get("catID");
  const favID_1 = searchParams.get("favID_1");
  const favID_2 = searchParams.get("favID_2");
  const favID_3 = searchParams.get("favID_3");
  // userID สำหรับ exclude favorites
  let userId = searchParams.get("userId") || searchParams.get("userID");
  // ถ้าฝั่ง client ไม่ได้ส่ง userId จริง ๆ => userId จะเป็น null => ไม่ exclude
  if (!userId) {
    userId = null; // หรือกำหนดเป็น '' ตามสะดวก
  }

  // ฟังก์ชัน query depart
  async function queryDepart(cat) {
    const sql = `
      SELECT rc_alg_bo_groupasso_pid, rc_alg_bo_fac_pid, rc_alg_bo_dep_pid,
             rc_alg_bo_cat_pid, rc_alg_bo_pid, rc_alg_bo_count,
             rc_alg_bo_rating, rc_alg_bo_percentile
      FROM rc_algorithm_book_rating_depart
      WHERE rc_alg_bo_groupasso_pid = ?
        AND rc_alg_bo_fac_pid = ?
        AND rc_alg_bo_dep_pid = ?
        AND rc_alg_bo_cat_pid = ?
        ${userId ? `AND rc_alg_bo_pid NOT IN (
          SELECT rc_log_fav_bo_pid FROM rc_log_favorite WHERE rc_log_fav_ac_pid = ?
        )` : ""}
    `;
    const params = [groupID, facID, depID, cat];
    if (userId) {
      params.push(userId);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  // ฟังก์ชัน query faculty
  async function queryFaculty(cat) {
    const sql = `
      SELECT rc_alg_bo_groupasso_pid, rc_alg_bo_fac_pid,
             rc_alg_bo_cat_pid, rc_alg_bo_pid, rc_alg_bo_count,
             rc_alg_bo_rating, rc_alg_bo_percentile
      FROM rc_algorithm_book_rating_faculty
      WHERE rc_alg_bo_groupasso_pid = ?
        AND rc_alg_bo_fac_pid = ?
        AND rc_alg_bo_cat_pid = ?
        ${userId ? `AND rc_alg_bo_pid NOT IN (
          SELECT rc_log_fav_bo_pid FROM rc_log_favorite WHERE rc_log_fav_ac_pid = ?
        )` : ""}
    `;
    const params = [groupID, facID, cat];
    if (userId) {
      params.push(userId);
    }
    const [rows] = await db.query(sql, params);
    return rows;
  }

  // รวมไม่ให้ซ้ำกัน
  function combineUnique(arr1, arr2) {
    const map = new Map();
    [...arr1, ...arr2].forEach((item) => {
      map.set(item.rc_alg_bo_pid, item);
    });
    return Array.from(map.values());
  }

  // fallback
  async function tryFallback(queryFunc, primaryCat, favCats) {
    let results = await queryFunc(primaryCat);
    console.log(`  queryFunc(${primaryCat}) -> ${results.length} rows`);
    // ถ้าน้อยกว่า 5 => ลอง favCat
    if (results.length < 5) {
      for (const favCat of favCats) {
        console.log(`    fallback with cat = ${favCat}`);
        const fbRes = await queryFunc(favCat);
        console.log(`    queryFunc(${favCat}) -> ${fbRes.length} rows`);
        results = combineUnique(results, fbRes);
        if (results.length >= 5) break;
      }
    }
    return results;
  }

  console.log("===== GET /api/recommendation/get-books =====");
  console.log("Params:", {
    groupID, facID, depID, catID,
    favID_1, favID_2, favID_3,
    userId,
  });

  // 1) Query Depart + Fallback
  let results = await tryFallback(queryDepart, catID, [favID_1, favID_2, favID_3]);
  console.log(`Depart final => ${results.length} rows`);

  // 2) ถ้าน้อยกว่า 10 => ไป query Faculty + fallback
  if (results.length < TOTAL_TARGET) {
    console.log("  *** Fallback to Faculty ***");
    let facultyRes = await tryFallback(queryFaculty, catID, [favID_1, favID_2, favID_3]);
    results = combineUnique(results, facultyRes);
    console.log(`After faculty => ${results.length} rows`);
  }

  // ถ้ายังน้อยกว่า 10 => return error
  if (results.length < TOTAL_TARGET) {
    console.log("  *** STILL < 10 => not enough => return error ***");
    return NextResponse.json({ error: "ไม่สามารถแนะนำหนังสือได้" }, { status: 200 });
  }

  // คำนวณ weight = count * rating
  results.forEach((item) => {
    item.weight = Number(item.rc_alg_bo_count) * Number(item.rc_alg_bo_rating);
  });

  // Weighted sampling แบ่งตาม rating
  const group5 = results.filter((r) => Number(r.rc_alg_bo_rating) === 5);
  const group4 = results.filter((r) => Number(r.rc_alg_bo_rating) === 4);
  const groupLow = results.filter((r) => {
    const rat = Number(r.rc_alg_bo_rating);
    return rat >= 1 && rat <= 3;
  });

  const target5 = 5;
  const target4 = 3;
  const targetLow = 2;

  function weightedSample(items, count) {
    const selected = [];
    const itemsCopy = [...items];
    while (selected.length < count && itemsCopy.length > 0) {
      const totalWeight = itemsCopy.reduce((sum, i) => sum + i.weight, 0);
      let r = Math.random() * totalWeight;
      let index = 0;
      for (let i = 0; i < itemsCopy.length; i++) {
        r -= itemsCopy[i].weight;
        if (r <= 0) {
          index = i;
          break;
        }
      }
      selected.push(itemsCopy[index]);
      itemsCopy.splice(index, 1);
    }
    return selected;
  }

  const selected5 = weightedSample(group5, Math.min(target5, group5.length));
  const selected4 = weightedSample(group4, Math.min(target4, group4.length));
  const selectedLow = weightedSample(groupLow, Math.min(targetLow, groupLow.length));

  let selectedBooks = [...selected5, ...selected4, ...selectedLow];
  console.log(`After grouped sampling => ${selectedBooks.length} rows`);

  // หากยังไม่ครบ 10 => เติมจาก pool
  const selectedPids = new Set(selectedBooks.map((i) => i.rc_alg_bo_pid));
  if (selectedBooks.length < TOTAL_TARGET) {
    const remainingPool = results.filter((i) => !selectedPids.has(i.rc_alg_bo_pid));
    const needed = TOTAL_TARGET - selectedBooks.length;
    const addSel = weightedSample(remainingPool, Math.min(needed, remainingPool.length));
    selectedBooks = [...selectedBooks, ...addSel];
  }

  console.log(`Final selected => ${selectedBooks.length} rows`);
  if (selectedBooks.length < TOTAL_TARGET) {
    console.log("  *** STILL < 10 => return error ***");
    return NextResponse.json({ error: "ไม่สามารถแนะนำหนังสือได้" }, { status: 200 });
  }

  // คำนวณ probability
  const totalWeight = selectedBooks.reduce((sum, i) => sum + i.weight, 0);
  const finalSelection = selectedBooks.map((i) => ({
    pid: i.rc_alg_bo_pid,
    rating: i.rc_alg_bo_rating,
    weight: i.weight,
    probability: totalWeight ? i.weight / totalWeight : 0,
  }));

  console.log("===== SUCCESS => Return finalSelection (10 books) =====");
  return NextResponse.json(finalSelection, { status: 200 });
}
