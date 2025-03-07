"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Activity, Users, DollarSign, BarChart, Edit, Trash2 } from "lucide-react";

const chartData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 600 },
  { name: "Mar", value: 800 },
  { name: "Apr", value: 1000 },
  { name: "May", value: 1200 },
];

export default function HomeAdmin() {
  // State สำหรับข้อมูล accounts และ loading
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับ pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/admin/getAccounts");
        const data = await res.json();
        if (!data.error) {
          setAccounts(data);
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

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
        Admin Dashboard
      </motion.h2>

      {/* Card Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Users",
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

      {/* Chart Section */}
      <motion.div
        className="mt-10 bg-white p-4 sm:p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-gray-700 font-semibold mb-4">Monthly Sales</h3>
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Table Section with Pagination */}
      <motion.div
        className="mt-10 bg-white p-4 sm:p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 font-medium text-gray-500">Id</th>
                <th className="px-4 py-2 font-medium text-gray-500">Student ID</th>
                <th className="px-4 py-2 font-medium text-gray-500">ชื่อ - นามสกุล</th>
                <th className="px-4 py-2 font-medium text-gray-500">Email</th>
                <th className="px-4 py-2 font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 font-medium text-gray-500">Create Date</th>
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
                    <td className="px-4 py-2">{acc.rc_ac_create_date}</td>
                    <td className="px-4 py-2 flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
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
    </div>
  );
}