'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
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
  const [currentPage, setCurrentPage] = useState('home');
  // เริ่มเป็น true เพื่อรองรับ Desktop (≥ 640px) โดยค่าเริ่มต้นจะเปิด Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const date = moment().tz('Asia/Bangkok').format('YYYY-MM-DD HH:mm:ss');

  // เรนเดอร์คอนเทนต์ตาม currentPage
  const renderContent = useCallback(() => {
    switch (currentPage) {
      case 'home':
        return <HomeContent userID={userID} />;
      case 'search':
        return <BookSearch userID={userID} />;
      case 'favorites':
        return <Favorites userID={userID} />;
      default:
        return <HomeContent userID={userID} />;
    }
  }, [currentPage, userID]);

  // โหลดข้อมูลผู้ใช้
  useEffect(() => {
    const loadUser = async () => {
      const userProfile = await fetchUserProfile();
      if (userProfile.error) {
        Swal.fire('Error', userProfile.message, 'error');
        router.push('/');
      } else {
        setUser(userProfile.user);
        setUserID(userProfile.user.rc_ac_pid);
      }
    };
    loadUser();
  }, [router]);

  // ปรับสถานะ Sidebar ตามขนาดหน้าจอ
  useEffect(() => {
    const handleResize = () => {
      // ถ้าหน้าจอกว้าง ≥ 640 => เปิด Sidebar
      // ถ้าหน้าจอกว้าง < 640 => ปิด Sidebar
      setIsSidebarOpen(window.innerWidth >= 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // toggleSidebar สำหรับ mobile
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      {/* Sidebar */}
      <Sidebar
        user={user}
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header user={user} toggleSidebar={toggleSidebar} />
        <div className="flex-1 bg-gray-100 p-4">
          {renderContent()}
        </div>
        <footer className="py-4 bg-gray-800 text-white text-center">
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
