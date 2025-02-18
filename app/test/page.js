"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import {
  FaBook,
  FaStar,
  FaBalanceScale,
  FaPercentage,
  FaExclamationCircle,
  FaHeart,
  FaThumbsDown,
  FaInfoCircle,
} from "react-icons/fa";

// ฟังก์ชันแปลงเวลาให้เป็น "YYYY-MM-DD HH:mm:ss" ตาม timezone Asia/Bangkok
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

export default function HomePage() {
  // State สำหรับฟอร์มข้อมูล
  const [userId, setUserId] = useState("");
  const [groupID, setGroupID] = useState("");
  const [facID, setFacID] = useState("");
  const [depID, setDepID] = useState("");
  const [catID, setCatID] = useState("");
  const [favID1, setFavID1] = useState("");
  const [favID2, setFavID2] = useState("");
  const [favID3, setFavID3] = useState("");

  // State สำหรับหนังสือแนะนำและรายละเอียด
  const [books, setBooks] = useState([]); // ตัวอย่าง 10 เล่มที่ถูกนำมาแนะนำ
  const [totalCount, setTotalCount] = useState(0); // จำนวนหนังสือทั้งหมดใน DB ที่ตรงเงื่อนไข
  const [bookDetails, setBookDetails] = useState([]);

  // State สำหรับ Modal
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("full");

  // State สำหรับรายการโปรด
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [favorites, setFavorites] = useState([]); // เก็บเฉพาะ pid ของหนังสือที่ถูก favorite

  // ฟังก์ชัน query หนังสือแนะนำ (10 เล่ม) จาก API
  const fetchRecommendations = async () => {
    const params = new URLSearchParams({
      groupID,
      facID,
      depID,
      catID,
      favID_1: favID1,
      favID_2: favID2,
      favID_3: favID3,
    });
    try {
      const res = await fetch(`/api/recommendation/get-books?${params.toString()}`);
      if (!res.ok) throw new Error("Error fetching recommendations");
      const data = await res.json();
      setBooks(data);
    } catch (error) {
      console.error(error);
    }
  };

  // ฟังก์ชัน query จำนวนหนังสือทั้งหมดที่ตรงเงื่อนไขจาก API
  const fetchTotalCount = async () => {
    const params = new URLSearchParams({
      groupID,
      facID,
      depID,
      catID,
      favID_1: favID1,
      favID_2: favID2,
      favID_3: favID3,
    });
    try {
      const res = await fetch(`/api/recommendation/get-books-count?${params.toString()}`);
      if (!res.ok) throw new Error("Error fetching total count");
      const { total } = await res.json();
      setTotalCount(total);
    } catch (error) {
      console.error("Error fetching total count:", error);
    }
  };

  // ฟังก์ชัน query รายการโปรดสำหรับ User ID
  const fetchFavoriteBooks = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/log/favorite?userId=${userId}`);
      if (!res.ok) throw new Error("Error fetching favorite books");
      const favoritesData = await res.json();
      setFavoriteBooks(favoritesData);
      setFavorites(favoritesData.map((book) => book.fbookID));
    } catch (error) {
      console.error("Error fetching favorite books:", error);
    }
  };

  // เมื่อ submit ฟอร์ม ให้ query หนังสือแนะนำ, total count และรายการโปรด (ถ้ามี userId)
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchRecommendations();
    await fetchTotalCount();
    if (userId) await fetchFavoriteBooks();
  };

  // Query รายละเอียดหนังสือจาก API เมื่อ state books เปลี่ยนแปลง
  useEffect(() => {
    async function fetchDetails() {
      if (books.length === 0) return;
      const ids = books.map((book) => book.pid).join(",");
      try {
        const res = await fetch(`/api/recommendation/get-book-details?ids=${ids}`);
        if (!res.ok) throw new Error("Error fetching book details");
        const details = await res.json();
        setBookDetails(details);
      } catch (error) {
        console.error(error);
      }
    }
    fetchDetails();
  }, [books]);

  // Sorting หนังสือแนะนำ (อันดับที่ดีที่สุดก่อน)
  const sortedBooks = [...books].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.weight !== a.weight) return b.weight - a.weight;
    return b.probability - a.probability;
  });

  // ฟังก์ชัน re-query เพื่อเติมเต็มหนังสือแนะนำใหม่
  const requeryRecommendations = async () => {
    await fetchRecommendations();
    await fetchTotalCount();
  };

  // ฟังก์ชัน log click เมื่อดูรายละเอียดหนังสือ
  const logClick = async (pid, rating) => {
    const clickDate = getCurrentBangkokTime();
    const data = {
      rc_log_cli_click: 1,
      rc_log_cli_date_click: clickDate,
      rc_log_ac_pid: userId,
      rc_log_bo_pid: pid,
      rc_log_bo_rating: rating,
    };
    try {
      const res = await fetch("/api/log/clickstream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error logging click");
      console.log("Click log success");
    } catch (error) {
      console.error("Error logging click:", error);
    }
  };

  // ฟังก์ชัน log favorite (เพิ่มเข้ารายการโปรด)
  const logFavorite = async (pid, rating) => {
    const favDate = getCurrentBangkokTime();
    const data = {
      rc_log_fav_book: 1,
      rc_log_fav_date: favDate,
      rc_log_fav_ac_pid: userId,
      rc_log_fav_bo_pid: pid,
      rc_log_fav_bo_rating: rating,
    };
    try {
      const res = await fetch("/api/log/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error logging favorite");
      console.log("Favorite log success");
    } catch (error) {
      console.error("Error logging favorite:", error);
    }
  };

  // ฟังก์ชันลบ favorite
  const removeFavorite = async (pid) => {
    try {
      const res = await fetch("/api/log/favorite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rc_log_fav_ac_pid: userId,
          rc_log_fav_bo_pid: pid,
        }),
      });
      const data = await res.json();
      return data; // คาดว่า { success: true }
    } catch (error) {
      console.error("Error removing favorite:", error);
      return { success: false };
    }
  };

  // เมื่อคลิกที่การ์ด (นอกเหนือจากไอคอน info) ให้แสดง modal แบบ full detail และ log click
  const handleCardClick = async (pid) => {
    const rec = books.find((b) => b.pid === pid);
    await logClick(pid, rec?.rating);
    const detail = bookDetails.find((d) => d.rc_bo_pid === pid);
    const combined = { ...detail, rating: rec?.rating, weight: rec?.weight, probability: rec?.probability };
    setSelectedBook(combined);
    setModalType("full");
    setIsModalOpen(true);
  };

  // เมื่อคลิกไอคอน info ให้แสดง modal สรุป (Rating, Weight, Probability)
  const handleInfoClick = (e, pid) => {
    e.stopPropagation();
    const rec = books.find((b) => b.pid === pid);
    setSelectedBook({ rating: rec?.rating, weight: rec?.weight, probability: rec?.probability });
    setModalType("info");
    setIsModalOpen(true);
  };

  // ฟังก์ชัน toggle favorite สำหรับเพิ่มหรือลบหนังสือออกจากรายการโปรด
  const toggleFavorite = async (e, pid) => {
    e.stopPropagation();
    if (!userId) {
      Swal.fire({ title: "Warning", text: "กรุณากรอก User ID ก่อน", icon: "warning" });
      return;
    }
    if (!favorites.includes(pid)) {
      // เพิ่มหนังสือใน favorite
      const rec = books.find((b) => b.pid === pid);
      const detail = bookDetails.find((d) => d.rc_bo_pid === pid);
      const combined = { ...detail, rating: rec?.rating, weight: rec?.weight, probability: rec?.probability };
      const confirmAdd = await Swal.fire({
        title: "คุณต้องการเพิ่มหนังสือนี้ในรายการโปรดหรือไม่?",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
      });
      if (confirmAdd.isConfirmed) {
        await logFavorite(pid, rec?.rating);
        setFavoriteBooks((prev) => [...prev, combined]);
        setFavorites((prev) => [...prev, pid]);
        // ลบหนังสือออกจาก recommendations
        setBooks((prev) => prev.filter((b) => b.pid !== pid));
        Swal.fire({ title: "เพิ่มหนังสือเข้ารายการโปรดแล้ว", icon: "success" });
        await requeryRecommendations();
      }
    } else {
      // ลบหนังสือออกจาก favorite (ใน favorite list ให้ใช้ handleFavoriteRemove แยก)
      await handleFavoriteRemove(pid);
    }
  };

  // ฟังก์ชันสำหรับลบหนังสือออกจากรายการโปรด
  const handleFavoriteRemove = async (pid) => {
    const confirmRemove = await Swal.fire({
      title: "คุณต้องการลบหนังสือนี้ออกจากรายการโปรดหรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });
    if (confirmRemove.isConfirmed) {
      const response = await removeFavorite(pid);
      if (response.success) {
        setFavoriteBooks((prev) => prev.filter((book) => book.fbookID !== pid));
        setFavorites((prev) => prev.filter((id) => id !== pid));
        Swal.fire({ title: "ลบหนังสือออกจากรายการโปรดแล้ว", icon: "success" });
        await requeryRecommendations();
      } else {
        Swal.fire({ title: "เกิดข้อผิดพลาดในการลบ", icon: "error" });
      }
    }
  };

  // ฟังก์ชันปิด modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };

  // คำนวณข้อมูลสำหรับ Dashboard
  const totalRecommendations = books.length;
  const remainingCount = totalCount - totalRecommendations;

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-4xl">
        {/* Title */}
        <motion.h1
          className="text-4xl font-bold text-center mb-8 text-gray-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ระบบแนะนำหนัง
        </motion.h1>

        {/* Dashboard Section */}
        <div className="bg-white shadow rounded p-4 mb-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <p className="mb-2">
            จำนวนหนังสือที่ตรงเงื่อนไขในฐานข้อมูล:{" "}
            <strong>{totalCount}</strong>
          </p>
          <p className="mb-2">
            จำนวนหนังสือที่ถูกนำมาแนะนำ:{" "}
            <strong>{totalRecommendations}</strong>
          </p>
          <p>
            ยังมีหนังสือที่สามารถนำมาแนะนำได้อีก:{" "}
            <strong>{remainingCount > 0 ? remainingCount : 0}</strong>
          </p>
        </div>

        {/* Favorite List Section */}
        <div className="bg-white shadow rounded p-4 mb-6">
          <h2 className="text-2xl font-bold mb-4">รายการโปรด</h2>
          {favoriteBooks.length === 0 ? (
            <p className="text-gray-600">ยังไม่มีหนังสือในรายการโปรด</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favoriteBooks.map((book) => (
                <div
                  key={`fbook-${book.fbookID}`}
                  className="bg-white rounded shadow p-4 flex items-center space-x-4 relative"
                >
                  {book.rc_bo_des_img ? (
                    <img
                      src={book.rc_bo_des_img}
                      alt={book.rc_bo_title}
                      className="w-20 h-28 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-28 bg-gray-200 flex items-center justify-center">
                      <FaBook className="text-gray-400" size={30} />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">
                      {book.rc_bo_title || "ไม่มีชื่อหนังสือ"}
                    </h3>
                    <p className="text-gray-600">
                      Rating: {book.rc_log_fav_bo_rating || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(e, book.fbookID)}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    {/* ในรายการโปรด ไอคอนควรเป็นสีแดง */}
                    <FaHeart size={20} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="bg-white shadow-md rounded p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="กรอก User ID"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium">Group ID</label>
                <input
                  type="text"
                  value={groupID}
                  onChange={(e) => setGroupID(e.target.value)}
                  placeholder="กรอก Group ID"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Fac ID</label>
                <input
                  type="text"
                  value={facID}
                  onChange={(e) => setFacID(e.target.value)}
                  placeholder="กรอก Fac ID"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Dep ID</label>
                <input
                  type="text"
                  value={depID}
                  onChange={(e) => setDepID(e.target.value)}
                  placeholder="กรอก Dep ID"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Cat ID</label>
                <input
                  type="text"
                  value={catID}
                  onChange={(e) => setCatID(e.target.value)}
                  placeholder="กรอก Cat ID"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Fav ID 1</label>
                <input
                  type="text"
                  value={favID1}
                  onChange={(e) => setFavID1(e.target.value)}
                  placeholder="กรอก Fav ID 1"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Fav ID 2</label>
                <input
                  type="text"
                  value={favID2}
                  onChange={(e) => setFavID2(e.target.value)}
                  placeholder="กรอก Fav ID 2"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Fav ID 3</label>
                <input
                  type="text"
                  value={favID3}
                  onChange={(e) => setFavID3(e.target.value)}
                  placeholder="กรอก Fav ID 3"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition-colors"
            >
              ค้นหาหนังสือแนะนำ
            </button>
          </form>
        </div>

        {/* Recommended Books Section */}
        <section className="mb-10">
          <motion.h2
            className="text-2xl font-semibold text-gray-800 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            รายการหนังสือที่แนะนำ:
          </motion.h2>
          <AnimatePresence>
            {books.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center space-y-4"
              >
                <FaExclamationCircle className="text-gray-400" size={40} />
                <p className="text-gray-600">
                  ยังไม่มีหนังสือแนะนำ กรุณากรอกข้อมูลและกดค้นหา
                </p>
              </motion.div>
            ) : (
              <motion.ul
                key="list"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {sortedBooks.map((book, index) => {
                  const detail = bookDetails.find((d) => d.rc_bo_pid === book.pid);
                  return (
                    <motion.li
                      key={book.pid}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      className="bg-white rounded shadow relative overflow-hidden cursor-pointer"
                      onClick={() => handleCardClick(book.pid)}
                    >
                      {/* Badge ลำดับแนะนำ */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      {/* Container สำหรับไอคอน favorite และ info */}
                      <div className="absolute top-2 right-2 z-10 flex flex-col items-end space-y-2">
                        <button
                          onClick={(e) => toggleFavorite(e, book.pid)}
                          className="p-2 rounded-full shadow hover:bg-gray-100"
                        >
                          <FaHeart
                            size={20}
                            className={`${
                              favorites.includes(book.pid)
                                ? "text-red-500"
                                : "text-gray-400"
                            }`}
                          />
                        </button>
                        <button
                          onClick={(e) => handleInfoClick(e, book.pid)}
                          className="p-2 rounded-full shadow hover:bg-blue-100"
                        >
                          <FaInfoCircle size={20} className="text-blue-500" />
                        </button>
                      </div>
                      <div className="relative">
                        {detail && detail.rc_bo_des_img ? (
                          <img
                            src={detail.rc_bo_des_img}
                            alt={detail.rc_bo_title}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <FaBook className="text-gray-400" size={40} />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                          {detail ? detail.rc_bo_title : "ไม่มีชื่อหนังสือ"}
                        </h3>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              Swal.fire({
                                title: "คุณไม่ชอบหนังสือนี้",
                                icon: "info",
                              });
                              setBooks((prev) =>
                                prev.filter((b) => b.pid !== book.pid)
                              );
                            }}
                            className="text-gray-500 hover:text-gray-600"
                          >
                            <FaThumbsDown size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </section>
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
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3">
                    {selectedBook.rc_bo_des_img ? (
                      <img
                        src={selectedBook.rc_bo_des_img}
                        alt={selectedBook.rc_bo_title}
                        className="w-full h-auto object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <FaBook className="text-gray-400" size={40} />
                      </div>
                    )}
                  </div>
                  <div className="md:w-2/3 md:pl-6 mt-4 md:mt-0">
                    <h2 className="text-2xl font-bold mb-2">
                      {selectedBook.rc_bo_title}
                    </h2>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Barcode:</span>{" "}
                      {selectedBook.rc_bo_barcode}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Bib ID:</span>{" "}
                      {selectedBook.rc_bo_bib_id}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Item ID:</span>{" "}
                      {selectedBook.rc_bo_item_id}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Call No:</span>{" "}
                      {selectedBook.rc_bo_call_no}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Public Year:</span>{" "}
                      {selectedBook.rc_bo_des_public_year}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Collection:</span>{" "}
                      {selectedBook.rc_bo_des_collection_name}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Author:</span>{" "}
                      {selectedBook.rc_bo_des_author_name}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Material Type:</span>{" "}
                      {selectedBook.rc_bo_des_mattype_name}
                    </p>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Location:</span>{" "}
                      {selectedBook.rc_bo_des_location}
                    </p>
                    <div className="mt-4">
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
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
