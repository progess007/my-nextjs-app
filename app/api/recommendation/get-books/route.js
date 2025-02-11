// app/api/recommendation/get-books/route.js
import { NextResponse } from "next/server";
import { db } from "@/utils/db"; // db ถูก export จาก mysql.createPool(...)

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const groupID = searchParams.get("groupID");
  const facID = searchParams.get("facID");
  const depID = searchParams.get("depID");
  const catID = searchParams.get("catID");
  const favID_1 = searchParams.get("favID_1");
  const favID_2 = searchParams.get("favID_2");
  const favID_3 = searchParams.get("favID_3");

  // ฟังก์ชันสำหรับ query ตาราง rc_algorithm_book_rating_depart
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
    `;
    const [rows] = await db.query(sql, [groupID, facID, depID, cat]);
    return rows;
  }

  // ฟังก์ชันสำหรับ query ตาราง rc_algorithm_book_rating_faculty
  async function queryFaculty(cat) {
    const sql = `
      SELECT rc_alg_bo_groupasso_pid, rc_alg_bo_fac_pid, 
             rc_alg_bo_cat_pid, rc_alg_bo_pid, rc_alg_bo_count, 
             rc_alg_bo_rating, rc_alg_bo_percentile
      FROM rc_algorithm_book_rating_faculty
      WHERE rc_alg_bo_groupasso_pid = ? 
        AND rc_alg_bo_fac_pid = ? 
        AND rc_alg_bo_cat_pid = ?
    `;
    const [rows] = await db.query(sql, [groupID, facID, cat]);
    return rows;
  }

  // เริ่มต้น query จากตาราง depart โดยใช้ catID ที่รับมาจากฟอร์ม
  let results = await queryDepart(catID);
  if (results.length < 5) {
    results = await queryDepart(favID_1);
    if (results.length < 5) {
      results = await queryDepart(favID_2);
      if (results.length < 5) {
        results = await queryDepart(favID_3);
      }
    }
  }

  // หากยังไม่เพียงพอ ให้ query จากตาราง faculty
  if (results.length < 5) {
    results = await queryFaculty(catID);
    if (results.length < 5) {
      results = await queryFaculty(favID_1);
      if (results.length < 5) {
        results = await queryFaculty(favID_2);
        if (results.length < 5) {
          results = await queryFaculty(favID_3);
        }
      }
    }
  }

  // กรองไม่ให้มีหนังสือที่มี rc_alg_bo_pid ซ้ำกัน
  const uniqueResultsMap = new Map();
  results.forEach(item => {
    uniqueResultsMap.set(item.rc_alg_bo_pid, item);
  });
  const uniqueResults = Array.from(uniqueResultsMap.values());

  // คำนวณ weight สำหรับแต่ละหนังสือ (สูตรง่าย ๆ คือ count * rating)
  uniqueResults.forEach(item => {
    item.weight = Number(item.rc_alg_bo_count) * Number(item.rc_alg_bo_rating);
  });

  // แบ่งหนังสือตามระดับเรตติ้ง
  const group5 = uniqueResults.filter(item => Number(item.rc_alg_bo_rating) === 5);
  const group4 = uniqueResults.filter(item => Number(item.rc_alg_bo_rating) === 4);
  const groupLow = uniqueResults.filter(item => Number(item.rc_alg_bo_rating) < 4);

  // กำหนดเป้าหมายการเลือกหนังสือในแต่ละกลุ่ม
  const target5 = 5;     // เรตติ้ง 5 → 50%
  const target4 = 3;     // เรตติ้ง 4 → 30%
  const targetLow = 2;   // เรตติ้ง 1-3 → 20%
  const totalTarget = 10;

  // ฟังก์ชันสุ่มแบบถ่วงน้ำหนัก (Weighted Sampling) แบบไม่เอาซ้ำ (Without Replacement)
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

  // ดำเนินการสุ่มหนังสือจากแต่ละกลุ่มตามเป้าหมาย
  const selected5 = weightedSample(group5, Math.min(target5, group5.length));
  const selected4 = weightedSample(group4, Math.min(target4, group4.length));
  const selectedLow = weightedSample(groupLow, Math.min(targetLow, groupLow.length));

  // รวมผลที่ได้
  let selectedBooks = [...selected5, ...selected4, ...selectedLow];

  // หากยังไม่ครบตามเป้าหมาย ให้เติมหนังสือจากกลุ่มที่เหลือ (โดยไม่เอาหนังสือที่ถูกเลือกไปแล้ว)
  const selectedPids = new Set(selectedBooks.map(item => item.rc_alg_bo_pid));
  if (selectedBooks.length < totalTarget) {
    const remainingPool = uniqueResults.filter(item => !selectedPids.has(item.rc_alg_bo_pid));
    const additionalNeeded = totalTarget - selectedBooks.length;
    const additionalSelected = weightedSample(remainingPool, Math.min(additionalNeeded, remainingPool.length));
    selectedBooks = [...selectedBooks, ...additionalSelected];
  }

  // คำนวณ probability สำหรับหนังสือที่ถูกเลือก (Probability = weight ของหนังสือ / น้ำหนักรวม)
  const totalSelectedWeight = selectedBooks.reduce((sum, item) => sum + item.weight, 0);
  const finalSelection = selectedBooks.map(item => ({
    pid: item.rc_alg_bo_pid,
    rating: item.rc_alg_bo_rating,
    weight: item.weight,
    probability: totalSelectedWeight ? (item.weight / totalSelectedWeight) : 0
  }));

  return NextResponse.json(finalSelection);
}
