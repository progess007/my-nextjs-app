'use client';

import React, { useState } from 'react';
import { FaUserPlus, FaSignInAlt } from 'react-icons/fa';

export default function BookDetail({ book }) {
  const [activeTab, setActiveTab] = useState('Card');

  const bookCover =
    'https://via.placeholder.com/240x340.png?text=Book+Cover';

  const cardData = [
    { tag: 'เลขเรียก', data: book.rc_bo_call_no || 'ไม่ระบุ' },
    { tag: 'ชื่อเรื่อง', data: book.rc_bo_title || 'ไม่ระบุ' },
    { tag: 'สถานที่เก็บหนังสือ', data: book.rc_bo_des_location || 'ไม่ระบุ' },
    { tag: 'รูปเล่ม', data: 'ไม่ระบุ' },
    { tag: 'หัวเรื่อง', data: 'ไมระบุ' },
    { tag: 'หัวเรื่อง', data: 'ไม่ระบุ' },
    { tag: 'หัวเรื่อง', data: 'ไม่ระบุ' },
    { tag: 'ผู้แต่งร่วม', data: book.rc_bo_des_author_name || 'ไม่ระบุ' },
  ];

  function renderTabContent() {
    switch (activeTab) {
      case 'Item':
        return (
          <div className="p-4 text-gray-800">
            <h3 className="font-semibold mb-2">รายการ Item</h3>
            <p>รายละเอียด Item ทั้งหมด... (ตัวอย่าง)</p>
          </div>
        );
      case 'Card':
        return (
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
                {cardData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {/* เปลี่ยนสีฟอนต์ของตารางเป็นเข้มขึ้น */}
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
        );
      case 'MARC':
        return (
          <div className="p-4 text-gray-800">
            <h3 className="font-semibold mb-2">MARC</h3>
            <p>ข้อมูล MARC (ตัวอย่าง)...</p>
          </div>
        );
      case 'DublinCore':
        return (
          <div className="p-4 text-gray-800">
            <h3 className="font-semibold mb-2">Dublin Core</h3>
            <p>ข้อมูล Dublin Core (ตัวอย่าง)...</p>
          </div>
        );
      case 'Review':
        return (
          <div className="p-4 text-gray-800">
            <h3 className="font-semibold mb-2">Review</h3>
            <p>ส่วนสำหรับรีวิวหนังสือ... (ตัวอย่าง)</p>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 shadow-md bg-white">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">LOGO</span>
          </div>
          <a href='/'>
            <h1 className="text-xl font-semibold text-gray-800">
                UBU Library
            </h1>
          </a>
          
        </div>
        <div className="flex space-x-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2"
          >
            <span>Sign Up</span>
            <FaUserPlus />
          </button>
          <button
            onClick={() => alert('Show Login Modal (ตัวอย่าง)')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
          >
            <span>Login</span>
            <FaSignInAlt />
          </button>
        </div>
      </nav>

        {/* ส่วนข้อมูลหลักหนังสือ (ปก + ข้อมูล) */}
        <div className="max-w-5xl mx-auto py-6 px-4">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            รายละเอียดทรัพยากร
          </h2>
          <div
            className="flex flex-col md:flex-row bg-white rounded shadow p-4 
                      space-y-4 md:space-y-0 md:space-x-60"
          >
            {/* ปกหนังสือ */}
            <div className="flex-shrink-0">
              <img
                src={bookCover}
                alt="book cover"
                className="w-48 h-auto rounded"
              />
            </div>
            {/* ข้อมูลหนังสือ */}
            <div className="md:flex-1 text-gray-800">
              <h3 className="text-xl font-semibold mb-2">
                {book.rc_bo_title || 'ไม่ระบุชื่อเรื่อง'}
              </h3>
              <p className="mb-1">
                <strong>ผู้แต่ง/ผู้ร่วมแต่ง:</strong>{' '}
                {book.rc_bo_des_author_name || 'ไม่ระบุ'}
              </p>
              <p className="mb-1">
                <strong>ประเภทแห่งเอกสาร:</strong> Book (ตัวอย่าง)
              </p>
              <p>
                ข้อมูลอื่น ๆ เกี่ยวกับหนังสือสั้น ๆ หรือคำโปรย...
              </p>
            </div>
          </div>

          {/* แถบเมนูย่อย (Tab) */}
          <div className="mt-6">
            <div className="border-b border-gray-300">
              <ul className="flex space-x-4">
                {['Item', 'Card', 'MARC', 'DublinCore', 'Review'].map(
                  (tab) => (
                    <li
                      key={tab}
                      className={`cursor-pointer py-2 px-4 ${
                        activeTab === tab
                          ? 'text-green-700 border-b-2 border-green-700 font-semibold'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* ส่วนเนื้อหาใน Tab */}
            <div className="bg-white rounded shadow mt-4">
              {renderTabContent()}
            </div>
          </div>
        </div>

      <footer className="mt-16 py-8 bg-gray-800 text-white text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} UBU Library Recommendation System. All rights reserved.</p>
      </footer>

    </div>
  );
}
