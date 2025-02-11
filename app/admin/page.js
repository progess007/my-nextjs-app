'use client'

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Swal from "sweetalert2";
import { AiOutlineMail } from "react-icons/ai"; // เพิ่มไอคอน Email
import { IoCloseSharp } from "react-icons/io5"; // สำหรับไอคอนปุ่มปิด
import { FaArrowLeft, FaDatabase } from "react-icons/fa"; // ไอคอนนักศึกษา
import { motion, AnimatePresence } from "framer-motion";




const AdminLogin = () => {
    const [step, setStep] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [std_username, setStd_username] = useState("");
    const [std_password, setStd_password] = useState("");
    const router = useRouter();

    useEffect(() => {
        // เปิด Modal ทันทีเมื่อโหลดหน้าเว็บ
        setIsModalOpen(true);
      }, []);
    
      const closeModal = () => {
        setIsModalOpen(false);
      };

      const stepVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
      };

    const handleLogin = async () => {
        let payload = {};
    
        if (step === 4) {
          if (!std_username.trim() || !std_password.trim()) {
            Swal.fire("กรุณากรอกข้อมูลให้ครบถ้วน", "กรุณากรอกรหัสนักศึกษาและรหัสผ่าน", "warning");
            return;
          }
          payload = { std_username, std_password, step: 5 };
        } else {
          Swal.fire("เกิดข้อผิดพลาด", "Step ไม่ถูกต้อง", "error");
          return;
        }
    
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
    
          const data = await response.json();
    
          if (response.ok) {
            Swal.fire("เข้าสู่ระบบสำเร็จ", "", "success");
    
            // เก็บ JWT ลงใน Local Storage
            // console.log("Token received from server:", data.token); // ตรวจสอบ token
            
            localStorage.setItem("authToken", data.token);
            const token = localStorage.getItem("authToken");
            // console.log("Token in Local Storage:", token);
    
            // Redirect ไปยัง URL ที่ระบุ
            router.push(data.redirectURL);
          } else {
            Swal.fire("ข้อมูลไม่ถูกต้อง", data.message || "กรุณาลองใหม่อีกครั้ง", "error");
          }
        } catch (error) {
          console.error("Login Error:", error);
          Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อระบบได้", "error");
        }
      };
    
      if (!setIsModalOpen) return null;

    return(
    <>
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

    </div>
    <AnimatePresence>
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      // onClick={handleClose} // ปิด Modal เมื่อคลิกพื้นที่ว่าง
    >
      <motion.div 
        className="relative w-full max-w-lg md:max-w-4xl mx-auto bg-white rounded-lg shadow-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()} // ป้องกันการปิด Modal เมื่อคลิกภายใน
      >

        <div className="flex flex-col md:flex-row">
          {/* ซ้าย: ข้อความและปุ่ม */}
          <div className="p-6 w-full md:w-1/2">

          <motion.div
            key={step} // ให้ Animation ทำงานทุกครั้งที่เปลี่ยน Step
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.5 }}
          >
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  ระบบจัดการข้อมูลหลังบ้าย Backend
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  ใช้บัญชีผู้ดูแลระบบของคุณเพื่อเข้าใช้งานระบบ
                </p>

                <div className="space-y-4 mt-28">
                    
                  <button
                    className="w-full flex items-center justify-center py-2 px-4 bg-gray-100 text-gray-800 rounded-md shadow hover:bg-gray-200"
                    onClick={() => setStep(4)}
                  >
                    <FaDatabase size={24} className="mr-2 text-blue-500" /> เข้าสู่ระบบ
                  </button>

                </div>

                
              </>
            )}

            {step === 4 && (
              <>
                <button
                  className="mb-4 text-gray-600 flex items-center"
                  onClick={() => setStep(1)}
                >
                  <FaArrowLeft className="mr-2" /> กลับ
                </button>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  เข้าสู่ระบบ
                </h2>
                <input
                  type="text"
                  placeholder="Username"
                  value={std_username}
                  onChange={(e) => setStd_username(e.target.value)}
                  className="w-full border border-gray-300 text-purple-600 p-2 rounded mb-4"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={std_password}
                  onChange={(e) => setStd_password(e.target.value)}
                  className="w-full border border-gray-300 text-black p-2 rounded mb-4"
                />
                <button
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700"
                  onClick={handleLogin}
                >
                  ลงชื่อเข้าใช้
                </button>
              </>
            )}

          </motion.div>

          </div>

          {/* ขวา: รูปภาพ */}
          <div className="hidden md:block md:w-1/2 relative rounded-r-lg overflow-hidden">
            <img
              src="/images/Login_modal.webp" // รูปภาพชั่วคราว
              alt="Design with ease"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
    {/* <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold text-gray-800">Welcome to My Website</h1>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Welcome!</h2>
            <p className="text-gray-600 mb-4">
              This is a modal that appears when the page loads.
            </p>
            <button
              onClick={closeModal}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div> */}
    </>
    );

};

export default AdminLogin;