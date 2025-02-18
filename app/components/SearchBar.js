'use client'

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ParallaxTilt from 'react-parallax-tilt';
import { FiSearch } from 'react-icons/fi';
import { FaBook} from 'react-icons/fa';

export default function SearchBar() {

  /**
  * Component: ModalSearch
  * - มีปุ่มกดให้แสดง Modal ค้นหา
  * - เมื่อเปิด Modal จะแสดงอินพุตค้นหา
  * - เมื่อพิมพ์ค้นหา จะแสดง gallery ของหนังสือ
  */

  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // สถานะของ modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true)
  }
  
  const closeModal = () => {
    setIsModalOpen(false)
    // เคลียร์ค่าต่าง ๆ (ถ้าต้องการ)
    setQuery('')
    setSuggestions([])
    // setDropdownOpen(false)
  }

    // ============ ฟังก์ชัน handleInputChange (จากโค้ดเดิม) ============
    const handleInputChange = async (e) => {
      const value = e.target.value
      setQuery(value)

      if (!value) {
        // ถ้าไม่มีข้อความใน input แล้ว ให้ปิด dropdown หรือ clear
        setSuggestions([])
        setDropdownOpen(false)
        return
      }

      try {
        setLoading(true)
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(value)}`)
        const data = await res.json()
        setSuggestions(data)
        setDropdownOpen(true)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    // ถ้าต้องการปิด Modal เมื่อกด ESC
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          closeModal()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // หากคลิกนอก dropdown ให้ปิด
    useEffect(() => {
      function handleClickOutside(event) {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target)
        ) {
          setDropdownOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return(
      <>
      {/* ========= ส่วน Parallax + ช่องค้นหาเดิม ========= */}
            <ParallaxTilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              perspective={1000}
              scale={1.02}
              transitionSpeed={500}
              className="my-8 px-4"
            >
              {/* กล่องหลักที่เป็นพื้นหลังพาสเทล */}
              <div
                className="w-full sm:w-[400px] md:w-[600px] lg:w-[800px]
                           bg-gradient-to-r from-pink-50 via-blue-50 to-green-50
                           mx-auto p-6 rounded-lg shadow-md "
                ref={containerRef}
              >
                <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
                  ค้นหาหนังสือ 
                </h1>
      
                <div className="relative">
                  {/* Icon Search ด้านซ้าย */}
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400
                              transition-transform duration-300 group-focus-within:scale-125"
                  >
                    <FiSearch size={20} />
                  </span>
      
      
                  {/* ช่องค้นหา (เมื่อคลิกจะเปิด modal) */}
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อหนังสือที่ต้องการค้นหา..."
                    className="w-full sm:w-[350px] md:w-[550px] lg:w-[750px]
                               px-4 py-3 rounded-md border border-gray-300
                               focus:outline-none focus:ring-2 focus:ring-blue-300
                               text-gray-800 text-sm sm:text-base"
                    // คลิกหรือโฟกัส -> เปิด Modal
                    onFocus={openModal}
                    // ถ้าไม่ต้องการให้พิมพ์อะไรในช่องนี้จริง ๆ อาจใช้ readOnly
                    // readOnly
                  />
                </div>
              </div>
            </ParallaxTilt>
      
            {/* ========= ส่วน Modal ========= */}
            {isModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center 
                           bg-black bg-opacity-50"
              >
                <div
                  className="relative bg-gradient-to-br from-pink-50 via-blue-50 
                             to-green-50 w-full max-w-3xl mx-4 rounded-lg shadow-lg
                             p-6 overflow-y-auto h-[80vh]"
                >
                  {/* ปุ่มปิด modal */}
                  <button
                    onClick={closeModal}
                    className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 
                              focus:outline-none text-2xl"
                  >
                    &times;
                  </button>
      
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
                    ค้นหาหนังสือ
                  </h2>
      
                  {/* ช่องค้นหาใน modal */}
                  <div className="mb-4 relative max-w-md mx-auto">
                    <input
                      type="text"
                      value={query}
                      onChange={handleInputChange}
                      placeholder="พิมพ์ชื่อหนังสือที่ต้องการค้นหา..."
                      className="w-full px-4 py-3 rounded-md border border-gray-300 
                                 focus:outline-none focus:ring-2 focus:ring-blue-300
                                 text-gray-800 text-sm sm:text-base"
                    />
                    {loading && (
                      <div className="absolute right-4 top-3 text-blue-600 text-sm">
                        Loading...
                      </div>
                    )}
                  </div>
      
                  {/* แสดง Dropdown เมื่อมีรายการ suggestion (ถ้าต้องการ) */}
                  {isDropdownOpen && suggestions.length > 0 && (
                    <ul
                      className="max-w-md mx-auto bg-white border border-gray-300
                                 mt-1 rounded-md shadow-md z-10 mb-4"
                    >
                      {suggestions.map((item) => (
                        <li
                          key={item.rc_bo_pid}
                          className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-gray-700"
                        >
                          <Link href={`/books/${item.rc_bo_pid}`}>
                            <span onClick={() => setDropdownOpen(false)}>
                              {item.rc_bo_title}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
      
                  {/* หรือจะแสดงผลเป็น Gallery ใน Modal */}
                  {/* ตัวอย่างการแสดงผลแบบ Gallery */}
                  {suggestions.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {suggestions.map((item) => (
                        <ParallaxTilt
                          key={item.rc_bo_pid}
                          tiltMaxAngleX={5}
                          tiltMaxAngleY={5}
                          perspective={800}
                          scale={1.02}
                          transitionSpeed={500}
                          className="bg-white p-3 rounded-md shadow-sm hover:shadow-md 
                                    transition-shadow relative flex flex-col items-center"
                        >
                          <Link href={`/books/${item.rc_bo_pid}`}>
                            {/* สมมติว่ามี field รูปภาพหนังสือ item.rc_bo_cover */}
                            {item.rc_bo_des_img ? (
                              <img
                                src={item.rc_bo_des_img || '/default-cover.jpg'}
                                alt={item.rc_bo_des_img}
                                className="w-32 h-40 object-cover rounded-md mb-2"
                              />

                            ) : (
                              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                <FaBook className="text-gray-400" size={40} />
                              </div>
                            )}
                            <p className="text-gray-700 font-medium text-center">
                              {item.rc_bo_title}
                            </p>
                          </Link>
                        </ParallaxTilt>
                      ))}
                    </div>
                  )}
                  {/* กรณีไม่มีผลลัพธ์ */}
                  {query && !loading && suggestions.length === 0 && (
                    <p className="text-center text-gray-500 mt-4">
                      ไม่พบหนังสือตามคำค้นหาที่ระบุ
                    </p>
                  )}
                </div>
              </div>
            )} 
      </>
    )

}
