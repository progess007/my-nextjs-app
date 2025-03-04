import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaHeart, FaThumbsDown, FaInfoCircle, FaStar, FaBalanceScale, FaPercentage, FaExclamationCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

// Helper: แปลงเวลาปัจจุบันให้เป็น "YYYY-MM-DD HH:mm:ss" ตาม timezone Asia/Bangkok
const getCurrentBangkokTime = () => {
  const now = new Date();
  const bangkokTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" })
  );
  const year = bangkokTime.getFullYear();
  const month = String(bangkokTime.getMonth() + 1).padStart(2, "0");
  const day = String(bangkokTime.getDate()).padStart(2, "0");
  const hours = String(bangkokTime.getHours()).padStart(2, "0");
  const minutes = String(bangkokTime.getMinutes()).padStart(2, "0");
  const seconds = String(bangkokTime.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const BookRecommendations = ({ bookRec }) => {
  // bookRec ควรมี keys: bookRule, bookProfiles, userProfileData
  const { userProfileData } = bookRec;
  
  // State สำหรับ API query
  const [catID, setCatID] = useState(null); // ได้จาก /api/recommendation/get-category-pid
  const [algoBooks, setAlgoBooks] = useState([]); // ผลลัพธ์จาก /api/recommendation/get-books
  const [bookDetails, setBookDetails] = useState([]); // รายละเอียดหนังสือจาก /api/recommendation/get-book-details
  const [algoError, setAlgoError] = useState(null);
  
  // State สำหรับ modal popup
  const [selectedBook, setSelectedBook] = useState(null);
  const [modalType, setModalType] = useState("full"); // "info" หรือ "full"
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State สำหรับ icon actions
  const [favorites, setFavorites] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  
  // State สำหรับ activeTab ใน modal full detail
  const [activeTab, setActiveTab] = useState("Card");

  // ===============================
  // Query catID จาก API /api/recommendation/get-category-pid
  // ===============================
  const fetchCategoryID = useCallback(async () => {
    if (!userProfileData || !userProfileData.groupID || !userProfileData.consequent) return;
    try {
      const res = await fetch("/api/recommendation/get-category-pid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translatedConsequent: userProfileData.consequent,
          groupID: userProfileData.groupID,
        }),
      });
      const data = await res.json();
      if (res.ok && data.rc_bo_cat_pid) {
        setCatID(data.rc_bo_cat_pid);
      } else {
        setCatID(null);
      }
    } catch (error) {
      console.error("Error fetching category ID:", error);
      setCatID(null);
    }
  }, [userProfileData]);

  useEffect(() => {
    fetchCategoryID();
  }, [fetchCategoryID]);

  // ===============================
  // Query algorithm books จาก API /api/recommendation/get-books
  // ===============================
  const fetchAlgorithmBooks = useCallback(async () => {
    if (!userProfileData || !catID) return;
    try {
      const params = new URLSearchParams({
        userID: userProfileData.userID,
        groupID: userProfileData.groupID,
        facID: userProfileData.faculty,
        depID: userProfileData.department,
        catID: catID,
        favID_1: userProfileData.fav1,
        favID_2: userProfileData.fav2,
        favID_3: userProfileData.fav3,
      });
      const res = await fetch(`/api/recommendation/get-books?${params.toString()}`);
      const data = await res.json();
      if (res.ok && !data.error && data.length >= 10) {
        setAlgoBooks(data);
        setAlgoError(null);
      } else {
        setAlgoError("ไม่สามารถแนะนำหนังสือได้");
        setAlgoBooks([]);
      }
    } catch (error) {
      console.error("Error fetching algorithm books:", error);
      setAlgoError("ไม่สามารถแนะนำหนังสือได้");
      setAlgoBooks([]);
    }
  }, [catID, userProfileData]);

  useEffect(() => {
    fetchAlgorithmBooks();
  }, [fetchAlgorithmBooks]);

  // ===============================
  // Query รายละเอียดหนังสือจาก API /api/recommendation/get-book-details
  // ===============================
  const fetchBookDetails = useCallback(async () => {
    if (algoBooks.length === 0) return;
    const ids = algoBooks.map((book) => book.pid).join(",");
    try {
      const res = await fetch(`/api/recommendation/get-book-details?ids=${ids}`);
      if (!res.ok) throw new Error("Error fetching book details");
      const details = await res.json();
      setBookDetails(details);
    } catch (error) {
      console.error("Error fetching book details:", error);
      setBookDetails([]);
    }
  }, [algoBooks]);

  useEffect(() => {
    fetchBookDetails();
  }, [fetchBookDetails]);

  // ===============================
  // Combine algorithm books กับรายละเอียดหนังสือ
  // ===============================
  const combinedBooks = useMemo(() => {
    return bookDetails.map((detail) => {
      const algoBook = algoBooks.find((b) => b.pid === detail.rc_bo_pid);
      return { ...detail, rating: algoBook?.rating, weight: algoBook?.weight, probability: algoBook?.probability };
    });
  }, [bookDetails, algoBooks]);

  const sortedCombinedBooks = useMemo(() => {
    return combinedBooks.sort((a, b) => {
      const ratingDiff = Number(b.rating) - Number(a.rating);
      if (ratingDiff !== 0) return ratingDiff;
      const weightDiff = Number(b.weight) - Number(a.weight);
      if (weightDiff !== 0) return weightDiff;
      return Number(b.probability) - Number(a.probability);
    });
  }, [combinedBooks]);

  // ===============================
  // ฟังก์ชันบันทึก log เมื่อคลิกการ์ด (clickstream)
  // ===============================
  const logClick = async (bo_pid, rating) => {
    if (!userProfileData || !userProfileData.userID) return;
    const clickDate = getCurrentBangkokTime();
    const logData = {
      rc_log_cli_click: 1,
      rc_log_cli_date_click: clickDate,
      rc_log_ac_pid: userProfileData.userID,
      rc_log_bo_pid: bo_pid,
      rc_log_bo_rating: rating,
    };
    try {
      const res = await fetch("/api/log/clickstream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      if (res.ok) {
        console.log("Click log success");
      } else {
        console.error("Click log failed", res);
      }
    } catch (error) {
      console.error("Error logging click:", error);
    }
  };

  // ===============================
  // Modal Handling
  // ===============================
  const openModal = (book, type) => {
    // หากเปิด modal แบบ full detail ให้บันทึก log click
    if (type === "full") {
      logClick(book.rc_bo_pid, book.rating);
    }
    setSelectedBook(book);
    setModalType(type);
    if (type === "full") setActiveTab("Card");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };

  // ===============================
  // Icon Toggle Handlers พร้อม SweetAlert Confirmation
  // ===============================
  const toggleFavorite = async (e, pid) => {
    e.stopPropagation();
    if (favorites.includes(pid)) {
      // ถ้าอยู่ใน favorites แล้ว ให้ถามยืนยันนำออก
      const result = await Swal.fire({
        title: "คุณต้องการนำหนังสือออกจากรายการโปรดหรือไม่?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ใช่, นำออก",
        cancelButtonText: "ยกเลิก",
      });
      if (result.isConfirmed) {
        try {
          const res = await fetch("/api/log/favorite", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rc_log_fav_ac_pid: userProfileData.userID,
              rc_log_fav_bo_pid: pid,
              rc_log_fav_book: 1, // สำหรับ favorite removal
            }),
          });
          const data = await res.json();
          if (res.ok) {
            Swal.fire("นำออกจากรายการโปรดแล้ว", "", "success");
            setFavorites((prev) => prev.filter((id) => id !== pid));
            // รีเฟรชข้อมูลแนะนำหนังสือ
            fetchAlgorithmBooks();
          } else {
            Swal.fire("เกิดข้อผิดพลาด", data.error || "", "error");
          }
        } catch (error) {
          console.error("Error removing favorite:", error);
          Swal.fire("เกิดข้อผิดพลาด", "", "error");
        }
      }
    } else {
      // ไม่อยู่ใน favorites ให้ถามยืนยันเพิ่ม
      const result = await Swal.fire({
        title: "คุณต้องการเพิ่มหนังสือเข้ารายการโปรดหรือไม่?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ใช่, เพิ่มเข้ารายการโปรด",
        cancelButtonText: "ยกเลิก",
      });
      if (result.isConfirmed) {
        const favData = {
          rc_log_fav_book: 1, // 1 = favorite
          rc_log_fav_date: getCurrentBangkokTime(),
          rc_log_fav_ac_pid: userProfileData.userID,
          rc_log_fav_bo_pid: pid,
          rc_log_fav_bo_rating: algoBooks.find(b => b.pid === pid)?.rating,
        };
        try {
          const res = await fetch("/api/log/favorite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(favData),
          });
          const data = await res.json();
          if (res.ok) {
            Swal.fire("เพิ่มเข้ารายการโปรดแล้ว", "", "success");
            setFavorites((prev) => [...prev, pid]);
            // นำหนังสือออกจากการแนะนำ
            const updatedAlgoBooks = algoBooks.filter((book) => book.pid !== pid);
            setAlgoBooks(updatedAlgoBooks);
            fetchAlgorithmBooks();
          } else {
            Swal.fire("เกิดข้อผิดพลาด", data.error || "", "error");
          }
        } catch (error) {
          console.error("Error logging favorite:", error);
          Swal.fire("เกิดข้อผิดพลาด", "", "error");
        }
      }
    }
  };

  const toggleDislike = async (e, pid) => {
    e.stopPropagation();
    if (dislikes.includes(pid)) {
      const result = await Swal.fire({
        title: "คุณต้องการนำ dislike ออกหรือไม่?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ใช่, ลบ dislike",
        cancelButtonText: "ยกเลิก",
      });
      if (result.isConfirmed) {
        try {
          const res = await fetch("/api/log/favorite", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rc_log_fav_ac_pid: userProfileData.userID,
              rc_log_fav_bo_pid: pid,
              rc_log_fav_book: 0, // 0 = dislike removal
            }),
          });
          const data = await res.json();
          if (res.ok) {
            Swal.fire("นำ dislike ออกแล้ว", "", "success");
            setDislikes((prev) => prev.filter((id) => id !== pid));
            fetchAlgorithmBooks();
          } else {
            Swal.fire("เกิดข้อผิดพลาด", data.error || "", "error");
          }
        } catch (error) {
          console.error("Error removing dislike:", error);
          Swal.fire("เกิดข้อผิดพลาด", "", "error");
        }
      }
    } else {
      const result = await Swal.fire({
        title: "คุณต้องการให้หนังสือนี้ถูก marked as dislike หรือไม่?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ใช่, dislike",
        cancelButtonText: "ยกเลิก",
      });
      if (result.isConfirmed) {
        const dislikeData = {
          rc_log_fav_book: 0, // 0 = dislike
          rc_log_fav_date: getCurrentBangkokTime(),
          rc_log_fav_ac_pid: userProfileData.userID,
          rc_log_fav_bo_pid: pid,
          rc_log_fav_bo_rating: algoBooks.find(b => b.pid === pid)?.rating,
        };
        try {
          const res = await fetch("/api/log/favorite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dislikeData),
          });
          const data = await res.json();
          if (res.ok) {
            Swal.fire("Dislike บันทึกแล้ว", "", "success");
            setDislikes((prev) => [...prev, pid]);
            // เพิ่ม weight ให้กับหนังสือ disliked (เช่น เพิ่ม 20%)
            const updatedAlgoBooks = algoBooks.map((book) => {
              if (book.pid === pid) {
                return { ...book, weight: Number(book.weight) * 1.2 };
              }
              return book;
            });
            setAlgoBooks(updatedAlgoBooks);
          } else {
            Swal.fire("เกิดข้อผิดพลาด", data.error || "", "error");
          }
        } catch (error) {
          console.error("Error logging dislike:", error);
          Swal.fire("เกิดข้อผิดพลาด", "", "error");
        }
      }
    }
  };

  // ===============================
  // Debug Logging
  // ===============================
  useEffect(() => {
    if (userProfileData) {
      // console.log("User Profile Data:", userProfileData);
      // console.log("Group ID:", userProfileData.groupID);
      // console.log("Consequent (Thai):", userProfileData.consequent);
      // console.log("Category ID (from API):", catID);
      // console.log("Algorithm Books:", algoBooks);
      // console.log("Book Details:", bookDetails);
    }
  }, [userProfileData, catID, algoBooks, bookDetails]);

  // ===============================
  // Render UI
  // ===============================
  return (
    <>
      {/* Title Section */}
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-800">
          Algorithm Book Recommendations
        </h2>
  
        {algoError ? (
          <div className="flex flex-col items-center justify-center text-red-600">
            <FaExclamationCircle size={40} />
            <p className="mt-4 text-lg font-semibold">{algoError}</p>
          </div>
        ) : (
          /* แสดงผล grid: 2 คอลัมน์บน Mobile, 5 คอลัมน์บน Desktop */
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {sortedCombinedBooks.map((book, index) => (
              <div
                key={book.rc_bo_pid}
                className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden 
                           hover:shadow-lg hover:scale-[1.02] transform transition-all duration-300 cursor-pointer p-2 md:p-4"
                onClick={() => openModal(book, "full")}
              >
                {/* วงกลมแสดงอันดับ */}
                <div className="absolute top-2 left-2 w-6 h-6 md:w-7 md:h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs md:text-sm font-bold">
                  {index + 1}
                </div>
  
                {/* รูปภาพหนังสือ: object-contain เพื่อให้เห็นภาพทั้งหมด */}
                <div className="w-full h-36 md:h-44 overflow-hidden rounded">
                  <img
                    src={book.rc_bo_des_img || "/placeholder.jpg"}
                    alt={book.rc_bo_title}
                    className="w-full h-full object-contain"
                  />
                </div>
  
                {/* ชื่อหนังสือ (ปรับฟอนต์เล็กลงบน Mobile) */}
                <div className="mt-2">
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 line-clamp-2">
                    {book.rc_bo_title}
                  </h3>
                </div>
  
                {/* Icon Actions */}
                <div className="absolute top-2 right-2 flex flex-col space-y-1">
                  <button
                    onClick={(e) => toggleFavorite(e, book.rc_bo_pid)}
                    className="p-1 bg-gray-100 rounded-full transition-colors hover:bg-red-200"
                  >
                    <FaHeart
                      size={16}
                      className={
                        favorites.includes(book.rc_bo_pid)
                          ? "text-red-500"
                          : "text-gray-400"
                      }
                    />
                  </button>
                  <button
                    onClick={(e) => toggleDislike(e, book.rc_bo_pid)}
                    className="p-1 bg-gray-100 rounded-full transition-colors hover:bg-blue-200"
                  >
                    <FaThumbsDown
                      size={16}
                      className={
                        dislikes.includes(book.rc_bo_pid)
                          ? "text-blue-500"
                          : "text-gray-400"
                      }
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const infoData = {
                        rating: book.rating,
                        weight: book.weight,
                        probability: book.probability,
                      };
                      openModal(infoData, "info");
                    }}
                    className="p-1 bg-gray-100 rounded-full transition-colors hover:bg-blue-200"
                  >
                    <FaInfoCircle size={16} className="text-blue-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  
      {/* Modal Popup */}
      <AnimatePresence>
        {isModalOpen && selectedBook && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              /* 
                 เพิ่ม text-xs sm:text-sm md:text-base ที่ container นี้
                 เพื่อให้ฟอนต์เล็กลงบน Mobile และขยายเมื่อจอใหญ่ขึ้น
                 ใส่ max-h-screen + overflow-y-auto เพื่อแก้ปัญหาล้นจอ
              */
              className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative 
                         max-h-screen overflow-y-auto
                         text-xs sm:text-sm md:text-base"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
              {modalType === "info" ? (
                <div className="flex flex-col items-center text-black">
                  <h2 className="text-xl font-bold mb-4">สรุปข้อมูล</h2>
                  <div className="flex items-center space-x-2 mb-2">
                    <FaStar className="text-yellow-500" size={24} />
                    <span className="font-semibold">Rating:</span>
                    <span>{selectedBook.rating}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <FaBalanceScale className="text-green-500" size={24} />
                    <span className="font-semibold">Weight:</span>
                    <span>{selectedBook.weight}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaPercentage className="text-purple-500" size={24} />
                    <span className="font-semibold">Probability:</span>
                    <span>
                      {selectedBook.probability
                        ? (selectedBook.probability * 100).toFixed(2) + "%"
                        : "N/A"}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col md:flex-row bg-white rounded shadow p-4 mb-6">
                    <div className="flex-shrink-0">
                      <img
                        src={selectedBook.rc_bo_des_img || "/placeholder.jpg"}
                        alt={selectedBook.rc_bo_title}
                        className="w-36 h-auto rounded"
                      />
                    </div>
                    <div className=" md:flex-1 text-gray-800 md:pl-6 mt-4 md:mt-0">
                      <h3 className="md:text-sm lg:text-xl font-semibold mb-2">
                        {selectedBook.rc_bo_title || "ไม่ระบุชื่อเรื่อง"}
                      </h3>
                      <p className="mb-1">
                        <strong>ผู้แต่ง/ผู้ร่วมแต่ง:</strong>{" "}
                        {selectedBook.rc_bo_des_author_name || "ไม่ระบุ"}
                      </p>
                      <p className="mb-1">
                        <strong>สถานที่เก็บหนังสือ:</strong>{" "}
                        {selectedBook.rc_bo_des_location || "ไม่ระบุ"}
                      </p>
                      <p className="mb-1">
                        <strong>เลขเรียก:</strong>{" "}
                        {selectedBook.rc_bo_call_no || "ไม่ระบุ"}
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-gray-300">
                    {/* 
                        ใช้ flex-wrap เพื่อให้ Tab ตัดบรรทัดหากจอเล็ก
                        gap-2 แทน space-x-4 
                    */}
                    <ul className="flex flex-wrap gap-2 bg-white rounded">
                      {["Card", "Item", "MARC", "DublinCore", "Review"].map(
                        (tab) => (
                          <li
                            key={tab}
                            className={`cursor-pointer py-2 px-3 border-b-2 
                              ${
                                activeTab === tab
                                  ? "text-green-700 border-green-700 font-semibold"
                                  : "border-transparent text-gray-700 hover:text-gray-900"
                              }`}
                            onClick={() => setActiveTab(tab)}
                          >
                            {tab}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  <div className="bg-white rounded shadow mt-4">
                    {activeTab === "Card" && selectedBook && (
                      <div className="p-4 text-gray-800">
                        <h3 className="font-semibold mb-2">รายการข้อมูล (Card)</h3>
                        <table className="min-w-full border text-sm">
                          <thead>
                            <tr className="bg-gray-100 text-gray-600 uppercase">
                              <th className="py-2 px-4 border-b text-left w-1/3">
                                Tag
                              </th>
                              <th className="py-2 px-4 border-b text-left">
                                Data
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { tag: "เลขเรียก", data: selectedBook.rc_bo_call_no || "ไม่ระบุ" },
                              { tag: "ชื่อเรื่อง", data: selectedBook.rc_bo_title || "ไม่ระบุ" },
                              { tag: "สถานที่เก็บ", data: selectedBook.rc_bo_des_location || "ไม่ระบุ" },
                              { tag: "ผู้แต่งร่วม", data: selectedBook.rc_bo_des_author_name || "ไม่ระบุ" },
                            ].map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b text-gray-800">
                                  {item.tag}
                                </td>
                                <td className="py-2 px-4 border-b text-gray-800">
                                  {item.data}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );  
};

export default BookRecommendations;
