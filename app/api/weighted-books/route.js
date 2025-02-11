import { db } from "@/utils/db";
import { NextResponse } from "next/server";

const groupID = 1, facID = 1, depID = 1, catID = 7;

// ฟังก์ชันสุ่มแบบถ่วงน้ำหนัก (Weighted Sampling)
function weightedRandomSelection(items, count) {
    if (items.length === 0) return [];

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let selected = new Set();

    while (selected.size < count && selected.size < items.length) {
        let rand = Math.random() * totalWeight;
        let cumulativeWeight = 0;

        for (let item of items) {
            cumulativeWeight += item.weight;
            if (rand <= cumulativeWeight) {
                selected.add(item);
                break;
            }
        }
    }

    return Array.from(selected);
}

export async function GET() {
    try {
        // ดึงข้อมูลจากฐานข้อมูล
        const [books] = await db.query(
            `SELECT 
                rc_alg_bo_pid AS bookID, 
                rc_alg_bo_rating AS rating, 
                rc_alg_bo_count AS borrowCount, 
                rc_alg_bo_percentile AS percentile 
             FROM rc_algorithm_book_rating_depart
             WHERE rc_alg_bo_groupasso_pid = ? 
               AND rc_alg_bo_fac_pid = ? 
               AND rc_alg_bo_dep_pid = ? 
               AND rc_alg_bo_cat_pid = ?`,
            [groupID, facID, depID, catID]
        );

        if (books.length === 0) {
            return NextResponse.json({ message: "No books found" });
        }

        // คำนวณ Weight และ Probability
        let totalWeight = 0;
        books.forEach(book => {
            book.weight = book.borrowCount * book.percentile; // สูตรถ่วงน้ำหนัก
            totalWeight += book.weight;
        });

        books.forEach(book => {
            book.probability = book.weight / totalWeight; // คำนวณ Probability
        });

        // แบ่งกลุ่มตามเรตติ้ง
        let rating5 = books.filter(b => b.rating === 5);
        let rating4 = books.filter(b => b.rating === 4);
        let rating1to3 = books.filter(b => b.rating >= 1 && b.rating <= 3);

        // ฟังก์ชันเลือกหนังสือและป้องกันซ้ำ
        const selectedBooks = new Set();

        function selectBooksFromCategory(category, count) {
            let selected = weightedRandomSelection(category, count);
            selected.forEach(book => selectedBooks.add(book));

            if (selectedBooks.size < count) {
                let remaining = count - selectedBooks.size;
                let lowerCategory = category === rating5 ? rating4 : rating1to3;
                let additionalBooks = weightedRandomSelection(lowerCategory, remaining);
                additionalBooks.forEach(book => selectedBooks.add(book));
            }
        }

        // เลือกหนังสือแบบถ่วงน้ำหนัก
        selectBooksFromCategory(rating5, 5);
        selectBooksFromCategory(rating4, 3);
        selectBooksFromCategory(rating1to3, 2);

        return NextResponse.json(Array.from(selectedBooks));
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return NextResponse.json({ error: "Error fetching recommendations" }, { status: 500 });
    }
}
