'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
  FiEdit2,
  FiTrash2,
  FiInfo
} from 'react-icons/fi';
import { XCircle } from 'lucide-react';
import { FaFileExcel, FaBook } from 'react-icons/fa';

export default function NewBooks({ userID }) {
  // --- States for uploaded books ---
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef(null);
  const [newInsertedIds, setNewInsertedIds] = useState([]);
  
  // --- States for existing books ---
  const [existingBooks, setExistingBooks] = useState([]);
  const [existingSearch, setExistingSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [existingPage, setExistingPage] = useState(1);
  const [existingTotal, setExistingTotal] = useState(0);
  const existingItemsPerPage = 10;

  // ช่วยแปลง ISO string เป็นเวลาไทย (Asia/Bangkok + ปฏิทินไทย)
  function formatThaiDateTime(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',       // แสดงปี พ.ศ.
      month: '2-digit',      // เดือนตัวเลข 2 หลัก
      day: '2-digit',        // วันตัวเลข 2 หลัก
      hour: '2-digit',       // ชั่วโมง 2 หลัก
      minute: '2-digit'      // นาที 2 หลัก
    });
  }

  // Debounce existingSearch (รอ 500ms ก่อน fetch)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(existingSearch.trim());
      setExistingPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [existingSearch]);

  // Fetch existing books when page or debouncedSearch เปลี่ยน
  useEffect(() => {
    async function fetchExisting() {
      try {
        // สร้าง URL ให้มีหรือไม่มี ?search= ขึ้นกับ debouncedSearch
        let url = `/api/admin/getExistingBooks?page=${existingPage}&limit=${existingItemsPerPage}`;
        if (debouncedSearch) {
          url += `&search=${encodeURIComponent(debouncedSearch)}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        setExistingBooks(json.data || []);
        setExistingTotal(json.total || 0);
      } catch (err) {
        console.error('Fetch existing books failed:', err);
        setExistingBooks([]);
        setExistingTotal(0);
      }
    }

    fetchExisting();
  }, [existingPage, debouncedSearch]);

  // ดึงข้อมูลรายการหนังสือ
  const fetchExistingBooks = async () => {
    try {
      let url = `/api/admin/getExistingBooks?page=${existingPage}&limit=${existingItemsPerPage}`;
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }
      const res  = await fetch(url);
      const json = await res.json();
      setExistingBooks(json.data || []);
      setExistingTotal(json.total || 0);
    } catch {
      setExistingBooks([]);
      setExistingTotal(0);
    }
  };

  // หา timestamp ของ updatedAt ที่ใหม่สุด
  const maxUpdatedMs = useMemo(() => {
    if (!existingBooks.length) return null;
    return Math.max(
      ...existingBooks.map(b => new Date(b.updatedAt).getTime())
    );
  }, [existingBooks]);

  // --- Handle Excel import ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return Swal.fire('ผิดพลาด', 'กรุณาอัปโหลดไฟล์ Excel (.xlsx หรือ .xls)', 'error');
    }
    try {
      const buffer = await file.arrayBuffer();
      const XLSXMod = await import('xlsx');
      const XLSX = XLSXMod.default || XLSXMod;
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      setTableData(json);
      setCurrentPage(1);
      Swal.fire('สำเร็จ', 'โหลดไฟล์ Excel เรียบร้อย', 'success');
    } catch (err) {
      console.error('Excel parse error:', err);
      Swal.fire('ผิดพลาด', `ไม่สามารถอ่านไฟล์ Excel ได้: ${err.message}`, 'error');
    }
  };

  const handleClearFile = () => {
    setTableData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveBooks = async () => {
    // 1) ตรวจว่ามีข้อมูลให้บันทึกไหม
    if (tableData.length === 0) {
      return Swal.fire('คำเตือน', 'ยังไม่มีข้อมูลให้บันทึก', 'warning');
    }
  
    // 2) ตรวจว่าแต่ละแถวมีคอลัมน์ครบตาม template หรือไม่
    const requiredCols = [
      'rc_bo_pid','rc_bo_barcode','rc_bo_bib_id','rc_bo_item_id',
      'rc_bo_call_no','rc_bo_title','rc_bo_des_lang',
      'rc_bo_des_public_year','rc_bo_des_collection_name',
      'rc_bo_des_author_name','rc_bo_des_mattype_name',
      'rc_bo_des_location','rc_bo_des_img',
      'rc_bo_des_entry_date','rc_bo_des_act_date'
    ];
    for (const row of tableData) {
      const keys = Object.keys(row);
      if (!requiredCols.every(col => keys.includes(col))) {
        return Swal.fire(
          'ผิดพลาด',
          'ไฟล์ Excel ต้องมีคอลัมน์ครบตาม template เท่านั้น',
          'error'
        );
      }
    }
  
    // 3) ยืนยันกับผู้ใช้ก่อนบันทึก
    const { isConfirmed } = await Swal.fire({
      title: 'ยืนยันการบันทึก',
      html: `คุณต้องการบันทึกข้อมูลทั้งหมด ${tableData.length} รายการ ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
    });
    if (!isConfirmed) return;
  
    // 4) ส่งข้อมูลขึ้น API
    try {
      const res = await fetch('/api/admin/saveBooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ books: tableData })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Server error');
  
      // เก็บ insertedIds
      setNewInsertedIds(json.insertedIds || []);
  
      Swal.fire('สำเร็จ', 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว', 'success');
      // สั่งโหลดข้อมูลตารางใหม่
      await fetchExistingBooks();
      // setExistingPage(1);
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message, 'error');
    }
  };
 
  const handleInfo = (id) => {
    Swal.fire('ข้อมูลหนังสือ', `คุณคลิกดูรายละเอียดหนังสือ ID: ${id}`, 'info');
  };

  const handleDeleteBook = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณแน่ใจว่าจะลบหนังสือ ID: ${id} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    });
    if (!isConfirmed) return;
  
    try {
      const res = await fetch('/api/admin/deleteBook', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
  
      Swal.fire('สำเร็จ', 'ลบข้อมูลเรียบร้อยแล้ว', 'success');
      await fetchExistingBooks();
    } catch (err) {
      console.error('handleDeleteBook error:', err);
      Swal.fire('ผิดพลาด', err.message, 'error');
    }
  };

  // --- Filter & paginate uploaded data ---
  const filteredData = tableData.filter(item =>
    Object.values(item).some(v =>
      String(v).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const uploadColumns = tableData[0] ? Object.keys(tableData[0]) : [];

  const makePageNumbers = (total) => {
    if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
    return [1,2,3,4,5,6,'...', total-1, total];
  };

   /**
 * คืน array ของเลขหน้า พร้อมจุดไข่ปลา
 * @param {number} totalPages 
 * @param {number} currentPage 
 */
   const getPageNumbers = (totalPages, currentPage) => {
    const delta = 2;  // จำนวนหน้ารอบๆ currentPage ให้แสดง
    const range = [];
    const rangeWithDots = [];
    let l = Math.max(2, currentPage - delta);
    let r = Math.min(totalPages - 1, currentPage + delta);

    // เริ่มด้วยหน้าแรก
    range.push(1);
    // เพิ่มหน้ากลาง
    for (let i = l; i <= r; i++) {
      range.push(i);
    }
    // เพิ่มหน้าสุดท้าย
    range.push(totalPages);

    // แทรก '...' เมื่อช่องว่างเกิน 1
    let last = 0;
    for (const page of range) {
      if (page - last === 2) {
        rangeWithDots.push(last + 1);
      } else if (page - last > 2) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(page);
      last = page;
    }
    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers(totalPages, currentPage);
  const existingTotalPages = Math.max(1, Math.ceil(existingTotal / existingItemsPerPage));
  const existingPageNumbers = getPageNumbers(existingTotalPages, existingPage);

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Header */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold mb-6 text-gray-800"
      >
        นำเข้าทรัพยากรใหม่
      </motion.h2>

      {/* Upload + Search (Uploaded) */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        {/* Search box with Download button next to it */}
        <div className="flex items-center space-x-2 w-full sm:w-1/2">
          {/* Search box */}
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาไฟล์..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Download Template button */}
          <a
            href="/Template.xlsx"
            download
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <FaFileExcel className="w-5 h-5 mr-2" />
            <span>ดาวน์โหลด Template</span>
          </a>
        </div>


        <div className="flex items-center space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="upload-excel"
          />
          <label htmlFor="upload-excel">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer transition">
              <FaFileExcel className="w-5 h-5" /><span>อัปโหลด Excel</span>
            </motion.div>
          </label>
          <button onClick={handleClearFile} className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
            <XCircle className="w-5 h-5" /><span>ล้างข้อมูล</span>
          </button>
          <button onClick={handleSaveBooks} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <FiChevronRight className="w-5 h-5" /><span>บันทึกข้อมูล</span>
          </button>
        </div>
      </div>

      {/* Uploaded Books Table */}
      <div className="w-full overflow-x-auto bg-white rounded-lg shadow mb-8">
        <table className="w-full table-fixed text-left">
          <thead className="bg-gray-50">
            <tr>
              {uploadColumns.map(col => (
                <th 
                  key={col}
                  title={col}
                  className="px-4 py-2 text-gray-600 font-medium truncate max-w-[150px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? currentData.map((row, idx) => (
              <tr key={idx} className="border-b last:border-0">
                {uploadColumns.map(col => (
                  <td 
                    key={col}
                    title={String(row[col])}
                    className="px-4 py-2 text-gray-700 truncate max-w-[150px]"
                  >
                    {row[col]}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={uploadColumns.length} className="px-4 py-4 text-center text-gray-500">
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination for Uploaded */}
      <div className="flex items-center justify-center space-x-2 mb-8">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}>First</button>
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}><FiChevronLeft /></button>
        {pageNumbers.map((num, idx) => num === '...' ? (
          <span key={idx} className="px-4 py-2 text-gray-500"><FiMoreHorizontal /></span>
        ) : (
          <button key={idx} onClick={() => setCurrentPage(num)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              currentPage === num
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-indigo-100'
            }`}>{num}</button>
        ))}
        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            currentPage === totalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}><FiChevronRight /></button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            currentPage === totalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}>Last</button>
      </div>

      {/* Search for Existing Books */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="relative w-full sm:w-1/3">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาในระบบ..."
            value={existingSearch}
            onChange={e => {
              const v = e.target.value;
              setExistingSearch(v);
              setExistingPage(1);
              // ถ้าลบจนเป็นค่าว่าง ให้รีเซ็ต debouncedSearch เพื่อ trigger fetch ใหม่
              if (v === '') {
                setDebouncedSearch('');
              }
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Existing Books Table */}
      <div className="overflow-x-auto bg-gray-50 rounded-lg shadow">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }} className="text-xl font-semibold mb-4 px-4 py-2 text-gray-800">
          รายการหนังสือในระบบ
        </motion.h3>
        <table className="min-w-full text-left">
          <thead className="bg-white border-t">
            <tr>
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Call NO.</th>
              <th className="px-4 py-2 font-medium">ชื่อหนังสือ</th>
              <th className="px-4 py-2 font-medium">Cover</th>
              <th className="px-4 py-2 font-medium">ชื่อผู้แต่ง</th>
              <th className="px-4 py-2 font-medium">สร้างเมื่อ</th>
              <th className="px-4 py-2 font-medium">อัปเดทเมื่อ</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {existingBooks.length > 0 ? (
              existingBooks.map((book, idx) => {
                const isNew = newInsertedIds.includes(book.id);
                const updatedTs = new Date(book.updatedAt).getTime();
                const isLatest = maxUpdatedMs === updatedTs;
                const rowClass = `border-t hover:bg-gray-100 ${
                  isLatest ? 'bg-green-50' : isNew ? 'bg-yellow-50' : 'bg-white'
                }`;

                return (
                  <tr key={book.id} className={rowClass}>
                    <td className="px-4 py-2">
                      {(existingPage - 1) * existingItemsPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-2">{book.callNo}</td>
                    <td className="px-4 py-2">{book.title}</td>
                    <td className="px-4 py-2">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt="Cover"
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div>
                          <FaBook size={40} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">{book.author}</td>
                    <td className="px-4 py-2">{formatThaiDateTime(book.createdAt)}</td>
                    <td className="px-4 py-2">{formatThaiDateTime(book.updatedAt)}</td>
                    <td className="px-4 py-2 flex space-x-2">
                      <button
                        onClick={() => handleInfo(book.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <FiInfo />
                      </button>

                      <button className="text-blue-600 hover:text-blue-800">
                        <FiEdit2 />
                      </button>

                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 />
                      </button>

                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-gray-500">
                  ไม่มีหนังสือในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination for Existing */}
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button onClick={() => setExistingPage(1)} disabled={existingPage === 1}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            existingPage === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}>First</button>
        <button onClick={() => setExistingPage(p => Math.max(p - 1, 1))} disabled={existingPage === 1}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            existingPage === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}><FiChevronLeft /></button>
        {existingPageNumbers.map((num, idx) => num === '...' ? (
          <span key={idx} className="px-4 py-2 text-gray-500"><FiMoreHorizontal /></span>
        ) : (
          <button key={idx} onClick={() => setExistingPage(num)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              existingPage === num
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-indigo-100'
            }`}>{num}</button>
        ))}
        <button onClick={() => setExistingPage(p => Math.min(p + 1, existingTotalPages))} disabled={existingPage === existingTotalPages}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            existingPage === existingTotalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}><FiChevronRight /></button>
        <button onClick={() => setExistingPage(existingTotalPages)} disabled={existingPage === existingTotalPages}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            existingPage === existingTotalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }`}>Last</button>
      </div>

    </div>
  );
}