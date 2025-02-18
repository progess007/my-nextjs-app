'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { FaUser, FaBook, FaLaptop, FaBars, FaTimes} from 'react-icons/fa'; // ตัวอย่างการนำเข้าไอคอนจาก Font Awesome
import { FaUserPlus, FaSignInAlt, FaArrowRight, FaRss } from 'react-icons/fa'; // นำเข้าไอคอนที่ต้องการใช้
import SearchBar from './components/SearchBar';
import LoginModal from './components/LoginModal';
import ParallaxTilt from 'react-parallax-tilt'
import '@/styles/Home.module.css'
import Swal from "sweetalert2";


export default function Home() {

  // Parameter สำหรับ Login Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1); // เก็บค่า step สำหรับ Modal
  
  // Parameter สำหรับ Menu Hamburger
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [topBooks, setTopBooks] = useState([]);

  const handleOpenModalWithStep = (targetStep) => {
    setStep(targetStep); // กำหนด Step ที่ต้องการ
    setIsModalOpen(true); // เปิด Modal
  };

  useEffect(() => {
    async function fetchTopBooks() {
      try {
        const res = await fetch('/api/books/top-books');
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        const data = await res.json();
        setTopBooks(data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchTopBooks();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <Head>
        <title>Library Book Recommendation</title>
        <meta name="description" content="A modern library system to recommend books you'll love." />
      </Head>

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

      {/* Hero Section */}
      <header className="flex flex-col items-center text-center mt-16 px-4">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Your Personalized Book Recommendation System</h2>
        <p className="text-gray-600 max-w-xl">ค้นหาหนังสือที่เหมาะสมกับรสนิยมของคุณ ค้นพบความเป็นไปได้ต่างๆมากมาย </p>
        <p className="text-gray-600 max-w-xl"> ในห้องสมุดดิจิทัลที่ทันสมัยของเรา </p>

        <SearchBar />
        
      </header>

      {/* Features Section */}
      <section className="mt-16 px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
            <FaUser size={32} /> {/* ใช้ React Icon แทน SVG */}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Personalized Recommendations</h3>
          <p className="text-gray-600 text-center mt-2">Get book suggestions based on your preferences and reading history.</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
            <FaBook size={32} /> {/* ใช้ React Icon แทน SVG */}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Wide Selection</h3>
          <p className="text-gray-600 text-center mt-2">Explore thousands of books across various genres and categories.</p>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
            <FaLaptop size={32} /> {/* ใช้ React Icon แทน SVG */}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-800">Easy Access</h3>
          <p className="text-gray-600 text-center mt-2">Enjoy a seamless and user-friendly experience across devices.</p>
        </div>
      </section>

      {/* Feature Section */}
      <section className="mt-16 px-4 py-8 bg-white">
      <div className="max-w-screen-xl mx-auto">
        {/* หัวข้อและคำอธิบาย */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            ใช้งานมากที่สุด
          </h2>
          <p className="text-gray-700">
            เล่มนี้คนอ่านเยอะจัง ลองอ่านดู{' '}
            <a 
              href="#" 
              className="text-blue-500 underline hover:text-blue-700"
            >
              View All
            </a>
            {' '}
            <FaRss className="inline-block ml-1 text-orange-500" />
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 
                      md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 
                      gap-8 place-items-center">
          {topBooks.map((book, index) => (
            <ParallaxTilt
              key={book.rc_bo_pid}
              tiltMaxAngleX={5}
              tiltMaxAngleY={5}
              perspective={800}
              scale={1.02}
              transitionSpeed={500}
              className="bg-white p-3 rounded-md shadow-sm hover:shadow-md 
                        transition-shadow relative flex flex-col items-center"
            >
              <Link href={`/books/${book.rc_bo_pid}`}>
                {/* สมมติว่ามี field รูปภาพหนังสือ item.rc_bo_cover */}
                <div key={index} className="w-full text-center group">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded shadow-md bg-gray-200">
                      {book.imageUrl ? (
                      <img
                        src={book.imageUrl}
                        alt={book.title}
                        className="
                          w-full h-full object-cover transform group-hover:scale-105 
                          transition-transform duration-300 ease-out"
                      />
                      ) : (
                      // ถ้าไม่มีรูป ก็แสดง placeholder
                      // <div className="w-full h-full flex items-center justify-center text-gray-500">
                      //   NO IMAGE AVAILABLE
                      // </div>

                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <FaBook className="text-gray-400" size={40} />
                      </div>
                      )}
                      <div
                        className="
                          absolute inset-0 bg-gradient-to-t from-black 
                          via-transparent to-transparent opacity-0 
                          group-hover:opacity-50 transition-opacity duration-300"
                      ></div>
                  </div>
                </div>

                <h3
                  className="
                    mt-3 text-sm font-medium text-green-700 
                    group-hover:text-blue-500 transition-colors 
                    duration-300 line-clamp-2
                  "
                >
                  {book.title}
                </h3>

              </Link>
            </ParallaxTilt> 
          ))}
        </div>

      </div>
      </section>

      {/* ========= ส่วนสำหรับการ Login */}
      <LoginModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        step={step}
        setStep={setStep}
      />

      <footer className="mt-16 py-8 bg-gray-800 text-white text-center">
        <p className="text-sm">&copy; {new Date().getFullYear()} UBU Library Recommendation System. All rights reserved.</p>
      </footer>
    </div>
  );
}

