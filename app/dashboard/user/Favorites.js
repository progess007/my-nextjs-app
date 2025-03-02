"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaTrashAlt, FaInfoCircle, FaExclamationCircle, FaStar, FaBalanceScale, FaPercentage } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

// Helper: แปลงเวลาปัจจุบันเป็น "YYYY-MM-DD HH:mm:ss" ตาม Asia/Bangkok
const getCurrentBangkokTime = () => {
  const now = new Date();
  const bangkokTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const year = bangkokTime.getFullYear();
  const month = String(bangkokTime.getMonth() + 1).padStart(2, "0");
  const day = String(bangkokTime.getDate()).padStart(2, "0");
  const hours = String(bangkokTime.getHours()).padStart(2, "0");
  const minutes = String(bangkokTime.getMinutes()).padStart(2, "0");
  const seconds = String(bangkokTime.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const Favorites = ({ userID }) => {
  // ไม่มีการกรอก userID เพราะรับมาจาก prop
  const [favorites, setFavorites] = useState([]); // รายการ favorites จาก API
  const [bookDetails, setBookDetails] = useState([]); // รายละเอียดหนังสือจาก API
  const [errorMsg, setErrorMsg] = useState(null);

  // State สำหรับ Modal
  const [selectedBook, setSelectedBook] = useState(null);
  const [modalType, setModalType] = useState("full"); // "full" หรือ "info"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Card");

  // ===============================
  // Query รายการโปรดจาก API /api/log/favorite?userId=...
  // ===============================
  const fetchFavorites = useCallback(async () => {
    if (!userID) return;
    try {
      const res = await fetch(`/api/log/favorite?userId=${userID}`);
      if (!res.ok) throw new Error("Error fetching favorites");
      const data = await res.json();
      setFavorites(data);
      setErrorMsg(null);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setErrorMsg("ไม่สามารถดึงข้อมูลรายการโปรดได้");
      setFavorites([]);
    }
  }, [userID]);

  useEffect(() => {
    if (userID) {
      fetchFavorites();
    }
  }, [userID, fetchFavorites]);

  // ===============================
  // Query รายละเอียดหนังสือ favorites จาก API /api/recommendation/get-book-details?ids=...
  // ===============================
  const fetchFavoriteBookDetails = useCallback(async () => {
    if (favorites.length === 0) return;
    const ids = favorites.map((fav) => fav.fbookID).join(",");
    try {
      const res = await fetch(`/api/recommendation/get-book-details?ids=${ids}`);
      if (!res.ok) throw new Error("Error fetching book details");
      const details = await res.json();
      setBookDetails(details);
    } catch (error) {
      console.error("Error fetching favorite book details:", error);
      setBookDetails([]);
    }
  }, [favorites]);

  useEffect(() => {
    fetchFavoriteBookDetails();
  }, [favorites, fetchFavoriteBookDetails]);

  // ===============================
  // Combine favorites และรายละเอียดหนังสือ (เพื่อรวม rating จาก favorites)
  // ===============================
  const combinedFavorites = useMemo(() => {
    return bookDetails.map((detail) => {
      const fav = favorites.find((f) => f.fbookID === detail.rc_bo_pid);
      // ใช้ค่า rating จาก favorites (rc_log_fav_bo_rating)
      return { ...detail, rating: fav ? fav.rc_log_fav_bo_rating : null };
    });
  }, [bookDetails, favorites]);

  // ===============================
  // ฟังก์ชัน logClick: บันทึก log เมื่อคลิกดูหนังสือ
  // ===============================
  const logClick = async (bo_pid, rating) => {
    if (!userID) return;
    const clickDate = getCurrentBangkokTime();
    const logData = {
      rc_log_cli_click: 1,
      rc_log_cli_date_click: clickDate,
      rc_log_ac_pid: userID,
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
    if (type === "full") {
      // เมื่อเปิด modal full detail ให้บันทึก log click
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
  // Action: ลบหนังสือออกจากรายการโปรด (ใช้ SweetAlert)
  // ===============================
  const removeFavorite = async (bookId) => {
    const result = await Swal.fire({
      title: "คุณต้องการลบหนังสือออกจากรายการโปรดหรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ใช่, ลบออก",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      try {
        const res = await fetch("/api/log/favorite", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rc_log_fav_ac_pid: userID,
            rc_log_fav_bo_pid: bookId,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          Swal.fire("ลบหนังสือออกจากรายการโปรดแล้ว", "", "success");
          fetchFavorites(); // รีเฟรช favorites
        } else {
          Swal.fire("เกิดข้อผิดพลาด", data.error || "", "error");
        }
      } catch (error) {
        console.error("Error removing favorite:", error);
        Swal.fire("เกิดข้อผิดพลาด", "", "error");
      }
    }
  };

  // ===============================
  // Debug Logging
  // ===============================
  useEffect(() => {
    console.log("User ID:", userID);
    console.log("Favorites:", favorites);
    console.log("Favorite Book Details:", bookDetails);
    console.log("Combined Favorites:", combinedFavorites);
  }, [userID, favorites, bookDetails, combinedFavorites]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        รายการโปรด
      </h1>

      {errorMsg && (
        <div className="flex items-center justify-center text-red-600 mb-4">
          <FaExclamationCircle size={24} className="mr-2" />
          <span>{errorMsg}</span>
        </div>
      )}

      {favorites.length === 0 ? (
        <p className="text-center text-gray-600">ยังไม่มีหนังสือในรายการโปรด</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {combinedFavorites.map((book, index) => (
            <div
              key={book.rc_bo_pid}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-4 relative cursor-pointer"
              onClick={() => openModal(book, "full")}
            >
              {/* วงกลมแสดงอันดับ */}
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {index + 1}
              </div>
              {/* รูปหนังสือ */}
              <div className="w-full h-48 overflow-hidden rounded">
                <img
                  src={book.rc_bo_des_img || "/placeholder.jpg"}
                  alt={book.rc_bo_title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* ชื่อหนังสือ */}
              <h3 className="mt-4 text-xl font-bold text-gray-800">
                {book.rc_bo_title}
              </h3>
              {/* Icon Actions */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // เปิด modal info: ส่งเฉพาะข้อมูล rating, weight, probability
                    const infoData = {
                      rating: book.rating,
                      weight: book.weight,
                      probability: book.probability,
                    };
                    openModal(infoData, "info");
                  }}
                  className="p-2 bg-gray-100 rounded-full transition-colors hover:bg-blue-200"
                >
                  <FaInfoCircle size={20} className="text-blue-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(book.rc_bo_pid);
                  }}
                  className="p-2 bg-gray-100 rounded-full transition-colors hover:bg-red-200"
                >
                  <FaTrashAlt size={20} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative"
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
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-4">สรุปข้อมูล</h2>
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
                        className="w-48 h-auto rounded"
                      />
                    </div>
                    <div className="md:flex-1 text-gray-800 md:pl-6">
                      <h3 className="text-xl font-semibold mb-2">
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
                    <ul className="flex space-x-4 bg-white rounded">
                      {["Card", "Item", "MARC", "DublinCore", "Review"].map((tab) => (
                        <li
                          key={tab}
                          className={`cursor-pointer py-2 px-4 ${
                            activeTab === tab
                              ? "text-green-700 border-b-2 border-green-700 font-semibold"
                              : "text-gray-700 hover:text-gray-900"
                          }`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded shadow mt-4">
                    {activeTab === "Card" && selectedBook && (
                      <div className="p-4 text-gray-800">
                        <h3 className="font-semibold mb-2">รายการข้อมูล (Card)</h3>
                        <table className="min-w-full border text-sm">
                          <thead>
                            <tr className="bg-gray-100 text-gray-600 uppercase">
                              <th className="py-2 px-4 border-b text-left w-1/3">Tag</th>
                              <th className="py-2 px-4 border-b text-left">Data</th>
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
                                <td className="py-2 px-4 border-b text-gray-800">{item.tag}</td>
                                <td className="py-2 px-4 border-b text-gray-800">{item.data}</td>
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
    </div>
  );
};

export default Favorites;
