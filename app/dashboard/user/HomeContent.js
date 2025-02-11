import BookRecommendations from "../components/BookRecommendations";
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faWallet, faCreditCard, faUniversity, faUndo } from '@fortawesome/free-solid-svg-icons';
import { motion } from "framer-motion"; // ตัวอย่าง react animation
import Swal from "sweetalert2";

const HomeContent = ({userID}) => { 

  // 🔹 State สำหรับ Profile และ Modal
  const [showModal, setShowModal] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [latestProfile, setLatestProfile] = useState(null);

  // 🔹 State สำหรับฟอร์ม
  const [facultyList, setFacultyList] = useState([]);
  const [faculty, setFaculty] = useState("");
  const [departmentList, setDepartmentList] = useState([]);
  const [department, setDepartment] = useState("");
  const [categoryList, setCategoryList] = useState([]);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");

  // 🔹 State สำหรับ Associations rules
  const [recommendations, setRecommendations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    const userIDValue = typeof userID === 'object' ? userID.toString() : userID;
    console.log('UserID:', userIDValue);
  }, [userID]);

  // ดึงข้อมูล Profile ล่าสุด
  const fetchProfileData = async () => {
    try {
      const res = await fetch(`/api/user-profiles/fetch?userID=${userID}`);
      if (!res.ok) {
        console.error("Fetch profiles error");
        return;
      }
      const { success, data } = await res.json();
      if (success) {
        setProfiles(data);
        setUserProfile(data);
        if (data.length === 0) {
          // ถ้าไม่มี profile เลย ให้เปิด modal ทันที
          Swal.fire({
            title: 'กรุณาสร้างโปรไฟล์ก่อน',
            html: `
              <p>โปรไฟล์นี้จะนำไปใช้เป็นค่าเริ่มต้นให้ระบบคำนวนอัลกอริทึม</p>
              <p>สำหรับการแนะนำหนังสือ</p>
              <p class='text-purple-600 font-bold'>ข้อมูลนี้จะใช้เพื่อการวิจัย และการศึกษาเท่านั้น </p>
            `,
            icon: 'info',
            showCancelButton: false,
            confirmButtonText: 'ยืนยัน',
            allowOutsideClick: false,
          }).then((result) => {
            if(result.isConfirmed) {
              setShowModal(true);
            }
          })
        } else {
          // หา revision สูงสุด
          const sorted = [...data].sort(
            (a, b) => b.rc_ac_us_pr_revision - a.rc_ac_us_pr_revision
          );
          setLatestProfile(sorted[0]); // เก็บไว้ใช้แสดงบนหน้า
          setShowModal(false); // มีโปรไฟล์แล้ว จบงาน ไม่ต้องเปิด modal
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // เรียก fetchProfileData ทันทีที่เปิดหน้า (render ครั้งแรก) 
  useEffect(() => {
    if (userID) {
      fetchProfileData();
    }
  }, [userID]);

  // ดึงข้อมูล Faculty
  const fetchFaculties = async () => {
    try {
      const res = await fetch("/api/user-profiles/dropdown?type=faculty");
      const { success, data } = await res.json();
      if (success) {
        setFacultyList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  // ดึงข้อมูล Department (เมื่อ faculty เปลี่ยน)
  const fetchDepartments = async (facId) => {
    try {
      const res = await fetch(`/api/user-profiles/dropdown?type=department&facId=${facId}`);
      const { success, data } = await res.json();
      if (success) {
        setDepartmentList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ดึงข้อมูล Category (เมื่อ faculty เปลี่ยน)
  const fetchCategories = async (facId) => {
    try {
      const res = await fetch(`/api/user-profiles/dropdown?type=category&facId=${facId}`);
      const { success, data } = await res.json();

      if (success) {
        // ตรวจสอบข้อมูลซ้ำ (duplicate) ก่อนเก็บลง state
        const seen = new Set();         // เก็บ pid ที่เคยเจอ
        const uniqueItems = [];         // เก็บ item ที่ไม่ซ้ำ
        const duplicateItems = [];      // เก็บ item ที่ซ้ำ

        data.forEach((item) => {
          if (seen.has(item.rc_bo_cat_pid)) {
            // ถ้ามี pid ใน Set แล้วแปลว่าซ้ำ
            duplicateItems.push(item);
          } else {
            seen.add(item.rc_bo_cat_pid);
            uniqueItems.push(item);
          }
        });

        if (duplicateItems.length > 0) {
          Swal.fire({
            title: "พบข้อมูลซ้ำ",
            text: "มีหมวดหมู่บางรายการซ้ำกัน ระบบจะกรองออกให้เหลือเฉพาะรายการที่ไม่ซ้ำ",
            icon: "warning",
          });
        }

        // set เฉพาะ uniqueItems (ไม่ซ้ำ) ลง state
        setCategoryList(uniqueItems);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // เมื่อกด faculty dropdown
  const handleFacultyChange = (e) => {
    const value = e.target.value;
    setFaculty(value);
    setDepartment("");
    setDepartmentList([]);
    fetchDepartments(value);
    fetchCategories(value);
    // reset p1, p2, p3
    setP1("");
    setP2("");
    setP3("");
  };

  // ส่งข้อมูลไปยัง API เพื่อ insert profile (revision +1)
  const handleSaveProfile = async () => {
    // 1) เช็คว่ากรอกข้อมูล Faculty และ Department หรือยัง
    if (!faculty || !department) {
      Swal.fire("กรุณากรอกข้อมูลให้ครบ", "", "warning");
      return;
    }

    // 2) เช็คว่ามีการเลือกหมวดหมู่ซ้ำกันหรือเปล่า
    //    ถ้า p1, p2, p3 ใด ๆ ซ้ำกันให้แจ้งเตือนและไม่บันทึก
    if (p1 === p2 || p1 === p3 || p2 === p3 || p3 === p2) {
      Swal.fire("พบการเลือกหมวดหมู่ซ้ำกัน", "กรุณาเลือกหมวดหมู่ที่ไม่ซ้ำกัน", "warning");
      return;
    }

    // เช็คว่าข้อมูลที่จะบันทึกซ้ำกับข้อมูลล่าสุดหรือไม่
    if (latestProfile && faculty === latestProfile.rc_ac_us_pr_fac_pid && department === latestProfile.rc_ac_us_pr_dep_pid && p1 === latestProfile.rc_ac_us_pr_p1 && p2 === latestProfile.rc_ac_us_pr_p2 && p3 === latestProfile.rc_ac_us_pr_p3) {
      Swal.fire("ข้อมูลไม่มีการเปลี่ยนแปลง", "ข้อมูลที่คุณพยายามบันทึกซ้ำกับข้อมูลล่าสุด", "info");
      return;
    }

    console.log("Before fetch => p1, p2, p3 =", p1, p2, p3);

    try {
      const bodyData = {
        userID,
        faculty,
        department,
        p1,
        p2,
        p3,
      };
      
      const res = await fetch("/api/user-profiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      // const { success, message } = await res.json();

      const data = await res.json(); // data = { success: boolean, message: string, ... }
      console.log("API response =>", data); // Debug

      if(!data.success) {
        // ถ้า success = false ให้แสดง error
        Swal.fire("เกิดข้อผิดพลาด", data.message, "error");
        return;
      }
      // เรียก fetchProfileData ใหม่ เพื่ออัปเดต latestProfile และ profiles
      Swal.fire("บันทึกสำเร็จ", data.message, "success");
      await fetchProfileData();
      
    } catch (err) {
      console.error(err);
      Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
    }
  };

  // เรียกข้อมูล faculty ทันทีที่โหลดหน้า
  useEffect(() => {
    fetchFaculties();
  }, []);

  // ปุ่มเปิด Modal เพื่อแก้ไขหรือสร้าง profile ใหม่
  const openEditModal = () => {
    setShowModal(true);

    // ถ้ามี latestProfile อยู่ ให้ใส่ค่าเดิมลงในฟอร์ม
    // สมมติเราต้องการ "แก้ไข" แล้วบันทึกเป็น Revision ใหม่
    if (latestProfile) {
      setFaculty(latestProfile.rc_ac_us_pr_fac_pid || "");
      setDepartment(latestProfile.rc_ac_us_pr_dep_pid || "");
      // โหลด department list กับ category list ใหม่ด้วย fac เดิม
      if (latestProfile.rc_ac_us_pr_fac_pid) {
        fetchDepartments(latestProfile.rc_ac_us_pr_fac_pid);
        fetchCategories(latestProfile.rc_ac_us_pr_fac_pid);
      }
      setP1(latestProfile.rc_ac_us_pr_p1 || "");
      setP2(latestProfile.rc_ac_us_pr_p2 || "");
      setP3(latestProfile.rc_ac_us_pr_p3 || "");
    } else {
      // ถ้าไม่มี latestProfile (ไม่มีข้อมูล profile เลย)
      // ก็ clear form ให้เป็นค่าว่าง
      setFaculty("");
      setDepartment("");
      setDepartmentList([]);
      setCategoryList([]);
      setP1("");
      setP2("");
      setP3("");
    }
  };

  // ========================================================================
  // ========================================================================

  const translations = {
      "กฎหมาย": "Law",
      "เกษตรศาสตร์": "Agriculture",
      "จิตวิทยา": "Psychology",
      "เทคโนโลยี": "Technology",
      "นิยาย": "Novel",
      "ประวัติศาสตร์โลก": "World History",
      "แพทย์ศาสตร์ทั่วไป, วิชาชีพด้านสุขภาพ": "General Medicine, Health Professions",
      "ภาษาศาสตร์ และ วรรณกรรม": "Language and literature",
      "ภูมิศาสตร์ มานุษยวิทยา": "Geography, Anthropology",
      "ยา": "Medicine",
      "วิทยาศาสตร์": "Science",
      "รัฐศาสตร์": "Political Science",
      "สังคมศาสตร์": "Social Science",
  };

  function translateToThai(categories) {
      const reverseTranslations = Object.fromEntries(
          Object.entries(translations).map(([thai, eng]) => [eng, thai])
      );
      return categories.map(category => reverseTranslations[category] || category);
  }

  function translateCategories(categories) {
      return categories.map(category => translations[category] || category);
  }

  useEffect(() => {
    if (profiles && profiles.length > 0) {
        queryRecommendations(profiles); // เรียกใช้ queryRecommendations ทันทีเมื่อ userProfile เปลี่ยน
    }
  }, [profiles]); // userProfile เป็น dependency

  async function queryRecommendations(profile) {
    const groupMapping = {
        group1: [1, 2, 3],
        group2: [5, 7, 11],
        group3: [4, 6, 8, 9, 10],
    };

    const userGroup = Object.entries(groupMapping).find(([_, ids]) =>
      profile?.[0]?.rc_ac_us_pr_fac_pid && ids.includes(profile[0].rc_ac_us_pr_fac_pid)
    )?.[0];

    const groupAssoPid = {
        group1: 1,
        group2: 2,
        group3: 3,
    }[userGroup];

    if (!groupAssoPid) {
        console.log("No matching group for user.");
        return;
    }

    const categories = [
        profile[0].category1,
        profile[0].category2,
        profile[0].category3,
    ];

    const translatedCategories = translateCategories(categories);
    console.log("Translated Categories:", translatedCategories);

    let totalMatches = 0; // Track the total number of matched rules

    // Query for 3 matches
    let result = await fetchQuery(translatedCategories, 3, groupAssoPid);
    if (result && result.length > 0) {
        totalMatches += result.length;
        setRecommendations(processRecommendations(result));
        setMatchCount(totalMatches);
        return;
    }

    // Query for 2 matches (different combinations)
    const pairs = [
        [translatedCategories[0], translatedCategories[1]],
        [translatedCategories[1], translatedCategories[2]],
        [translatedCategories[0], translatedCategories[2]],
    ];

    for (const pair of pairs) {
        result = await fetchQuery(pair, 2, groupAssoPid);
        if (result && result.length > 0) {
            totalMatches += result.length;
            setRecommendations(processRecommendations(result));
            setMatchCount(totalMatches);
            return;
        }
    }

    // Query for 1 match
    for (const category of translatedCategories) {
        result = await fetchQuery([category], 1, groupAssoPid);
        if (result && result.length > 0) {
            totalMatches += result.length;
            setRecommendations(processRecommendations(result));
            setMatchCount(totalMatches);
            return;
        }
    }

    setMatchCount(totalMatches);
    setRecommendations([]);
  }

    async function fetchQuery(categories, matchCount, groupAssoPid) {
        let query = "";
        if (matchCount === 3) {
            query = `SELECT * FROM rc_association_json
                WHERE JSON_CONTAINS(JSON_EXTRACT(rc_as_js_rule, '$.antecedents'), '${JSON.stringify(categories)}')
                AND rc_as_js_GroupAsso_pid = ${groupAssoPid};`;
        } else if (matchCount === 2) {
            const conditions = categories
                .map(cat => `JSON_CONTAINS(JSON_EXTRACT(rc_as_js_rule, '$.antecedents'), '"${cat}"')`)
                .join(' AND ');
            query = `SELECT * FROM rc_association_json
                WHERE ${conditions}
                AND JSON_LENGTH(JSON_EXTRACT(rc_as_js_rule, '$.antecedents')) = 2
                AND rc_as_js_GroupAsso_pid = ${groupAssoPid};`;
        } else {
            query = `SELECT * FROM rc_association_json
                WHERE JSON_CONTAINS(JSON_EXTRACT(rc_as_js_rule, '$.antecedents'), '"${categories[0]}"')
                AND JSON_LENGTH(JSON_EXTRACT(rc_as_js_rule, '$.antecedents')) = 1
                AND rc_as_js_GroupAsso_pid = ${groupAssoPid};`;
        }

        try {
            // console.log("Executing query:", query);
            const res = await fetch("/api/association/get-rules", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("API error:", errorText);
                return null;
            }

            const json = await res.json();
            // console.log("Fetched Recommendations:", json);
            return json;
        } catch (err) {
            console.error("Error fetching query:", err);
            return null;
        }
    }

    function processRecommendations(recommendations) {
        return recommendations.map(item => ({
            ...item,
            rc_as_js_rule: item.rc_as_js_rule ? JSON.parse(item.rc_as_js_rule) : null,
        }));
    }

    const cardProfiles = [
    { 
      icon:faMoneyBillWave, title: "Faculty (คณะ)", 
      subtitle: latestProfile?.rc_fac_name ?? 'ไม่มีข้อมูล',
      dataID: latestProfile?.rc_ac_us_pr_fac_pid ?? 'Null',
      color: "bg-green-500" 
    },
    { 
      icon:faWallet, title: "Department (สาขา)", 
      subtitle: latestProfile?.rc_dep_name ?? 'ไม่มีข้อมูล', 
      dataID: latestProfile?.rc_ac_us_pr_dep_pid ?? 'Null',
      color: "bg-teal-500" 
    },
    { 
      icon:faCreditCard, title: "หมวดหมู่หนังสือที่ชอบ 1", 
      subtitle: latestProfile?.category1 ?? 'ไม่มีข้อมูล', 
      dataID: latestProfile?.rc_ac_us_pr_p1 ?? 'Null',
      color: "bg-red-500" 
    },
    { 
      icon:faUniversity, title: "หมวดหมู่หนังสือที่ชอบ 2", 
      subtitle: latestProfile?.category2 ?? 'ไม่มีข้อมูล',
      dataID: latestProfile?.rc_ac_us_pr_p2 ?? 'Null',
      color: "bg-blue-500" 
    },
    { 
      icon:faUndo, title: "หมวดหมู่หนังสือที่ชอบ 3", 
      subtitle: latestProfile?.category3 ?? 'ไม่มีข้อมูล',
      dataID: latestProfile?.rc_ac_us_pr_p3 ?? 'Null',
      color: "bg-gray-500" 
    },    
  ]

  const groupLabels = {
    1: "วิทยาศาสตร์ทั่วไป",
    2: "วิทยาศาสตร์สุขภาพ",
    3: "สังคมศาสตร์ และ มนุษยศาสตร์"
  };

    return (
        <>
        <div className='flex flex-col md:flex-row justify-between items-center mx-4 md:mx-6 bg-gray-100 text-white p-4'>
          <div>
            <p className="text-2xl md:text-4xl font-semibold text-purple-600">User Dashboard</p>
          </div>
          <div className='text-black mt-2 md:mt-0'>
            <a href="#" className="no-underline hover:text-gray-300">หน้าแรก </a>
            <span className="mx-2">/</span>
          </div>
        </div>

        <div className="mx-4 md:mx-6 mt-4 text-black">
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4">  {/* Responsive grid */}
            
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-4">
              <div className="mx-2 my-2 bg-white shadow-md rounded-lg shadow-lg p-6 flex flex-col justify-between">
                <h3 className="text-2xl font-bold mb-4 text-black">ข้อมูล กฎความสัมพันธ์ (Association Rule)</h3>
                <ul className="grid grid-cols-1 gap-4">
                        {recommendations.map((rec, index) => (
                            <li
                                key={index}
                                className="p-4 border rounded shadow-lg transform transition-transform duration-300 hover:scale-105">
                                <h3 className="text-xl font-semibold mb-2">Group ID: {rec.rc_as_js_GroupAsso_pid}</h3>
                                <p>Rule Number: {rec.rc_as_js_rule?.rule_number || "N/A"}</p>
                                <p>Antecedents (ความสัมพันธ์ ): {rec.rc_as_js_rule?.antecedents ? translateToThai(rec.rc_as_js_rule.antecedents).join(", ") : "N/A"}</p>
                                <p>Consequent (ผลที่ตามมา): {rec.rc_as_js_rule?.consequent ? translateToThai([rec.rc_as_js_rule.consequent]).join(", ") : "N/A"}</p>
                                <p>Support: {rec.rc_as_js_rule?.support || "N/A"}</p>
                                <p>Confidence: {rec.rc_as_js_rule?.confidence || "N/A"}</p>
                            </li>
                        ))}
                        {recommendations.length === 0 && <p>No matching recommendations found.</p>}
                    </ul>

                <hr className="my-4" />  {/* เส้นขีดแบ่ง */}

                <div className="flex justify-between items-center">
                  <p className="text-black font-semibold py-2 px-4 rounded text-lg">
                    กลุ่มความสัมพันธ์ : <span className="text-purple-600"> 
                      {recommendations.length > 0 ? groupLabels[recommendations[0].rc_as_js_GroupAsso_pid] : "ไม่ระบุ"}
                    </span>
                  </p>
                  <p className="text-black font-semibold py-2 px-4 rounded text-lg">
                    กฎความสัมพันธ์ที่จับคู่ได้ทั้งหมด : <span className="text-purple-600">  
                      {matchCount}
                    </span>
                  </p>
                </div>

              </div>
            </div>
            
              <div className="mx-2 my-2 bg-white shadow-md rounded-lg shadow-lg p-6 flex flex-col justify-between">
                <h3 className="text-2xl font-bold mb-4 text-black">ข้อมูล โปรไฟล์ผู้ใช้ (User Profiles)</h3>
                <ul>
                  {cardProfiles.map((card, index) => (
                    <li key={index} className="flex items-center justify-between my-3">
                      <div className="flex items-center">
                        <div className={`${card.color} p-2 rounded-md text-white text-2xl`}>
                          <FontAwesomeIcon icon={card.icon} className="w-7 h-5" />
                        </div>
                        <div className="ml-5">
                          <p className="text-sm font-semibold text-black">{card.title}</p>
                          <p className="text-xs text-gray-500">{card.subtitle}</p>
                        </div>
                      </div>
                      {/* <span className={`${transaction.amount.startsWith('+') ? 'text-green-500' : 'text-red-500'} font-semibold text-lg`}> */}
                        {/* {transaction.amount} */}
                      {/* </span> */}
                      <span >
                        dataID : {card.dataID}
                      </span>
                    </li>
                  ))}
                </ul>

                <hr className="my-4" />  {/* เส้นขีดแบ่ง */}

                <div className="flex justify-between items-center">
                  <button
                    onClick={openEditModal}
                    className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 text-sm">
                    แก้ไขข้มูล Profiles
                  </button>
                  <p className="text-xs text-gray-500">Profiles Revision : 
                    <span className='text-purple-600'> {latestProfile?.rc_ac_us_pr_revision ?? 'ไม่มีข้อมูล'} </span>
                  </p>
                </div>

              </div>
          </div>
        </div>

        <BookRecommendations bookRec={{ bookRule: recommendations, bookProfiles: profiles}} />

      {/* ----------------------------------------------
        ส่วนจัดการ Profile (นอกเหนือจาก Sidebar/Main)
      ---------------------------------------------- */}
      <main className="p-4">

        {/* Modal (ใช้ framer-motion เพื่อโชว์ตัวอย่าง animation) */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full"
            >
              <h2 className="text-xl font-bold mb-4 text-black">
                สร้าง/แก้ไข Profile
              </h2>

              <div className="flex flex-col gap-4 text-black">
                {/* Faculty */}
                <div>
                  <label className="block mb-1">Faculty (คณะ)</label>
                  <select
                    className="border p-2 w-full"
                    value={faculty}
                    onChange={handleFacultyChange}
                  >
                    <option value="">-- เลือกคณะ --</option>
                    {facultyList.map((fac) => (
                      <option key={fac.rc_fac_pid} value={fac.rc_fac_pid}>
                        {fac.rc_fac_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block mb-1">Department (สาขา)</label>
                  <select
                    className="border p-2 w-full"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!faculty}
                  >
                    <option value="">-- เลือกสาขา --</option>
                    {departmentList.map((dep) => (
                      <option key={dep.rc_dep_pid} value={dep.rc_dep_pid}>
                        {dep.rc_dep_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category 1 */}
                <div>
                  <label className="block mb-1">หมวดหมู่หนังสือที่ชอบ 1</label>
                  <select
                    className="border p-2 w-full"
                    value={p1}
                    onChange={(e) => setP1(e.target.value)}
                    disabled={!faculty}
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categoryList.map((cat) => (
                      <option key={cat.rc_bo_cat_pid} value={cat.rc_bo_cat_pid}>
                        {cat.rc_bo_cat_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category 2 */}
                <div>
                  <label className="block mb-1">หมวดหมู่หนังสือที่ชอบ 2</label>
                  <select
                    className="border p-2 w-full"
                    value={p2}
                    onChange={(e) => setP2(e.target.value)}
                    disabled={!faculty}
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categoryList.map((cat) => (
                      <option key={cat.rc_bo_cat_pid} value={cat.rc_bo_cat_pid}>
                        {cat.rc_bo_cat_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category 3 */}
                <div>
                  <label className="block mb-1">หมวดหมู่หนังสือที่ชอบ 3</label>
                  <select
                    className="border p-2 w-full"
                    value={p3}
                    onChange={(e) => setP3(e.target.value)}
                    disabled={!faculty}
                  >
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categoryList.map((cat) => (
                      <option key={cat.rc_bo_cat_pid} value={cat.rc_bo_cat_pid}>
                        {cat.rc_bo_cat_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ปุ่มบันทึก / ปิด */}
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    onClick={handleSaveProfile}
                  >
                    บันทึก
                  </button>

                  {/* เงื่อนไข: มี latestProfile แล้ว ถึงจะให้ปิด modal ได้ 
                      (หรือจะให้ปิด modal ได้เลยก็แล้วแต่ requirement) */}
                  {latestProfile && (
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      onClick={() => setShowModal(false)}
                    >
                      ปิด
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>                      
        
      </>
    );        
  }

export default HomeContent;

    // useEffect(() => {
    //     async function fetchUserProfile() {
    //         if (!userID) return;  // ตรวจสอบว่ามี userID หรือไม่
    //         else console.log(`UserID = ${userID}`)

    //         try {
    //             const res = await fetch(`/api/association/user-profile?userID=${userID}`);
    //             const data = await res.json();
    //             setUserProfile(data);
    //             // if (data) {
    //             //     queryRecommendations(data);
    //             // }
    //         } catch (err) {
    //             console.error("Error fetching user profile:", err);
    //         }
    //     }

    //     fetchUserProfile();
    // }, [userID]); // เพิ่ม userID เป็น dependency
