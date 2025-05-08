// app/dashboard/user/BookSearch.js
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { FiBook } from 'react-icons/fi';

const BookSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // ช่วยแปลง ISO string เป็นเวลาไทย (Asia/Bangkok + ปฏิทินไทย)
  function formatThaiDateTime(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',       // แสดงปี พ.ศ.
      month: '2-digit',      // เดือนตัวเลข 2 หลัก
      day: '2-digit',        // วันตัวเลข 2 หลัก
      hour: '2-digit',       // ชั่วโมง 2 หลัก
      minute: '2-digit'      // นาที 2 หลัก
    });
  }

  // เมื่อ query เปลี่ยน ให้ดีเลย์ 500ms แล้วค่อย fetch
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bookSearch?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('ไม่สามารถค้นหาหนังสือได้');
        const { books } = await res.json();
        setResults(books);
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // เมื่อคลิกการ์ด ให้ยิง SweetAlert2 modal
  const handleCardClick = (book) => {
    const {
      rc_bo_title,
      rc_bo_des_img,
      rc_bo_des_author_name,
      rc_bo_des_public_year,
      rc_bo_des_collection_name,
      rc_bo_des_mattype_name,
      rc_bo_des_lang,
      rc_bo_des_location,
      rc_bo_des_entry_date,
      rc_bo_des_act_date,
    } = book;

    Swal.fire({
      title: rc_bo_title,
      html: `
        ${
          rc_bo_des_img
            ? `<img src="${rc_bo_des_img}" class="w-full h-40 object-cover mb-4 rounded" />`
            : `<div class="h-40 w-full flex items-center justify-center bg-gray-200 mb-4 rounded text-gray-400 text-5xl">
                📚
              </div>`
        }
        <table class="text-left w-full">
          <tr><th class="pr-2">ผู้แต่ง:</th><td>${rc_bo_des_author_name}</td></tr>
          <tr><th class="pr-2">ปีพิมพ์:</th><td>${rc_bo_des_public_year}</td></tr>
          <tr><th class="pr-2">ชุดสะสม:</th><td>${rc_bo_des_collection_name}</td></tr>
          <tr><th class="pr-2">ประเภทหนังสือ:</th><td>${rc_bo_des_mattype_name}</td></tr>
          <tr><th class="pr-2">ภาษา:</th><td>${rc_bo_des_lang}</td></tr>
          <tr><th class="pr-2">ตำแหน่ง:</th><td>${rc_bo_des_location}</td></tr>
          <tr><th class="pr-2">วันที่เพิ่ม:</th><td>${formatThaiDateTime(rc_bo_des_entry_date)}</td></tr>
          <tr><th class="pr-2">วันที่ใช้งานล่าสุด:</th><td>${formatThaiDateTime(rc_bo_des_act_date)}</td></tr>
        </table>
      `,
      width: 600,
      showCloseButton: true,
      confirmButtonText: 'ปิด',
    });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">ค้นหาหนังสือ</h2>

      <motion.input
        type="text"
        placeholder="พิมพ์ชื่อหนังสือ..."
        className="w-full mb-6 p-2 border rounded"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        whileFocus={{ scale: 1.02 }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((book) => (
          <motion.div
            key={book.rc_bo_pid}
            className="bg-white rounded-lg shadow p-4 cursor-pointer flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
            onClick={() => handleCardClick(book)}
          >
            {book.rc_bo_des_img ? (
              <img
                src={book.rc_bo_des_img}
                alt={book.rc_bo_title}
                className="h-40 w-full object-cover mb-2 rounded"
              />
            ) : (
              <div className="h-40 w-full flex items-center justify-center bg-gray-200 mb-2 rounded">
                <FiBook size={48} className="text-gray-400" />
              </div>
            )}
            <h3 className="text-lg font-medium text-gray-800 text-center">
              {book.rc_bo_title}
            </h3>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BookSearch;
