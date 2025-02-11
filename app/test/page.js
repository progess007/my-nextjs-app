// app/page.js
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBook,
  FaStar,
  FaBalanceScale,
  FaPercentage,
  FaExclamationCircle,
} from "react-icons/fa";

export default function HomePage() {
  const [groupID, setGroupID] = useState("");
  const [facID, setFacID] = useState("");
  const [depID, setDepID] = useState("");
  const [catID, setCatID] = useState("");
  const [favID1, setFavID1] = useState("");
  const [favID2, setFavID2] = useState("");
  const [favID3, setFavID3] = useState("");
  const [books, setBooks] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      if (!res.ok) {
        throw new Error("Error fetching recommendations");
      }
      const data = await res.json();
      setBooks(data);
    } catch (error) {
      console.error(error);
    }
  };

  // ทำการ sort หนังสือโดยใช้ rating, weight และ probability
  const sortedBooks = [...books].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.weight !== a.weight) return b.weight - a.weight;
    return b.probability - a.probability;
  });

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 text-black">
      <div className="w-full max-w-2xl">
        <motion.h1
          className="text-4xl font-bold text-center mb-8 text-gray-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ระบบแนะนำหนัง
        </motion.h1>

        <div className="bg-white shadow-md rounded p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition-colors"
            >
              ค้นหาหนังสือแนะนำ
            </button>
          </form>
        </div>

        <section className="mt-10">
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
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.2,
                    },
                  },
                }}
                className="space-y-4"
              >
                {sortedBooks.map((book, index) => (
                  <motion.li
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className="bg-white rounded shadow p-4 flex items-center space-x-4 relative"
                  >
                    {/* ไอคอนวงกลมแสดงลำดับการแนะนำ */}
                    <div className="absolute -top-3 -left-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                    </div>

                    <FaBook className="text-blue-500" size={24} />
                    <div className="flex flex-col space-y-1 ml-8">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">PID:</span>
                        <span>{book.pid}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaStar className="text-yellow-500" size={20} />
                        <span className="font-semibold">Rating:</span>
                        <span>{book.rating}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaBalanceScale className="text-green-500" size={20} />
                        <span className="font-semibold">Weight:</span>
                        <span>{book.weight}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaPercentage className="text-purple-500" size={20} />
                        <span className="font-semibold">Probability:</span>
                        <span>{(book.probability * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
