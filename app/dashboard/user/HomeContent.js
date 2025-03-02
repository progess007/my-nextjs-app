import BookRecommendations from "../components/BookRecommendations";
import { useEffect, useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChalkboardTeacher,
  faBuilding,
  faBook,
  faBookOpen,
  faBookmark,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

// Mapping สำหรับแปลงจากภาษาอังกฤษกลับเป็นภาษาไทย
const englishToThai = {
  Law: "กฎหมาย",
  Agriculture: "เกษตรศาสตร์",
  Psychology: "จิตวิทยา",
  Technology: "เทคโนโลยี",
  Novel: "นิยาย",
  "World History": "ประวัติศาสตร์โลก",
  "General Medicine, Health Professions":
    "แพทย์ศาสตร์ทั่วไป, วิชาชีพด้านสุขภาพ",
  "Language and literature": "ภาษาศาสตร์ และ วรรณกรรม",
  "Geography, Anthropology": "ภูมิศาสตร์ มานุษยวิทยา",
  Medicine: "ยา",
  Science: "วิทยาศาสตร์",
  "Political Science": "รัฐศาสตร์",
  "Social Science": "สังคมศาสตร์",
};

const translateToThai = (text) => englishToThai[text] || text;
const translateArrayToThai = (arr) => arr.map((item) => translateToThai(item));

// ฟังก์ชันสำหรับเลือกกฎที่ดีที่สุด (โดยใช้ confidence เป็นหลัก ถ้าเท่ากันใช้ support)
const selectBestRule = (rules) => {
  return rules.reduce((best, rule) => {
    const bestConfidence = Number(best.rc_as_js_rule.confidence) || 0;
    const ruleConfidence = Number(rule.rc_as_js_rule.confidence) || 0;
    if (ruleConfidence > bestConfidence) return rule;
    if (ruleConfidence === bestConfidence) {
      const bestSupport = Number(best.rc_as_js_rule.support) || 0;
      const ruleSupport = Number(rule.rc_as_js_rule.support) || 0;
      return ruleSupport > bestSupport ? rule : best;
    }
    return best;
  }, rules[0]);
};

// ฟังก์ชันคำนวณ groupAssoPid จาก faculty ID
const computeGroupAssoPid = (facId) => {
  const id = Number(facId);
  if ([1, 2, 3].includes(id)) return 1;
  if ([5, 7, 11].includes(id)) return 2;
  if ([4, 6, 8, 9, 10].includes(id)) return 3;
  return null;
};

const HomeContent = ({ userID }) => {
  const [showModal, setShowModal] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [latestProfile, setLatestProfile] = useState(null);

  const [facultyList, setFacultyList] = useState([]);
  const [faculty, setFaculty] = useState("");
  const [departmentList, setDepartmentList] = useState([]);
  const [department, setDepartment] = useState("");
  const [categoryList, setCategoryList] = useState([]);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");

  const [recommendations, setRecommendations] = useState([]);
  const [matchCount, setMatchCount] = useState(0);
  const [showAssociation, setShowAssociation] = useState(true);
  const [showProfile, setShowProfile] = useState(true);

  // constant สำหรับกลุ่มความสัมพันธ์
  const groupLabels = {
    1: "วิทยาศาสตร์ทั่วไป",
    2: "วิทยาศาสตร์สุขภาพ",
    3: "สังคมศาสตร์ และ มนุษยศาสตร์",
  };

  useEffect(() => {
    if (window.innerWidth < 640) {
      setShowAssociation(false);
      setShowProfile(false);
    }
  }, []);

  useEffect(() => {
    console.log("UserID:", userID);
  }, [userID]);

  // ดึงข้อมูลโปรไฟล์ผู้ใช้
  const fetchProfileData = async () => {
    try {
      const res = await fetch(`/api/user-profiles?action=fetch&userID=${userID}`);
      const json = await res.json();
      if (json.success) {
        setProfiles(json.data);
        if (json.data.length === 0) {
          Swal.fire({
            title: "กรุณาสร้างโปรไฟล์ก่อน",
            html: `<p>โปรไฟล์นี้จะนำไปใช้เป็นค่าเริ่มต้นให้ระบบคำนวนอัลกอริทึม</p>
                   <p>สำหรับการแนะนำหนังสือ</p>
                   <p class='text-purple-600 font-bold'>ข้อมูลนี้จะใช้เพื่อการวิจัย และการศึกษาเท่านั้น </p>`,
            icon: "info",
            showCancelButton: false,
            confirmButtonText: "ยืนยัน",
            allowOutsideClick: false,
          }).then((result) => {
            if (result.isConfirmed) {
              setShowModal(true);
            }
          });
        } else {
          const sorted = [...json.data].sort(
            (a, b) => b.rc_ac_us_pr_revision - a.rc_ac_us_pr_revision
          );
          setLatestProfile(sorted[0]);
          setShowModal(false);
        }
      } else {
        Swal.fire("Error", json.message, "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userID) {
      fetchProfileData();
    }
  }, [userID]);

  // เมื่อ profiles เปลี่ยนแปลง ให้คำนวณหากฎความสัมพันธ์ที่ดีที่สุด
  useEffect(() => {
    if (profiles && profiles.length > 0) {
      queryRecommendations(profiles);
    }
  }, [profiles]);

  const fetchFaculties = async () => {
    try {
      const res = await fetch("/api/user-profiles?action=dropdown&type=faculty");
      const json = await res.json();
      if (json.success) {
        setFacultyList(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async (facId) => {
    try {
      const res = await fetch(
        `/api/user-profiles?action=dropdown&type=department&facId=${facId}`
      );
      const json = await res.json();
      if (json.success) {
        setDepartmentList(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async (facId) => {
    try {
      const res = await fetch(
        `/api/user-profiles?action=dropdown&type=category&facId=${facId}`
      );
      const json = await res.json();
      if (json.success) {
        setCategoryList(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFacultyChange = (e) => {
    const value = e.target.value;
    setFaculty(value);
    setDepartment("");
    setDepartmentList([]);
    fetchDepartments(value);
    fetchCategories(value);
    setP1("");
    setP2("");
    setP3("");
  };

  const handleSaveProfile = async () => {
    if (!faculty || !department) {
      Swal.fire("กรุณากรอกข้อมูลให้ครบ", "", "warning");
      return;
    }
    if (p1 === p2 || p1 === p3 || p2 === p3) {
      Swal.fire("พบการเลือกหมวดหมู่ซ้ำกัน", "กรุณาเลือกหมวดหมู่ที่ไม่ซ้ำกัน", "warning");
      return;
    }
    // ถ้าข้อมูลไม่เปลี่ยนแปลง
    if (
      latestProfile &&
      faculty === latestProfile.rc_ac_us_pr_fac_pid &&
      department === latestProfile.rc_ac_us_pr_dep_pid &&
      p1 === latestProfile.rc_ac_us_pr_p1 &&
      p2 === latestProfile.rc_ac_us_pr_p2 &&
      p3 === latestProfile.rc_ac_us_pr_p3
    ) {
      Swal.fire(
        "ข้อมูลไม่มีการเปลี่ยนแปลง",
        "ข้อมูลที่คุณพยายามบันทึกซ้ำกับข้อมูลล่าสุด",
        "info"
      );
      return;
    }
    try {
      const bodyData = { userID, faculty, department, p1, p2, p3 };
      const res = await fetch("/api/user-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      const json = await res.json();
      if (!json.success) {
        Swal.fire("เกิดข้อผิดพลาด", json.message, "error");
        return;
      }
      Swal.fire("บันทึกสำเร็จ", json.message, "success");
      await fetchProfileData();
    } catch (err) {
      console.error(err);
      Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const openEditModal = () => {
    setShowModal(true);
    if (latestProfile) {
      setFaculty(latestProfile.rc_ac_us_pr_fac_pid || "");
      setDepartment(latestProfile.rc_ac_us_pr_dep_pid || "");
      if (latestProfile.rc_ac_us_pr_fac_pid) {
        fetchDepartments(latestProfile.rc_ac_us_pr_fac_pid);
        fetchCategories(latestProfile.rc_ac_us_pr_fac_pid);
      }
      setP1(latestProfile.rc_ac_us_pr_p1 || "");
      setP2(latestProfile.rc_ac_us_pr_p2 || "");
      setP3(latestProfile.rc_ac_us_pr_p3 || "");
    } else {
      setFaculty("");
      setDepartment("");
      setDepartmentList([]);
      setCategoryList([]);
      setP1("");
      setP2("");
      setP3("");
    }
  };

  const cardProfiles = useMemo(
    () => [
      {
        icon: faChalkboardTeacher,
        title: "Faculty (คณะ)",
        subtitle: latestProfile?.rc_fac_name ?? "ไม่มีข้อมูล",
        dataID: latestProfile?.rc_ac_us_pr_fac_pid ?? "Null",
        color: "bg-green-500",
      },
      {
        icon: faBuilding,
        title: "Department (สาขา)",
        subtitle: latestProfile?.rc_dep_name ?? "ไม่มีข้อมูล",
        dataID: latestProfile?.rc_ac_us_pr_dep_pid ?? "Null",
        color: "bg-teal-500",
      },
      {
        icon: faBook,
        title: "หมวดหมู่หนังสือที่ชอบ 1",
        subtitle: latestProfile?.category1 ?? "ไม่มีข้อมูล",
        dataID: latestProfile?.rc_ac_us_pr_p1 ?? "Null",
        color: "bg-red-500",
      },
      {
        icon: faBookOpen,
        title: "หมวดหมู่หนังสือที่ชอบ 2",
        subtitle: latestProfile?.category2 ?? "ไม่มีข้อมูล",
        dataID: latestProfile?.rc_ac_us_pr_p2 ?? "Null",
        color: "bg-blue-500",
      },
      {
        icon: faBookmark,
        title: "หมวดหมู่หนังสือที่ชอบ 3",
        subtitle: latestProfile?.category3 ?? "ไม่มีข้อมูล",
        dataID: latestProfile?.rc_ac_us_pr_p3 ?? "Null",
        color: "bg-gray-500",
      },
    ],
    [latestProfile]
  );

  // สร้าง object สำหรับส่งข้อมูลไปยัง BookRecommendations
  const userProfileData = useMemo(() => {
    if (latestProfile) {
      return {
        userID: latestProfile.rc_ac_pid, // เมื่อ SELECT มาจาก DB แล้ว จะไม่เป็น undefined
        faculty: Number(latestProfile.rc_ac_us_pr_fac_pid),
        department: Number(latestProfile.rc_ac_us_pr_dep_pid),
        fav1: Number(latestProfile.rc_ac_us_pr_p1),
        fav2: Number(latestProfile.rc_ac_us_pr_p2),
        fav3: Number(latestProfile.rc_ac_us_pr_p3),
        groupID: computeGroupAssoPid(latestProfile.rc_ac_us_pr_fac_pid),
        consequent:
          recommendations.length > 0 &&
          recommendations[0].rc_as_js_rule?.consequent
            ? recommendations[0].rc_as_js_rule.consequent
            : null,
      };
    }
    return null;
  }, [latestProfile, recommendations]);

  // ฟังก์ชันสำหรับดึงกฎความสัมพันธ์ที่ดีที่สุด (เลือกแค่ 1 กฎ)
  const queryRecommendations = async (profileData) => {
    const groupMapping = {
      group1: [1, 2, 3],
      group2: [5, 7, 11],
      group3: [4, 6, 8, 9, 10],
    };

    const userGroup = Object.entries(groupMapping).find(
      ([, ids]) =>
        profileData?.[0]?.rc_ac_us_pr_fac_pid &&
        ids.includes(profileData[0].rc_ac_us_pr_fac_pid)
    )?.[0];

    const groupAssoPid = { group1: 1, group2: 2, group3: 3 }[userGroup];
    if (!groupAssoPid) return;

    const categories = [
      profileData[0].category1,
      profileData[0].category2,
      profileData[0].category3,
    ];

    // แปลงหมวดหมู่จากภาษาไทยเป็นภาษาอังกฤษ (สำหรับ query)
    const translatedCategories = categories.map((category) => {
      const translations = {
        "กฎหมาย": "Law",
        "เกษตรศาสตร์": "Agriculture",
        "จิตวิทยา": "Psychology",
        "เทคโนโลยี": "Technology",
        "นิยาย": "Novel",
        "ประวัติศาสตร์โลก": "World History",
        "แพทย์ศาสตร์ทั่วไป, วิชาชีพด้านสุขภาพ":
          "General Medicine, Health Professions",
        "ภาษาศาสตร์ และ วรรณกรรม": "Language and literature",
        "ภูมิศาสตร์ มานุษยวิทยา": "Geography, Anthropology",
        "ยา": "Medicine",
        "วิทยาศาสตร์": "Science",
        "รัฐศาสตร์": "Political Science",
        "สังคมศาสตร์": "Social Science",
      };
      return translations[category] || category;
    });

    // ลอง query กับ matchCount = 3
    let result = await fetchQuery(translatedCategories, 3, groupAssoPid);
    if (result && result.length > 0) {
      const bestRule = selectBestRule(result);
      setRecommendations(processRecommendations([bestRule]));
      setMatchCount(1);
      return;
    }

    // ลอง query กับ matchCount = 2 สำหรับแต่ละคู่
    const pairs = [
      [translatedCategories[0], translatedCategories[1]],
      [translatedCategories[1], translatedCategories[2]],
      [translatedCategories[0], translatedCategories[2]],
    ];
    for (const pair of pairs) {
      result = await fetchQuery(pair, 2, groupAssoPid);
      if (result && result.length > 0) {
        const bestRule = selectBestRule(result);
        setRecommendations(processRecommendations([bestRule]));
        setMatchCount(1);
        return;
      }
    }

    // ลอง query กับ matchCount = 1 สำหรับแต่ละหมวดหมู่
    for (const category of translatedCategories) {
      result = await fetchQuery([category], 1, groupAssoPid);
      if (result && result.length > 0) {
        const bestRule = selectBestRule(result);
        setRecommendations(processRecommendations([bestRule]));
        setMatchCount(1);
        return;
      }
    }
    setMatchCount(0);
    setRecommendations([]);
  };

  // ฟังก์ชันสำหรับ query กฎจาก API
  const fetchQuery = async (categories, matchCount, groupAssoPid) => {
    let query = "";
    if (matchCount === 3) {
      query = `SELECT * FROM rc_association_json
                WHERE JSON_CONTAINS(JSON_EXTRACT(rc_as_js_rule, '$.antecedents'), '${JSON.stringify(
                  categories
                )}')
                AND rc_as_js_GroupAsso_pid = ${groupAssoPid};`;
    } else if (matchCount === 2) {
      const conditions = categories
        .map(
          (cat) =>
            `JSON_CONTAINS(JSON_EXTRACT(rc_as_js_rule, '$.antecedents'), '"${cat}"')`
        )
        .join(" AND ");
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
      const res = await fetch("/api/association", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Error fetching query:", err);
      return null;
    }
  };

  const processRecommendations = (recs) => {
    return recs.map((item) => {
      const parsedRule = item.rc_as_js_rule
        ? JSON.parse(item.rc_as_js_rule)
        : null;
      return {
        ...item,
        rc_as_js_rule: parsedRule
          ? {
              ...parsedRule,
              antecedents: parsedRule.antecedents
                ? translateArrayToThai(parsedRule.antecedents)
                : null,
              consequent: parsedRule.consequent
                ? translateToThai(parsedRule.consequent)
                : null,
            }
          : null,
      };
    });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center mx-4 md:mx-6 bg-gray-100 text-white p-4">
        <div>
          <p className="text-xl sm:text-2xl md:text-4xl font-semibold text-purple-600">
            User Dashboard
          </p>
        </div>
        <div className="text-black mt-2 md:mt-0">
          <a href="#" className="no-underline hover:text-gray-300 text-sm md:text-base">
            หน้าแรก
          </a>
          <span className="mx-2 text-sm md:text-base">/</span>
        </div>
      </div>
      <div className="mx-4 md:mx-6 mt-4 text-black">
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="mx-2 my-2 bg-white shadow-md rounded-lg p-6">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowAssociation(!showAssociation)}
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-black">
                ข้อมูล กฎความสัมพันธ์ (Association Rule)
              </h3>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`transform transition-transform duration-300 ${
                  showAssociation ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>
            <div style={{ perspective: 1000 }}>
              <motion.div
                initial={false}
                animate={showAssociation ? "open" : "collapsed"}
                variants={{
                  open: { opacity: 1, height: "auto", rotateX: 0 },
                  collapsed: { opacity: 0, height: 0, rotateX: -15 },
                }}
                transition={{ duration: 0.5 }}
                style={{ overflow: "hidden" }}
              >
                <ul className="grid grid-cols-1 gap-4">
                  {recommendations.length > 0 ? (
                    recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="p-4 border rounded shadow-lg transform transition-transform duration-300 hover:scale-105"
                      >
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">
                          Group ID: {rec.rc_as_js_GroupAsso_pid}
                        </h3>
                        <p className="text-sm mb-1">
                          Rule Number:{" "}
                          {rec.rc_as_js_rule?.rule_number || "N/A"}
                        </p>
                        <p className="text-sm mb-1">
                          Antecedents:{" "}
                          {rec.rc_as_js_rule?.antecedents
                            ? rec.rc_as_js_rule.antecedents.join(", ")
                            : "N/A"}
                        </p>
                        <p className="text-sm mb-1">
                          Consequent:{" "}
                          {rec.rc_as_js_rule?.consequent !== null
                            ? rec.rc_as_js_rule.consequent
                            : "N/A"}
                        </p>
                        <p className="text-sm">
                          Support: {rec.rc_as_js_rule?.support || "N/A"}
                        </p>
                        <p className="text-sm">
                          Confidence:{" "}
                          {rec.rc_as_js_rule?.confidence || "N/A"}
                        </p>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm">
                      No matching recommendations found.
                    </p>
                  )}
                </ul>
                <hr className="my-4" />
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold py-2 px-4 rounded">
                    กลุ่มความสัมพันธ์ :{" "}
                    <span className="text-purple-600">
                      {recommendations.length > 0
                        ? groupLabels[recommendations[0].rc_as_js_GroupAsso_pid]
                        : "ไม่ระบุ"}
                    </span>
                  </p>
                  <p className="text-sm font-semibold py-2 px-4 rounded">
                    กฎความสัมพันธ์ที่จับคู่ได้ทั้งหมด :{" "}
                    <span className="text-purple-600">{matchCount}</span>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
          <div className="mx-2 my-2 bg-white shadow-md rounded-lg p-6">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowProfile(!showProfile)}
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-black">
                ข้อมูล โปรไฟล์ผู้ใช้ (User Profiles)
              </h3>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`transform transition-transform duration-300 ${
                  showProfile ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>
            <div style={{ perspective: 1000 }}>
              <motion.div
                initial={false}
                animate={showProfile ? "open" : "collapsed"}
                variants={{
                  open: { opacity: 1, height: "auto", rotateX: 0 },
                  collapsed: { opacity: 0, height: 0, rotateX: -15 },
                }}
                transition={{ duration: 0.5 }}
                style={{ overflow: "hidden" }}
              >
                <ul>
                  {cardProfiles.map((card, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between my-3"
                    >
                      <div className="flex items-center">
                        <div
                          className={`${card.color} p-2 rounded-md text-white text-2xl`}
                        >
                          <FontAwesomeIcon
                            icon={card.icon}
                            className="w-7 h-5"
                          />
                        </div>
                        <div className="ml-5">
                          <p className="text-sm md:text-base font-semibold text-black">
                            {card.title}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {card.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm">
                        dataID : {card.dataID}
                      </span>
                    </li>
                  ))}
                </ul>
                <hr className="my-4" />
                <div className="flex justify-between items-center">
                  <button
                    onClick={openEditModal}
                    className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 text-sm"
                  >
                    แก้ไขข้มูล Profiles
                  </button>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Profiles Revision :{" "}
                    <span className="text-purple-600">
                      {latestProfile?.rc_ac_us_pr_revision ?? "ไม่มีข้อมูล"}
                    </span>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      {/* ส่ง userProfileData ไปให้ BookRecommendations */}
      <BookRecommendations
        bookRec={{
          bookRule: recommendations,
          bookProfiles: profiles,
          userProfileData,
        }}
      />
      {showModal && (
        <main className="p-4">
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
                <div>
                  <label className="block mb-1 text-sm">Faculty (คณะ)</label>
                  <select
                    className="border p-2 w-full text-sm"
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
                <div>
                  <label className="block mb-1 text-sm">
                    Department (สาขา)
                  </label>
                  <select
                    className="border p-2 w-full text-sm"
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
                <div>
                  <label className="block mb-1 text-sm">
                    หมวดหมู่หนังสือที่ชอบ 1
                  </label>
                  <select
                    className="border p-2 w-full text-sm"
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
                <div>
                  <label className="block mb-1 text-sm">
                    หมวดหมู่หนังสือที่ชอบ 2
                  </label>
                  <select
                    className="border p-2 w-full text-sm"
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
                <div>
                  <label className="block mb-1 text-sm">
                    หมวดหมู่หนังสือที่ชอบ 3
                  </label>
                  <select
                    className="border p-2 w-full text-sm"
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
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                    onClick={handleSaveProfile}
                  >
                    บันทึก
                  </button>
                  {latestProfile && (
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                      onClick={() => setShowModal(false)}
                    >
                      ปิด
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      )}
    </>
  );
};

export default HomeContent;
