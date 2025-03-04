'use client';
import { FaBars } from 'react-icons/fa';
import React from 'react';

const Header = React.memo(({ user, toggleSidebar }) => {
  return (
    <header className="bg-white shadow-md px-4 py-3 flex items-center justify-between sm:px-6">
      {/* ด้านซ้าย: ปุ่ม Hamburger + ช่อง Search */}
      <div className="flex items-center space-x-4">
        {/* ปุ่ม Hamburger: แสดงเฉพาะบน Mobile (< 640px) */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 
                     transform transition hover:scale-105 shadow-md sm:hidden"
        >
          <FaBars className="h-5 w-5 text-gray-600" />
        </button>

        {/* ช่อง Search: ซ่อนบน Mobile */}
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-100 rounded-full px-4 py-2 w-64 
                       focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* ด้านขวา: ข้อมูลผู้ใช้ */}
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <h4 className="text-sm font-semibold text-purple-600">
            {user.rc_ac_name} {user.rc_ac_lastname}
          </h4>
          <p className="text-xs text-gray-500">
            {user.rc_ac_permissions === 1 ? "ผู้ดูแลระบบ" : "ผู้ใช้งานทั่วไป"}
          </p>
        </div>
        <div className="h-10 w-10 bg-gray-300 text-white rounded-full overflow-hidden">
          <img
            src={user.rc_ac_img}
            alt="User Avatar"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";
export default Header;
