import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion"; // ตัวอย่าง react animation
import Swal from 'sweetalert2';

const ProfileForm = ({ 
  latestProfile, 
  facultyList, 
  fetchDepartments, 
  fetchCategories, 
  saveProfile, 
  closeModal 
}) => {
  const [faculty, setFaculty] = useState("");
  const [departmentList, setDepartmentList] = useState([]);
  const [department, setDepartment] = useState("");

  const [categoryList, setCategoryList] = useState([]);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");

  useEffect(() => {
    if (latestProfile) {
      setFaculty(latestProfile.rc_ac_us_pr_fac_pid || "");
      setDepartment(latestProfile.rc_ac_us_pr_dep_pid || "");
      setP1(latestProfile.rc_ac_us_pr_p1 || "");
      setP2(latestProfile.rc_ac_us_pr_p2 || "");
      setP3(latestProfile.rc_ac_us_pr_p3 || "");
      if (latestProfile.rc_ac_us_pr_fac_pid) {
        fetchDepartments(latestProfile.rc_ac_us_pr_fac_pid);
        fetchCategories(latestProfile.rc_ac_us_pr_fac_pid);
      }
    }
  }, [latestProfile, fetchDepartments, fetchCategories]);

  const handleFacultyChange = (e) => {
    const value = e.target.value;
    setFaculty(value);
    setDepartment("");
    setDepartmentList([]);
    fetchDepartments(value);
    fetchCategories(value);
    setP1("");
    setP2("");
    setP3("");
  };

  const handleSave = () => {
    if (!faculty || !department) {
      Swal.fire("กรุณากรอกข้อมูลให้ครบ", "", "warning");
      return;
    }
    if (p1 === p2 || p1 === p3 || p2 === p3) {
      Swal.fire("พบการเลือกหมวดหมู่ซ้ำกัน", "กรุณาเลือกหมวดหมู่ที่ไม่ซ้ำกัน", "warning");
      return;
    }
    saveProfile({ faculty, department, p1, p2, p3 });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full"
        >
            <h2 className="text-xl font-bold mb-4 text-black">
            สร้าง/แก้ไข Profile
            </h2>

            <div className="flex flex-col gap-4 text-black">
            {/* Faculty */}
            <div>
                <label className="block mb-1">Faculty (คณะ)</label>
                <select
                className="border p-2 w-full"
                value={faculty}
                onChange={handleFacultyChange}
                >
                <option value="">-- เลือกคณะ --</option>
                {facultyList.map((fac) => (
                    <option key={fac.rc_fac_pid} value={fac.rc_fac_pid}>
                    {fac.rc_fac_name}
                    </option>
                ))}
                </select>
            </div>

            {/* Department */}
            <div>
                <label className="block mb-1">Department (สาขา)</label>
                <select
                className="border p-2 w-full"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={!faculty}
                >
                <option value="">-- เลือกสาขา --</option>
                {departmentList.map((dep) => (
                    <option key={dep.rc_dep_pid} value={dep.rc_dep_pid}>
                    {dep.rc_dep_name}
                    </option>
                ))}
                </select>
            </div>

            {/* Category 1 */}
            <div>
                <label className="block mb-1">หมวดหมู่หนังสือที่ชอบ 1</label>
                <select
                className="border p-2 w-full"
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                disabled={!faculty}
                >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categoryList.map((cat) => (
                    <option key={cat.rc_bo_cat_pid} value={cat.rc_bo_cat_pid}>
                    {cat.rc_bo_cat_name}
                    </option>
                ))}
                </select>
            </div>

            {/* Category 2 */}
            <div>
                <label className="block mb-1">หมวดหมู่หนังสือที่ชอบ 2</label>
                <select
                className="border p-2 w-full"
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                disabled={!faculty}
                >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categoryList.map((cat) => (
                    <option key={cat.rc_bo_cat_pid} value={cat.rc_bo_cat_pid}>
                    {cat.rc_bo_cat_name}
                    </option>
                ))}
                </select>
            </div>

            {/* Category 3 */}
            <div>
                <label className="block mb-1">หมวดหมู่หนังสือที่ชอบ 3</label>
                <select
                className="border p-2 w-full"
                value={p3}
                onChange={(e) => setP3(e.target.value)}
                disabled={!faculty}
                >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categoryList.map((cat) => (
                    <option key={cat.rc_bo_cat_pid} value={cat.rc_bo_cat_pid}>
                    {cat.rc_bo_cat_name}
                    </option>
                ))}
                </select>
            </div>

            {/* ปุ่มบันทึก / ปิด */}
            <div className="flex gap-2 mt-4">
                <button
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                onClick={handleSave}
                >
                บันทึก
                </button>

                {/* เงื่อนไข: มี latestProfile แล้ว ถึงจะให้ปิด modal ได้ 
                    (หรือจะให้ปิด modal ได้เลยก็แล้วแต่ requirement) */}
                {latestProfile && (
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    onClick={() => setShowModal(false)}
                >
                    ปิด
                </button>
                )}
            </div>
            </div>
        </motion.div>
        </div>
  );
};

export default ProfileForm;
