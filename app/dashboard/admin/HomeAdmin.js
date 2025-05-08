"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Swal from 'sweetalert2';
import { motion } from "framer-motion";
import { Activity, Users, DollarSign, BarChart, Edit, Trash2 } from "lucide-react";

// ฟังก์ชันช่วยแปลงวันที่
const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  const d = new Date(isoString);
  // ปรับ locale ตามต้องการ เช่น 'th-TH' หรือ 'en-US'
  const datePart = d.toLocaleDateString('en-US', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric'
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit'
  });
  return `${datePart} ${timePart}`;
};

// ฟอร์แมตรูปแบบวันที่สำหรับ input[type="date"]
const formatInputDate = (date) => date.toISOString().slice(0,10);

export default function HomeAdmin() {
  // State สำหรับข้อมูล accounts และ loading
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับ pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ** states ใหม่ สำหรับกราฟ & วันที่ **
  const [chartData, setChartData] = useState([]);
  const [startDate, setStartDate] = useState('2025-03-02');
  const [endDate, setEndDate]   = useState('2025-03-10');
  const [loadingChart, setLoadingChart] = useState(true);

  // State ใหม่สำหรับ Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userType, setUserType] = useState('student'); // 'student' หรือ 'admin'
  const [form, setForm] = useState({
    rc_ac_student_id: '',
    rc_ac_email: '',
    rc_ac_password: '',
    rc_ac_name: '',
    rc_ac_lastname: ''
  });

  // **State สำหรับ Edit Modal**
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    rc_ac_student_id: '',
    rc_ac_email: '',
    rc_ac_password: '',
    rc_ac_name: '',
    rc_ac_lastname: ''
  });
  
  // เปิด Edit modal พร้อมกรอกข้อมูลเดิม
  const openEditModal = (acc) => {
    setEditingUserId(acc.rc_ac_pid);
    setEditForm({
      rc_ac_student_id: acc.rc_ac_student_id,
      rc_ac_email:      acc.rc_ac_email,
      rc_ac_password:   '',                // ให้กรอกใหม่ถ้าต้องการเปลี่ยน
      rc_ac_name:       acc.rc_ac_name,
      rc_ac_lastname:   acc.rc_ac_lastname
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUserId(null);
    setEditForm({
      rc_ac_student_id: '',
      rc_ac_email: '',
      rc_ac_password: '',
      rc_ac_name: '',
      rc_ac_lastname: ''
    });
  };

  const handleEditChange = (e) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // เรียก API อัพเดตข้อมูล
  const submitEdit = async () => {
    try {
      const res = await fetch('/api/admin/updateUser', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rc_ac_pid: editingUserId, ...editForm })
      });
      const result = await res.json();
      if (result.success) {
        await Swal.fire('สำเร็จ','อัปเดตข้อมูลเรียบร้อย','success');
        closeEditModal();
        fetchAccounts();
      } else {
        Swal.fire('ผิดพลาด', result.message, 'error');
      }
    } catch (err) {
      Swal.fire('ผิดพลาด','อัปเดตไม่สำเร็จ','error');
    }
  };

  // ลบผู้ใช้
  const handleDelete = (acc) => {
    Swal.fire({
      title: `ลบผู้ใช้ ${acc.rc_ac_name} ${acc.rc_ac_lastname}`,
      text: 'คุณแน่ใจหรือไม่ว่าจะลบผู้ใช้นี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    }).then(async ({ isConfirmed }) => {
      if (!isConfirmed) return;
      try {
        const res = await fetch(`/api/admin/deleteUser/${acc.rc_ac_pid}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
          await Swal.fire('ลบสำเร็จ','ผู้ใช้ถูกลบเรียบร้อย','success');
          fetchAccounts();
        } else {
          Swal.fire('ผิดพลาด', result.message, 'error');
        }
      } catch {
        Swal.fire('ผิดพลาด','ไม่สามารถลบผู้ใช้ได้','error');
      }
    });
  };

   // โหลดบัญชีผู้ใช้
   const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/getAccounts");
      const data = await res.json();
      if (!data.error) setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลกราฟ
  const fetchChart = async () => {
    setLoadingChart(true);
    try {
      const res = await fetch(
        `/api/admin/getClicks?start=${startDate}&end=${endDate}`
      );
      const data = await res.json();
      if (!data.error) setChartData(data);
    } catch (err) {
      console.error('Error loading chart:', err);
      setChartData([]);
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // เมื่อ startDate หรือ endDate เปลี่ยน ให้ดึงข้อมูลกราฟใหม่
  useEffect(() => {
    fetchChart();
  }, [startDate, endDate]);

  // Handlers Modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setForm({ rc_ac_student_id:'', rc_ac_email:'', rc_ac_password:'', rc_ac_name:'', rc_ac_lastname:'' });
  };

  // Handle input change
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit สร้างนักศึกษา
  const submitStudent = async () => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          Reg_stid:      form.rc_ac_student_id,
          Reg_email:     form.rc_ac_email,
          Reg_password:  form.rc_ac_password,
          Reg_firstname: form.rc_ac_name,
          Reg_lastname:  form.rc_ac_lastname
        })
      });
      const result = await res.json();
      if (result.success) {
        await Swal.fire('สำเร็จ','สร้างนักศึกษาเรียบร้อย รอผู้ใช้ยืนยันอีเมล','success');
        closeModal();
        fetchAccounts();
      } else {
        Swal.fire('ผิดพลาด', result.message, 'error');
      }
    } catch (err) {
      Swal.fire('ผิดพลาด','ไม่สามารถสร้างนักศึกษาได้','error');
    }
  };

  // Submit สร้าง admin
  const submitAdmin = async () => {
    try {
      const res = await fetch('/api/admin/createAdmin', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          username:      form.rc_ac_student_id,
          email:         form.rc_ac_email,
          password:      form.rc_ac_password,
          firstname:     form.rc_ac_name,
          lastname:      form.rc_ac_lastname
        })
      });
      const result = await res.json();
      if (result.success) {
        await Swal.fire('สำเร็จ','สร้างผู้ดูแลระบบเรียบร้อย','success');
        closeModal();
        fetchAccounts();
      } else {
        Swal.fire('ผิดพลาด', result.message, 'error');
      }
    } catch (err) {
      Swal.fire('ผิดพลาด','ไม่สามารถสร้างผู้ดูแลระบบได้','error');
    }
  };

  // คำนวณสำหรับ pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAccounts = accounts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(accounts.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // นับจำนวนผู้ใช้ทั้งหมด
  const totalUsers = accounts.length;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      {/* Title */}
      <motion.h2
        className="text-3xl font-bold text-gray-900 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        หน้าจัดการระบบแนะนำหนังสือ
      </motion.h2>

      {/* Card Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "จำนวนผู้ใช้บนระบบ",
            value: totalUsers,
            icon: <Users className="w-6 h-6" />,
            color: "text-blue-600",
          },
        //   {
        //     title: "Revenue",
        //     value: "$56,789",
        //     icon: <DollarSign className="w-6 h-6" />,
        //     color: "text-green-600",
        //   },
        //   {
        //     title: "Active Sessions",
        //     value: "1,234",
        //     icon: <Activity className="w-6 h-6" />,
        //     color: "text-purple-600",
        //   },
        //   {
        //     title: "New Sales",
        //     value: "567",
        //     icon: <BarChart className="w-6 h-6" />,
        //     color: "text-red-600",
        //   },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
          >
            <div className="p-4 bg-white shadow-lg rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-gray-700 font-semibold">{item.title}</h3>
                <p className={`text-2xl font-semibold ${item.color}`}>{item.value}</p>
              </div>
              <div className="text-gray-500">{item.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ==== Chart Section ==== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mt-10 bg-white p-4 sm:p-6 rounded-2xl shadow-lg"
      >
        <h3 className="text-gray-700 font-semibold mb-4">จำนวนยอดรวม การคลิกอ่านหนังสือของนักศึกษา</h3>

        {/* เลือกช่วงวันที่ */}
        <div className="flex space-x-2 mb-4">
          <div>
            <label className="block text-sm">เริ่มต้น</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={e => setStartDate(e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </div>
          <div>
            <label className="block text-sm">สิ้นสุด</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </div>
          <button
            onClick={fetchChart}
            className="self-end px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            โหลดใหม่
          </button>
        </div>

        {/* กราฟ */}
        {loadingChart ? (
          <p>กำลังโหลดกราฟ...</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />

              {/* หรือ 2) เผื่อ 10% บนสุด */}
              
              <YAxis
                domain={[
                  0,
                  (dataMax) => Math.ceil(dataMax * 1.2)  // เผื่อหัวกราฟอีก 10%
                ]}
                allowDecimals={false}
              />
              
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={3}
                isAnimationActive={true}         // เปิดอนิเมชัน
                animationBegin={300}             // delay 300ms ก่อนเริ่ม
                animationDuration={1500}         // เล่นนาน 1.5 วินาที
                animationEasing="ease-in-out"    // easing สบายตา
                animateNewValues={true}          // เล่นอีกครั้งเมื่อ data เปลี่ยน
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Table Section with Pagination */}
      <motion.div
        className="mt-10 bg-white p-4 sm:p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="overflow-x-auto">

          {/* ปุ่มสร้างใหม่ */}
          <div className="flex justify-end mb-4">
            <button
              onClick={openModal}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              สร้างผู้ใช้ใหม่
            </button>
          </div>

          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 font-medium text-gray-500">ลำดับ</th>
                <th className="px-4 py-2 font-medium text-gray-500">รหัสนักศึกษา</th>
                <th className="px-4 py-2 font-medium text-gray-500">ชื่อ - นามสกุล</th>
                <th className="px-4 py-2 font-medium text-gray-500">อีเมล</th>
                <th className="px-4 py-2 font-medium text-gray-500">สถานะ</th>
                <th className="px-4 py-2 font-medium text-gray-500">วันที่สร้าง</th>
                <th className="px-4 py-2 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : currentAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                    No data found.
                  </td>
                </tr>
              ) : (
                currentAccounts.map((acc) => (
                  <tr key={acc.rc_ac_pid} className="border-b last:border-0">
                    <td className="px-4 py-2">{acc.rc_ac_pid}</td>
                    <td className="px-4 py-2">{acc.rc_ac_student_id || "-"}</td>
                    <td className="px-4 py-2">
                      {acc.rc_ac_name} {acc.rc_ac_lastname}
                    </td>
                    <td className="px-4 py-2">{acc.rc_ac_email}</td>
                    <td className="px-4 py-2">
                      {acc.rc_ac_permissions === 1 ? (
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                          ผู้ดูแลระบบ
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                          ผู้ใช้งาน
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2">
                      {formatDateTime(acc.rc_ac_create_date)}
                    </td>

                    <td className="px-4 py-2 flex items-center space-x-2">
                      <button onClick={() => openEditModal(acc)} className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(acc)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 border rounded ${
                page === currentPage ? "bg-blue-500 text-white" : "bg-white text-gray-700"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </motion.div>

      {/* ===== Modal ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              สร้างผู้ใช้ใหม่
            </h3>
            {/* เลือกประเภท */}
            <div className="mb-4">
              <label className="mr-4">
                <input
                  type="radio"
                  name="type"
                  value="student"
                  checked={userType==='student'}
                  onChange={()=>setUserType('student')}
                /> นักศึกษา
              </label>
              <label>
                <input
                  type="radio"
                  name="type"
                  value="admin"
                  checked={userType==='admin'}
                  onChange={()=>setUserType('admin')}
                /> ผู้ดูแลระบบ
              </label>
            </div>
            {/* ฟอร์ม */}
            <div className="space-y-3">
              <div>
                <label>รหัสนักศึกษา / Username</label>
                <input
                  name="rc_ac_student_id"
                  value={form.rc_ac_student_id}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label>อีเมล</label>
                <input
                  name="rc_ac_email"
                  value={form.rc_ac_email}
                  type="email"
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label>รหัสผ่าน</label>
                <input
                  name="rc_ac_password"
                  value={form.rc_ac_password}
                  type="password"
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label>ชื่อ</label>
                  <input
                    name="rc_ac_name"
                    value={form.rc_ac_name}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div className="flex-1">
                  <label>นามสกุล</label>
                  <input
                    name="rc_ac_lastname"
                    value={form.rc_ac_lastname}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>
            </div>
            {/* ปุ่ม */}
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2">ยกเลิก</button>
              <button
                onClick={userType==='student' ? submitStudent : submitAdmin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                สร้าง
              </button>
            </div>
          </div>
        </div>
      )}


      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">แก้ไขข้อมูลผู้ใช้</h3>
            <div className="space-y-3">
              <div>
                <label>รหัสนักศึกษา / Username</label>
                <input
                  name="rc_ac_student_id"
                  value={editForm.rc_ac_student_id}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label>อีเมล</label>
                <input
                  name="rc_ac_email"
                  type="email"
                  value={editForm.rc_ac_email}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label>รหัสผ่าน (กรอกใหม่หากต้องการเปลี่ยน)</label>
                <input
                  name="rc_ac_password"
                  type="password"
                  value={editForm.rc_ac_password}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label>ชื่อ</label>
                  <input
                    name="rc_ac_name"
                    value={editForm.rc_ac_name}
                    onChange={handleEditChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div className="flex-1">
                  <label>นามสกุล</label>
                  <input
                    name="rc_ac_lastname"
                    value={editForm.rc_ac_lastname}
                    onChange={handleEditChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={closeEditModal} className="px-4 py-2">ยกเลิก</button>
              <button onClick={submitEdit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}