'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import axios from "axios";
import Swal from "sweetalert2";
import { AiOutlineMail } from "react-icons/ai"; // เพิ่มไอคอน Email
import { IoCloseSharp } from "react-icons/io5"; // สำหรับไอคอนปุ่มปิด
import { FaUserGraduate, FaArrowLeft } from "react-icons/fa"; // ไอคอนนักศึกษา
import { motion, AnimatePresence } from "framer-motion";



const LoginModal = ({ isOpen, onClose, step, setStep }) => {
  // const [step, setStep] = useState(1); // 1: เลือกประเภท, 2: กรอกอีเมล, 3: กรอกรหัสผ่าน
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [std_username, setStd_username] = useState("");
  const [std_password, setStd_password] = useState("");
  const router = useRouter();

  const SECRET_KEY = process.env.SECRET_KEY;

  // Parameter สำหรับการสมัครสมาชิก
  const [Reg_email, setReg_email] = useState("");
  const [Reg_stid, setReg_stid] = useState("");
  const [Reg_password, setReg_password] = useState("");
  const [Reg_cpassword, setReg_cpassword] = useState("");
  const [Reg_firstname, setReg_firstname] = useState("");
  const [Reg_lastname, setReg_lastname] = useState("");

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  const handleClose = () => {
    setStep(1); // รีเซ็ต step เมื่อปิด Modal
    setEmail(""); // เคลียร์ข้อมูลอีเมล
    setPassword(""); // เคลียร์ข้อมูลรหัสผ่าน
    setStd_username("");
    setStd_password("");
    onClose(); // ปิด Modal
  };

  const handleEmailNextStep = () => {
    // ตรวจสอบเฉพาะ step ที่ต้องการ
    if (step === 2) {
      if (!email.trim()) {
        Swal.fire("กรุณากรอกอีเมล", "คุณต้องกรอกอีเมลก่อนดำเนินการต่อ", "warning");
        return;
      }
    }

    if (step === 3) {
      if (!password.trim()) {
        Swal.fire("กรุณากรอกรหัสผ่าน", "คุณต้องกรอกรหัสผ่านก่อนดำเนินการต่อ", "warning");
        return;
      }
    }

    // หากไม่มีปัญหาให้ไปยัง step ถัดไป
    setStep(step + 1);
  };

  const handleStdNextStep = () => {
    if (step === 4 && !std_username.trim()) {
      Swal.fire("กรุณากรอกรหัสนักศึกษา", "คุณต้องกรอกรหัสนักศึกษาก่อนดำเนินการต่อ", "warning")
      return;
    }
    setStep(step + 1);
  }

  const handleLogin = async () => {
    let payload = {};

    if (step === 3) {
      if (!email.trim() || !password.trim()) {
        Swal.fire("กรุณากรอกข้อมูลให้ครบถ้วน", "กรุณากรอกอีเมลและรหัสผ่าน", "warning");
        return;
      }
      payload = { email, password, step: 3 };
    } else if (step === 5) {
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
  

  const handleRegister = async () => {
    const data = {
      Reg_email,
      Reg_stid,
      Reg_password,
      Reg_firstname,
      Reg_lastname,
    };

    if (step === 6) {
      if (!Reg_email.trim() || !Reg_stid.trim() || !Reg_password.trim() || !Reg_cpassword.trim() || !Reg_firstname.trim() || !Reg_lastname.trim()) {
        Swal.fire("กรุณากรอกข้อมูลให้ครบถ้วน", "ทุกช่องต้องไม่เว้นว่าง", "warning");
        return;
      }

      if (Reg_password !== Reg_cpassword) {
        Swal.fire("รหัสผ่านไม่ตรงกัน", "กรุณายืนยันรหัสผ่านให้ถูกต้อง", "error");
        return;
      }
    }    

    try {
      console.log("Sending data to API:", data); // Log ข้อมูลที่กำลังส่งไป
  
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
  
      console.log("Response from API:", result); // Log ข้อมูลที่ได้รับจาก API
  
    if (response.ok && result.success) {
        Swal.fire('สมัครสมาชิกสำเร็จ', 'คุณสามารถเข้าสู่ระบบได้ทันที', 'success');
        setStep(1);
        onClose();
      } else {
        Swal.fire('เกิดข้อผิดพลาด', result.message || 'ไม่สามารถสมัครสมาชิกได้', 'error');
      }
    } catch (error) {
      console.error("Error during registration:", error); // Log ข้อผิดพลาดที่เกิดขึ้น
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อระบบได้', 'error');
    }
  };

  if (!isOpen) return null;
  
  return (
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
        {/* ปุ่มปิด Modal */}
        <button
          className="absolute top-4 right-4 bg-black p-2 rounded-full shadow-lg text-gray-200 hover:text-white hover:bg-gray-200 z-50"
          onClick={handleClose}
        >
          <IoCloseSharp size={24} />
        </button>

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
                  ลงชื่อเข้าใช้หรือสมัครใช้งานได้ในไม่กี่นาที
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  ใช้บัญชีของคุณเพื่อใช้งานระบบ UBU แนะนำหนังสือต่อ (ฟรี!)
                </p>

                <div className="space-y-4">
                  <button
                    className="w-full flex items-center justify-center py-2 px-4 bg-gray-100 text-gray-800 rounded-md shadow hover:bg-gray-200"
                    onClick={() => setStep(4)}
                  >
                    <FaUserGraduate size={24} className="mr-2 text-blue-500" /> ดำเนินการต่อด้วยรหัสนักศึกษา
                  </button>
                  <button
                    className="w-full flex items-center justify-center py-2 px-4 bg-gray-100 text-gray-800 rounded-md shadow hover:bg-gray-200"
                    onClick={() => setStep(2)}
                  >
                    <AiOutlineMail size={24} className="mr-2 text-red-500" /> ดำเนินการต่อด้วยอีเมล
                  </button>
                </div>

                {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-600">หรือ</span>
                    </div>
                  </div>

                  {/* ปุ่มสมัครใช้งาน */}
                  <button 
                    className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded-md shadow hover:bg-gray-200"
                    onClick={() => setStep(6)}
                  >
                    สมัครใช้งานบัญชีใหม่ ที่นี่
                  </button>

                  {/* Footer */}
                  <p className="text-xs text-gray-500 mt-6">
                    เมื่อดำเนินการต่อไป คุณได้ยอมรับ{" "}
                    <a href="#" className="text-purple-600 underline hover:text-purple-900">
                      ข้อตกลงการใช้งาน
                    </a>{" "}
                    อ่าน{" "}
                    <a href="#" className="text-purple-600 underline hover:text-purple-900">
                      นโยบายความเป็นส่วนตัว
                    </a>{" "}
                    ของเรา
                  </p>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  className="mb-4 text-gray-600 flex items-center"
                  onClick={() => setStep(1)}
                >
                  <FaArrowLeft className="mr-2" /> กลับ
                </button>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  ดำเนินการต่อด้วยอีเมล
                </h2>
                <input
                  type="email"
                  placeholder="อีเมล (example@ubu.ac.th)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 p-2 text-black rounded mb-4"
                />
                <button
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700"
                  onClick={handleEmailNextStep}
                >
                  ดำเนินการต่อ
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  className="mb-4 text-gray-600 flex items-center"
                  onClick={() => setStep(2)}
                >
                  <FaArrowLeft className="mr-2" /> กลับ
                </button>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  ใส่รหัสผ่านของคุณ
                </h2>
                <input
                  type="password"
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {step === 4 && (
              <>
                <button
                  className="mb-4 text-gray-600 flex items-center"
                  onClick={() => setStep(1)}
                >
                  <FaArrowLeft className="mr-2" /> กลับ
                </button>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  ดำเนินการต่อด้วยรหัสนักศึกษา
                </h2>
                <input
                  type="text"
                  placeholder="รหัสนักศึกษา (ตัวอย่าง 6811047xxxx)"
                  value={std_username}
                  onChange={(e) => setStd_username(e.target.value)}
                  className="w-full border border-gray-300 text-black p-2 rounded mb-4"
                />
                <button
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700"
                  onClick={handleStdNextStep}
                >
                  ดำเนินการต่อ
                </button>
              </>
            )}

            {step === 5 && (
              <>
                <button
                  className="mb-4 text-gray-600 flex items-center"
                  onClick={() => setStep(4)}
                >
                  <FaArrowLeft className="mr-2" /> กลับ
                </button>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  ใส่รหัสผ่านของคุณ
                </h2>
                <input
                  type="password"
                  placeholder="รหัสผ่าน"
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

            {step === 6 && (
              <div>
                <button
                  className="mb-4 text-gray-600 flex items-center"
                  onClick={() => setStep(1)}
                >
                  <FaArrowLeft className="mr-2" /> กลับ
                </button>
                <h2 className="text-xl font-bold text-gray-800 mb-4">สมัครสมาชิก</h2>
                <p className="text-sm text-gray-600 mb-5">
                  ระบบจะตรวจสอบว่าคุณมีบัญชีหรือไม่ และจะช่วยสร้างให้หากไม่มี
                </p>
                <p className="text-sm text-black">
                  อีเมล (ของมหาวิทยาลัย @ubu.ac.th)
                </p>
                <input
                  type="email"
                  placeholder="อีเมล"
                  value={Reg_email}
                  onChange={(e) => setReg_email(e.target.value)}
                  className="text-black w-full border border-gray-300 p-2 rounded mb-4"
                />
                <p className="text-sm text-black">
                  รหัสนักศึกษา
                </p>
                <input
                  type="text"
                  placeholder="รหัสนักศึกษา"
                  value={Reg_stid}
                  onChange={(e) => setReg_stid(e.target.value)}
                  className="text-black w-full border border-gray-300 p-2 rounded mb-4"
                />
                
                <button
                  className="w-full py-2 px-4 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700"
                  onClick={() => setStep(7)}
                >
                  ดำเนินการต่อ
                </button>
              </div>
            )}

          {step === 7 && (
            <>
              <button
                className="mb-4 text-gray-600 flex items-center"
                onClick={() => setStep(6)}
              >
                <FaArrowLeft className="mr-2" /> กลับ
              </button>

              <h2 className="text-xl font-bold text-gray-800 mb-4">สมัครสมาชิก</h2>
              <p className="text-sm text-gray-600 mb-5">
                คุณกำลังจะสร้างบัญชี UBU แนะนำหนังสือ ด้วย Email
                <span className="text-purple-600 underline font-bold"> {Reg_email} </span>
                   และรหัสนักศึกษา 
                <span className="text-purple-600 underline font-bold"> {Reg_stid} </span>
              </p>

              <p className="text-sm text-black">
                ชื่อ (ภาษาไทย)
              </p>
              <input
                type="text"
                placeholder="ชื่อ"
                value={Reg_firstname}
                onChange={(e) => setReg_firstname(e.target.value)}
                className="text-black w-full border border-gray-300 p-2 rounded mb-4"
              />
              <p className="text-sm text-black">
                นามสกุล (ภาษาไทย)
              </p>
              <input
                type="text"
                placeholder="นามสกุล"
                value={Reg_lastname}
                onChange={(e) => setReg_lastname(e.target.value)}
                className="text-black w-full border border-gray-300 p-2 rounded mb-4"
              />

              <button
                className="w-full py-2 px-4 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700"
                onClick={() => setStep(8)}
              >
                ดำเนินการต่อ
              </button>
            </>
          )}

          {step === 8 && (
            <>
              <button
                className="mb-4 text-gray-600 flex items-center"
                onClick={() => setStep(7)}
              >
                <FaArrowLeft className="mr-2" /> กลับ
              </button>

              <h2 className="text-xl font-bold text-gray-800 mb-4">สมัครสมาชิก</h2>
              <p className="text-sm text-gray-600 mb-5">
                คุณกำลังจะสร้างบัญชี UBU แนะนำหนังสือ ด้วย Email
                <span className="text-purple-600 font-bold underline"> {Reg_email} </span>
                รหัสนักศึกษา 
                <span className="text-purple-600 font-bold underline"> {Reg_stid} </span>
                  <p> ชื่อ 
                    <span className="text-purple-600"> {Reg_firstname} </span>
                    นามสกุล
                    <span className="text-purple-600"> {Reg_lastname} </span>
                  </p>
              </p>

              <p className="text-sm text-black">
                รหัสผ่าน
              </p>
              <input
                type="password"
                placeholder="รหัสผ่าน"
                value={Reg_password}
                onChange={(e) => setReg_password(e.target.value)}
                className="text-black w-full border border-gray-300 p-2 rounded mb-4"
              />

              <p className="text-sm text-black">
                ยืนยันรหัสผ่าน
              </p>
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่าน"
                value={Reg_cpassword}
                onChange={(e) => setReg_cpassword(e.target.value)}
                className="text-black w-full border border-gray-300 p-2 rounded mb-4"
              />

              <button
                className="w-full py-2 px-4 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700"
                onClick={handleRegister}
              >
                ยืนยันการสมัครสมาชิก
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
  );
};

export default LoginModal;
