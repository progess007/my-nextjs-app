'use client'

import React, { useState } from 'react';

const App = () => {
  const [activeMenu, setActiveMenu] = useState('home');

  const renderContent = () => {
    switch (activeMenu) {
      case 'home':
        return <HomeContent />;
      case 'search':
        return <SearchContent />;
      case 'profile':
        return <ProfileContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return <HomeContent />;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar setActiveMenu={setActiveMenu} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1 p-5 bg-gray-100">{renderContent()}</div>
        <Footer />
      </div>
    </div>
  );
};

const Navbar = () => {
  return (
    <div className="h-16 bg-indigo-600 text-white flex items-center px-5">
      <input
        type="text"
        placeholder="Search..."
        className="px-3 py-1 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-indigo-300 flex-shrink-0 mr-5"
      />
      <div className="flex items-center ml-auto">
        <p className="mr-4">User Name</p>
        <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center">K</div>
      </div>
    </div>
  );
};

const Sidebar = ({ setActiveMenu }) => {
  return (
    <div className="w-64 bg-indigo-600 text-white p-5 flex flex-col justify-between">
      <div>
        <h1 className="text-lg font-bold mb-5">UBU Library</h1>
        <nav>
          <ul className="space-y-4">
            <li onClick={() => setActiveMenu('home')} className="cursor-pointer">หน้าหลัก</li>
            <li onClick={() => setActiveMenu('search')} className="cursor-pointer">ค้นหาหนังสือ</li>
            <li onClick={() => setActiveMenu('profile')} className="cursor-pointer">Profile</li>
            <li onClick={() => setActiveMenu('settings')} className="cursor-pointer">Settings</li>
            <li className="cursor-pointer">Logout</li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="py-4 bg-gray-800 text-white text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm">&copy; {new Date().getFullYear()} UBU Library Recommendation System. All rights reserved.</p>
      </div>
    </footer>
  );
};

const HomeContent = () => {
  return (
    <div>
      <h1 className="text-2xl">หน้าหลัก</h1>
      <p>Welcome to the UBU Library Dashboard!</p>
    </div>
  );
};

const SearchContent = () => {
  return (
    <div>
      <h1 className="text-2xl">ค้นหาหนังสือ</h1>
      <p>Search for books in the library database.</p>
    </div>
  );
};

const ProfileContent = () => {
  return (
    <div>
      <h1 className="text-2xl">Profile</h1>
      <p>View and edit your profile details.</p>
    </div>
  );
};

const SettingsContent = () => {
  return (
    <div>
      <h1 className="text-2xl">Settings</h1>
      <p>Adjust your account settings.</p>
    </div>
  );
};

export default App;
