'use client';
import {
  FaArrowLeft,
  FaHome,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaUserCircle,
  FaCogs,
  FaSignOutAlt,
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import React from 'react';

const Sidebar = React.memo(({ user, setCurrentPage, currentPage, isSidebarOpen, toggleSidebar }) => {
  const router = useRouter();

  const handleLogout = () => {
    Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการออกจากระบบใช่หรือไม่',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่, ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('authToken');
        Swal.fire('ออกจากระบบแล้ว', 'คุณได้ออกจากระบบเรียบร้อย', 'success').then(() => {
          router.push('/');
        });
      }
    });
  };

  // const handleSetting = () => {
  //   Swal.fire({
  //     title: 'คุณแน่ใจหรือไม่?',
  //     text: 'คุณต้องการออกจากระบบใช่หรือไม่',
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonColor: '#3085d6',
  //     cancelButtonColor: '#d33',
  //     confirmButtonText: 'ใช่, ออกจากระบบ',
  //     cancelButtonText: 'ยกเลิก',
  //   });
  // };

  const menuItems = [
    { label: 'หน้าหลัก', icon: FaHome, page: 'home' },
    { label: 'ค้นหาหนังสือ', icon: FaChalkboardTeacher, page: 'search' },
    { label: 'รายการโปรด', icon: FaUserGraduate, page: 'favorites' },
  ];

  const otherItems = [
    { label: 'Profile', icon: FaUserCircle },
    { label: 'Settings', icon: FaCogs},
    { label: 'Logout', icon: FaSignOutAlt, action: handleLogout },
  ];

  return (
    <>
      {/* ============== Sidebar Desktop (≥ 640px) ============== */}
      <aside
        className="
          hidden
          sm:flex
          sm:flex-col
          bg-white
          p-6
          shadow-md
          w-52
          h-screen        /* สูงเต็มหน้าจอ */
          sticky
          top-0
          z-40
        "
      >
        {/* Logo/Brand */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="h-16 w-16 bg-indigo-500 text-white rounded-full flex items-center justify-center overflow-hidden">
            <img 
              src="/images/logo.webp"
              alt="logo"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-600">
            UBU Library
          </h1>
        </div>

        {/* MENU */}
        <div className="mb-8 flex-1">
          <h2 className="text-gray-500 text-xs font-semibold mb-2 px-1">MENU</h2>
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li
                key={index}
                onClick={() => setCurrentPage(item.page)}
                className={`
                  flex items-center cursor-pointer rounded-md px-3 py-2 transition-colors
                  ${
                    currentPage === item.page 
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-700 hover:bg-blue-100 hover:text-indigo-500'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <span className="ml-3 text-sm">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* OTHER */}
        <div>
          <h2 className="text-gray-500 text-xs font-semibold mb-2 px-1">OTHER</h2>
          <ul className="space-y-2">
            {otherItems.map((item, index) => (
              <li
                key={index}
                onClick={() => {
                  if (item.action) item.action();
                }}
                className="
                  flex items-center text-gray-700 hover:bg-blue-100 hover:text-indigo-500
                  transition-colors cursor-pointer rounded-md px-3 py-2
                "
              >
                <item.icon className="h-5 w-5" />
                <span className="ml-3 text-sm">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ============== Sidebar Mobile (< 640px) ============== */}
      <aside
        className={`
          sm:hidden
          fixed top-0 left-0
          w-64 h-screen
          bg-white p-6 shadow-md
          z-50
          transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ปุ่มปิด Sidebar (Arrow) */}
        {isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="
              absolute top-4 right-4
              w-10 h-10 flex items-center justify-center
              bg-gradient-to-r from-purple-500 to-indigo-500
              text-white text-2xl
              rounded-full shadow-lg transform transition-all duration-300
              hover:scale-110 hover:shadow-2xl
            "
          >
            <FaArrowLeft />
          </button>
        )}

        {/* Logo/Brand */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="h-16 w-16 bg-indigo-500 text-white rounded-full flex items-center justify-center overflow-hidden">
            <img 
              src="/images/logo.webp"
              alt="logo"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-600">
            UBU Library
          </h1>
        </div>

        {/* MENU */}
        <div className="mb-8 flex-1 overflow-y-auto">
          <h2 className="text-gray-500 text-xs font-semibold mb-2 px-1">MENU</h2>
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li
                key={index}
                onClick={() => {
                  setCurrentPage(item.page);
                  toggleSidebar(); // ปิด Sidebar หลังคลิก
                }}
                className={`
                  flex items-center cursor-pointer rounded-md px-3 py-2 transition-colors
                  ${
                    currentPage === item.page 
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-700 hover:bg-blue-100 hover:text-indigo-500'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <span className="ml-3 text-sm">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* OTHER */}
        <div>
          <h2 className="text-gray-500 text-xs font-semibold mb-2 px-1">OTHER</h2>
          <ul className="space-y-2">
            {otherItems.map((item, index) => (
              <li
                key={index}
                onClick={() => {
                  if (item.action) item.action();
                  toggleSidebar(); // ปิด Sidebar หลังคลิก
                }}
                className="
                  flex items-center text-gray-700 hover:bg-blue-100 hover:text-indigo-500
                  transition-colors cursor-pointer rounded-md px-3 py-2
                "
              >
                <item.icon className="h-5 w-5" />
                <span className="ml-3 text-sm">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;
