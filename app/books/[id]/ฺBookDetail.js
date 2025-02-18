'use client';

import React, { useState } from 'react';
import { FaUserPlus, FaSignInAlt, FaBars, FaTimes } from 'react-icons/fa';
import LoginModal from '../../components/LoginModal';

export default function BookDetail({ book }) {

  // Parameter สำหรับ Login Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1); // เก็บค่า step สำหรับ Modal

  const handleOpenModalWithStep = (targetStep) => {
    setStep(targetStep); // กำหนด Step ที่ต้องการ
    setIsModalOpen(true); // เปิด Modal
  };

  const [activeTab, setActiveTab] = useState('Card');

  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      {/* Navbar */}
          <nav className="shadow-md bg-white">
            {/* Main Navbar */}
            <div className="flex justify-between items-center px-8 py-4">
              {/* Left Section: Logo and Home Link */}
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-4">
                  {/* Logo */}
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    {/* <span className="text-white font-bold">LOGO</span> */}
                    <img 
                      src='/images/logo.webp'
                      alt='logo'
                      className='h-full w-full object-cover rounded-full'
                    />
                  </div>
                  <a href="/">
                    <h1 className="text-xl font-semibold text-gray-800">
                      UBU Library
                    </h1>
                  </a>
                  <a
                    href="/"
                    className="text-lg font-medium text-gray-700 hover:text-blue-500 hidden md:inline-block"
                  >
                    หน้าแรก
                  </a>
                  
      
                </div>
              </div>
      
              {/* Right Section: Sign Up and Login Buttons */}
              <div className="hidden md:flex space-x-4">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2"
                  onClick={() => handleOpenModalWithStep(6)}
                >
                  <span>Sign Up</span>
                  <FaUserPlus />
                </button>
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
                  onClick={() => handleOpenModalWithStep(1)}
                >
                  <span>Login</span>
                  <FaSignInAlt />
                </button>
              </div>
      
              {/* Hamburger Button */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden p-2 text-gray-700 hover:text-blue-500 focus:outline-none"
              >
                <FaBars size={24} />
              </button>
            </div>
      
            {/* Overlay */}
            {isMenuOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
            )}
      
            {/* Sliding Side Menu */}
            <div
              className={`fixed top-0 left-0 h-full bg-gray-900 text-white z-50 transform ${
                isMenuOpen ? "translate-x-0" : "-translate-x-full"
              } transition-transform duration-300 ease-in-out`}
              style={{ width: "80%" }}
            >
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-4 text-white focus:outline-none"
              >
                <FaTimes size={24} />
              </button>
      
              <div className="flex flex-col items-center mt-8 space-y-6">
                {/* Logo and Library Name */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
                    {/* <span className="text-white font-bold text-lg">LOGO</span> */}
                    <img 
                      src='/images/logo.webp'
                      alt='Logo'
                      className='h-full w-full object-cover rounded-full'
                    />
                  </div>
                  <h1 className="text-xl font-semibold text-white">UBU Library</h1>
                </div>
      
                {/* Home Link */}
                <a
                  href="/"
                  className="text-lg text-gray-200 hover:text-white md:hidden"
                  onClick={() => setIsMenuOpen(false)}
                >
                  หน้าแรก
                </a>
              </div>
      
              {/* Bottom Buttons */}
              <div className="absolute bottom-8 left-0 w-full flex flex-col items-center space-y-4">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2"
                  onClick={() => handleOpenModalWithStep(6)}
                >
                  <span>Sign Up</span>
                  <FaUserPlus />
                </button>
                
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
                  onClick={() => handleOpenModalWithStep(1)}
                >
                  <span>Login</span>
                  <FaSignInAlt />
                </button>
              </div>
            </div>
          </nav>

        {/* ส่วนข้อมูลหลักหนังสือ (ปก + ข้อมูล) */}
        <div className="max-w-5xl mx-auto py-6 px-4 my-8">
          {/* <h2 className="text-2xl font-bold mb-4 text-gray-800">
            รายละเอียดทรัพยากร
          </h2> */}
          <div className='flex flex-row md:flex-row justify-between items-center mx-1 md:mx-1 text-white p-3'>
            <div>
              <p className="text-2xl md:text-2xl font-semibold text-gray-800">รายละเอียดทรัพยากร</p>
            </div>
            <div className='text-black mt-2 md:mt-0'>
              <a href="/" className="text-purple-600 no-underline hover:text-gray-300">หน้าแรก </a>
              <span className="mx-2">/</span>
              <span className="underline">รายละเอียดทรัพยากร</span>
            </div>
          </div>
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
              <ul className="flex space-x-4 bg-white rounded">
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

      {/* ========= ส่วนสำหรับการ Login */}
      <LoginModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        step={step}
        setStep={setStep}
      />

      <footer className="mt-24 py-8 bg-gray-800 text-white text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} UBU Library Recommendation System. All rights reserved.</p>
      </footer>

    </div>
  );
}
