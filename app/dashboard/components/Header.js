'use client';
import { FaBars } from 'react-icons/fa';
import React from 'react';

const Header = React.memo(({ user, toggleSidebar }) => {
  return (
    <header className="bg-white shadow-md px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 transform transition hover:scale-110 shadow-md"
        >
          <FaBars className="h-6 w-6 text-gray-600" />
        </button>
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-100 rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <h4 className="text-sm font-semibold text-purple-600">
              {user.rc_ac_name} {user.rc_ac_lastname}
            </h4>
            <p className="text-xs text-gray-500">
              {user.rc_ac_permissions === 1 ? "ผู้ดูแลระบบ" : "ผู้ใช้งานทั่วไป"}
            </p>
          </div>
          <div className="h-10 w-10 bg-red-500 text-white rounded-full flex items-center justify-center">
            <img 
              src={user.rc_ac_img}
              alt="logo"
              className="h-full w-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";
export default Header;
