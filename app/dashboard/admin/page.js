"use client";

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { fetchUserProfile } from '../api/getUserInformation';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import HomeAdmin from './HomeAdmin';

const AdminDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home'); // เก็บค่าหน้าปัจจุบัน

  // ฟังก์ชันสำหรับเรนเดอร์เนื้อหาใน main
  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <HomeAdmin />;
      case 'search':
        return <BookSearch />;
      case 'favorites':
        return <Favorites />;
      default:
        return <HomeContent />;
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
      }
    };
    loadUser();
  }, [router]);

  if (!user) {
    return <p>กำลังโหลดข้อมูล...</p>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={user} setCurrentPage={setCurrentPage} />
      <div className='flex-1 flex flex-col'>
        <Header user={user} />

        <div className='flex-1 p-5 bg-gray-100'>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
