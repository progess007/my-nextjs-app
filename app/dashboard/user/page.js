'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Swal from "sweetalert2";
import { fetchUserProfile } from '../api/getUserInformation';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import HomeContent from './HomeContent';
import BookSearch from './BookSearch';
import Favorites from './Favorites';
import moment from 'moment-timezone';

const UserDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userID, setUserID] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // หน้าปัจจุบัน
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const date = moment().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');

  // ฟังก์ชันสำหรับเรนเดอร์เนื้อหาใน main
  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomeContent userID={userID} />;
      case 'search':
        return <BookSearch />;
      case 'favorites':
        return <Favorites />;
      default:
        return <HomeContent userID={userID} />;
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const userProfile = await fetchUserProfile();
      if (userProfile.error) {
        Swal.fire("Error", userProfile.message, "error");
        router.push('/');
      } else {
        setUser(userProfile.user);
        setUserID(userProfile.user.rc_ac_pid);
      }
    };
    loadUser();
  }, [router]);

  // ตรวจสอบขนาดหน้าจอเพื่อกำหนดสถานะ Sidebar เริ่มต้น
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (!user) {
    return <p>กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        user={user} 
        setCurrentPage={setCurrentPage} 
        currentPage={currentPage} 
        isSidebarOpen={isSidebarOpen} 
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header user={user} toggleSidebar={toggleSidebar} />

        {/* เนื้อหาหลัก */}
        <div className="flex-1 bg-gray-100">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="py-8 bg-gray-800 text-white text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} UBU Library Recommendation System. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default UserDashboard;
