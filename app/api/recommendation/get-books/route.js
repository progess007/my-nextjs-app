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
  const userId = searchParams.get("userId"); // ผู้ใช้ที่ทำการแนะนำ
  const dislikedParam = searchParams.get("dislikedIds"); // comma-separated list of disliked book IDs
  const dislikedIds = dislikedParam
    ? dislikedParam.split(",").map((id) => id.trim())
    : [];

  // ฟังก์ชัน query ตาราง rc_algorithm_book_rating_depart
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
        AND rc_alg_bo_pid NOT IN (
          SELECT rc_log_fav_bo_pid FROM rc_log_favorite WHERE rc_log_fav_ac_pid = ?
        )
    `;
    const [rows] = await db.query(sql, [groupID, facID, depID, cat, userId]);
    return rows;
  }

  // ฟังก์ชัน query ตาราง rc_algorithm_book_rating_faculty
  async function queryFaculty(cat) {
    const sql = `
      SELECT rc_alg_bo_groupasso_pid, rc_alg_bo_fac_pid,
             rc_alg_bo_cat_pid, rc_alg_bo_pid, rc_alg_bo_count,
             rc_alg_bo_rating, rc_alg_bo_percentile
      FROM rc_algorithm_book_rating_faculty
      WHERE rc_alg_bo_groupasso_pid = ? 
        AND rc_alg_bo_fac_pid = ? 
        AND rc_alg_bo_cat_pid = ?
        AND rc_alg_bo_pid NOT IN (
          SELECT rc_log_fav_bo_pid FROM rc_log_favorite WHERE rc_log_fav_ac_pid = ?
        )
    `;
    const [rows] = await db.query(sql, [groupID, facID, cat, userId]);
    return rows;
  }

  // รวมผลลัพธ์โดยไม่ให้หนังสือซ้ำกัน
  function combineUnique(arr1, arr2) {
    const map = new Map();
    [...arr1, ...arr2].forEach((item) => {
      map.set(item.rc_alg_bo_pid, item);
    });
    return Array.from(map.values());
  }

  // ฟังก์ชัน fallback: ใช้ primaryCat แล้ว fallback ด้วย favIDs
  async function tryFallback(queryFunc, primaryCat, favCats) {
    let results = await queryFunc(primaryCat);
    if (results.length < 5) {
      for (const favCat of favCats) {
        const fallbackResults = await queryFunc(favCat);
        results = combineUnique(results, fallbackResults);
        if (results.length >= 5) break;
      }
    }
    return results;
  }

  // เริ่มต้น query จากตาราง depart
  let results = await tryFallback(queryDepart, catID, [favID_1, favID_2, favID_3]);

  // ถ้ายังไม่เพียงพอ ให้ queryจากตาราง faculty
  if (results.length < 5) {
    const facResults = await tryFallback(queryFaculty, catID, [favID_1, favID_2, favID_3]);
    results = combineUnique(results, facResults);
  }

  // หากยังไม่ถึง 5 เล่ม ให้ return error
  if (results.length < 5) {
    return NextResponse.json({ error: "ไม่สามารถแนะนำหนังสือได้" }, { status: 200 });
  }

  // กรองหนังสือที่ซ้ำกัน
  const uniqueResults = combineUnique([], results);

  // ถ้า uniqueResults น้อยกว่า 10 เล่ม ให้ return error
  if (uniqueResults.length < 10) {
    return NextResponse.json({ error: "ไม่สามารถแนะนำหนังสือได้" }, { status: 200 });
  }

  // คำนวณ weight โดยใช้สูตร count * rating
  // ถ้าหนังสืออยู่ใน dislikedIds ให้ลด weight ลง (ลด 50% ตัวอย่าง)
  uniqueResults.forEach((item) => {
    let baseWeight = Number(item.rc_alg_bo_count) * Number(item.rc_alg_bo_rating);
    if (dislikedIds.includes(String(item.rc_alg_bo_pid))) {
      baseWeight *= 0.5;
    }
    item.weight = baseWeight;
  });

  // แบ่งหนังสือตามระดับ rating
  const group5 = uniqueResults.filter(item => Number(item.rc_alg_bo_rating) === 5);
  const group4 = uniqueResults.filter(item => Number(item.rc_alg_bo_rating) === 4);
  const groupLow = uniqueResults.filter(item => {
    const r = Number(item.rc_alg_bo_rating);
    return r >= 1 && r <= 3;
  });

  const target5 = 5;   // rating 5 → 50% (5 เล่ม)
  const target4 = 3;   // rating 4 → 30% (3 เล่ม)
  const targetLow = 2; // rating 1-3 → 20% (2 เล่ม)
  const totalTarget = 10;

  // ฟังก์ชันสุ่มแบบถ่วงน้ำหนัก
  function weightedSample(items, count) {
    const selected = [];
    const itemsCopy = [...items];
    while (selected.length < count && itemsCopy.length > 0) {
      const totalWeight = itemsCopy.reduce((sum, item) => sum + item.weight, 0);
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

  const selectedPids = new Set(selectedBooks.map(item => item.rc_alg_bo_pid));
  if (selectedBooks.length < totalTarget) {
    const remainingPool = uniqueResults.filter(item => !selectedPids.has(item.rc_alg_bo_pid));
    const additionalNeeded = totalTarget - selectedBooks.length;
    const additionalSelected = weightedSample(remainingPool, Math.min(additionalNeeded, remainingPool.length));
    selectedBooks = [...selectedBooks, ...additionalSelected];
  }

  if (selectedBooks.length < 10) {
    return NextResponse.json({ error: "ไม่สามารถแนะนำหนังสือได้" }, { status: 200 });
  }

  const totalSelectedWeight = selectedBooks.reduce((sum, item) => sum + item.weight, 0);
  const finalSelection = selectedBooks.map(item => ({
    pid: item.rc_alg_bo_pid,
    rating: item.rc_alg_bo_rating,
    weight: item.weight,
    probability: totalSelectedWeight ? (item.weight / totalSelectedWeight) : 0
  }));

  return NextResponse.json(finalSelection);
}
