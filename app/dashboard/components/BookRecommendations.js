'use client';

import { useState, useEffect } from "react";

const BookRecommendations = ({bookRec}) => {
  
  const books = [
    { title: 'Soul', author: 'Olivia Wilson', image: '/cover.jpg' },
    { title: 'Memory', author: 'Angelina Aludo', image: '/cover.jpg' },
    { title: 'My Book Cover', author: 'Author Name', image: '/cover.jpg' },
    { title: 'A Million to One', author: 'Tony Faggioli', image: '/cover.jpg' },
    { title: 'My Book Cover', author: 'Author Name', image: '/cover.jpg' },
    { title: 'My Book Cover', author: 'Author Name', image: '/cover.jpg' },
    { title: 'My Book Cover', author: 'Author Name', image: '/cover.jpg' },
    { title: 'My Book Cover', author: 'Author Name', image: '/cover.jpg' },
    { title: 'My Book Cover', author: 'Author Name', image: '/cover.jpg' },
    { title: 'My Book Cover', author: 'Author Name', image: '/cover.jpg' },
  ];

  // 🔹 ดึงค่า props ที่ส่งมาจาก HomeContent
  const Rules = bookRec.bookRule;
  const Profiles = bookRec.bookProfiles;

  // 🔹 เก็บตัวแปรที่จะนำไปหาค่า category
  const consequent = Rules?.[0]?.rc_as_js_rule?.consequent || "No Data";
  const groupID = Rules?.[0]?.rc_as_js_GroupAsso_pid || "No Data"; 

  const facID = Profiles?.[0]?.rc_ac_us_pr_fac_pid || "No Data";
  const depID = Profiles?.[0]?.rc_ac_us_pr_dep_pid || "No Data";

  const [categoryPID, setCategoryPID] = useState(null);

  const translations = {
    "กฎหมาย": "Law", "เกษตรศาสตร์": "Agriculture", "จิตวิทยา": "Psychology",
    "เทคโนโลยี": "Technology", "นิยาย": "Novel", "ประวัติศาสตร์โลก": "World History",
    "แพทย์ศาสตร์ทั่วไป, วิชาชีพด้านสุขภาพ": "General Medicine, Health Professions",
    "ภาษาศาสตร์ และ วรรณกรรม": "Language and literature",
    "ภูมิศาสตร์ มานุษยวิทยา": "Geography, Anthropology",
    "ยา": "Medicine", "วิทยาศาสตร์": "Science", "รัฐศาสตร์": "Political Science",
    "สังคมศาสตร์": "Social Science",
  };

  // หา key ที่ตรงกับค่าภาษาอังกฤษใน translations (แปลงค่าเป็นภาษาไทย)
  const translatedConsequent = Object.keys(translations).find(
    key => translations[key] === consequent
  ) || "ไม่พบคำแปล"; // ถ้าไม่มีคำแปลให้แสดงข้อความนี้

  useEffect(() => {
    const fetchCategoryPID = async () => {
      try {
        const res = await fetch("/api/recommendation/get-category-pid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translatedConsequent, groupID }),
        });
    
        const data = await res.json();
    
        if (res.ok && data.rc_bo_cat_pid) {
          setCategoryPID(data.rc_bo_cat_pid);
        } else {
          console.warn("ไม่พบข้อมูลในฐานข้อมูล");
          setCategoryPID("ไม่พบข้อมูล");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setCategoryPID("Error");
      }
    };

    if (translatedConsequent && groupID) {
      fetchCategoryPID();
    }
  }, [translatedConsequent, groupID]);

  const catID = categoryPID || "No data";

  // console.log(translatedConsequent);
  console.log(groupID + " " + consequent + " facID: " + facID + " depID: " + depID);
  console.log(catID);

  return(
    <>
        <section className="flex-1 p-8">
          {/* <h2 className="text-black">{book.name}</h2> */}
          <h2 className="text-2xl font-bold mb-6 text-black">แนะนำหนังสือ {catID}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {books.map((book, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                <img
                  src={book.image}
                  alt={book.title}
                  className="h-40 w-full object-cover rounded-md mb-4"
                />
                <h3 className="text-lg font-semibold">{book.title}</h3>
                <p className="text-sm text-gray-500">by {book.author}</p>
              </div>
            ))}
          </div>
        </section>
    </>
  )
}

export default BookRecommendations;