'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import { FiUpload, FiDownload, FiSave } from 'react-icons/fi';
import { Info, Edit, Trash2, Lock, Unlock } from 'lucide-react';
import { Layers, Database, UploadCloud, XCircle, CheckCircle } from 'lucide-react';

// Mapping for group labels
const groupLabels = {
  1: 'วิทยาศาสตร์ทั่วไป',
  2: 'วิทยาศาสตร์สุขภาพ',
  3: 'สังคมศาสตร์ และ มนุษยศาสตร์',
};

// Mapping for English-to-Thai validation
const englishToThai = {
  Law: 'กฎหมาย',
  Agriculture: 'เกษตรศาสตร์',
  'Philosophy Psychology': 'จิตวิทยา',
  Technology: 'เทคโนโลยี',
  Novel: 'นิยาย',
  'World History': 'ประวัติศาสตร์โลก',
  'General Medicine, Health Professions': 'แพทยศาสตร์ทั่วไป, วิชาชีพด้านสุขภาพ',
  'Language and literature': 'ภาษาศาสตร์ และ วรรณกรรม',
  'Geography, Anthropology': 'ภูมิศาสตร์ มานุษยวิทยา',
  Medicine: 'ยา',
  Science: 'วิทยาศาสตร์',
  'Political Science': 'รัฐศาสตร์',
  'Social Science': 'สังคมศาสตร์',
};

export default function NewAssociations() {
  const [inputData, setInputData] = useState('');
  const [resultData, setResultData] = useState('');
  const [tableData, setTableData] = useState([]);
  const isValid = resultData !== '';

  // --- state ใหม่สำหรับ modal & form ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [minSupport, setMinSupport] = useState('');
  const [minConfidence, setMinConfidence] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState('');           // <-- เก็บชื่อไฟล์
  const [isSubmitting, setIsSubmitting] = useState(false); // <-- ป้องกันกดซ้ำ
  const fileInputRef = useRef(null);

  // โหลด dropdown list ของกลุ่ม (rc_groupasso) เมื่อเปิด modal
  useEffect(() => {
    if (!showAddModal) return;
    fetch('/api/admin/addAssociation')    // สร้าง route นี้สำหรับ SELECT * FROM rc_groupasso
      .then(r => r.json())
      .then(data => setGroupOptions(data))
      .catch(() => Swal.fire('Error', 'ไม่สามารถโหลดกลุ่มได้', 'error'));
  }, [showAddModal]);

  // เปิด modal
  const handleAddRule = () => {
    setSelectedGroup('');
    setMinSupport('');
    setMinConfidence('');
    setFileContent(null);
    setShowAddModal(true);
  };

  // ปรับ handleFileChange ให้เก็บทั้ง content และชื่อไฟล์
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      Swal.fire('ผิดพลาด', 'อัปโหลดไฟล์ .json เท่านั้น', 'error');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setFileContent(ev.target.result);
    reader.readAsText(file);
  };

  // ปรับ handleSaveRule
  const handleSaveRule = async () => {
    // หยุดถ้ากำลัง submit อยู่แล้ว
    if (isSubmitting) return;

    // 1) validate fields เหมือนเดิม …
    if (!selectedGroup || !minSupport || !minConfidence || !fileContent) {
      return Swal.fire('คำเตือน', 'กรุณากรอกข้อมูลให้ครบทุกช่อง', 'warning');
    }

    // 2) confirm รายละเอียดก่อนบันทึก
    const groupName = groupOptions.find(g => g.id == selectedGroup)?.name || '-';
    const html = `
      <p><strong>กลุ่มความสัมพันธ์:</strong> ${groupName} (id: ${selectedGroup})</p>
      <p><strong>ชื่อไฟล์:</strong> ${fileName}</p>
      <p><strong>Minimum Support:</strong> ${minSupport}</p>
      <p><strong>Minimum Confidence:</strong> ${minConfidence}</p>
    `;
    const { isConfirmed } = await Swal.fire({
      title: 'ยืนยันรายละเอียดก่อนบันทึก',
      html,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันบันทึก',
      cancelButtonText: 'ยกเลิก',
    });
    if (!isConfirmed) return;

    // 3) ถ้า confirm แล้ว ถึงค่อย POST
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/addAssociation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroup,
          minSupport: parseFloat(minSupport),
          minConfidence: parseFloat(minConfidence),
          rules: JSON.parse(fileContent)
        })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'บันทึกไม่สำเร็จ');

      Swal.fire('สำเร็จ', 'บันทึกกฎความสัมพันธ์เรียบร้อย', 'success');
      setShowAddModal(false);
      loadGroups(); // โหลดตารางใหม่
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearFile = () => {
    setFileContent(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };


  // Parse the input text into JSON, skipping invalid rules
  const handleShowResults = () => {
    // 0. ถ้าไม่มีข้อความให้แจ้งเตือนและหยุดทำงาน
    if (!inputData.trim()) {
      Swal.fire('คำเตือน', 'กรุณากรอกข้อมูลก่อนแปลงผล', 'warning');
      return;
    }
  
    // 1. เตรียมแยกแต่ละบรรทัด
    const lines = inputData
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line);
  
    // 1.1 ถ้าไม่มีบรรทัดใดใช้งานได้ ก็ไม่ต้องทำอะไรต่อ
    if (lines.length === 0) {
      Swal.fire('คำเตือน', 'กรุณากรอกข้อมูลก่อนแปลงผล', 'warning');
      return;
    }
  
    // 2. รวมคำทั้งหมดเพื่อตรวจสอบ
    const allTerms = [];
    for (const line of lines) {
      const mainMatch = line.match(/^(\d+)\.\s*(.*?)\s*==>\s*(.*?)\s*(<conf:|$)/);
      if (!mainMatch) {
        Swal.fire('ผิดพลาด', 'รูปแบบข้อมูลไม่ถูกต้อง', 'error');
        return;
      }
      const [_, __, leftSide, rightSide] = mainMatch;
      Array.from(leftSide.matchAll(/([^=]+?)=Y/g))
        .forEach(m => allTerms.push(m[1].trim()));
      const csMatch = rightSide.match(/^(.*?)=Y\s*\d+/);
      if (csMatch) allTerms.push(csMatch[1].trim());
    }
  
    // 3. ตรวจสอบคำไม่รองรับ
    const unsupported = Array.from(new Set(
      allTerms.filter(term => !englishToThai[term])
    ));
    if (unsupported.length > 0) {
      Swal.fire(
        'ผิดพลาด',
        `คำ${unsupported.map(t => ` "${t}"`).join(',')} ไม่ถูกต้อง`,
        'error'
      );
      setResultData('');
      return;
    }
  
    // 4. แปลงเป็น JSON
    const parsed = lines.map(line => {
      const mainMatch = line.match(/^(\d+)\.\s*(.*?)\s*==>\s*(.*?)\s*(<conf:|$)/);
      const rule_number = Number(mainMatch[1]);
      const leftSide = mainMatch[2];
      const rightSide = mainMatch[3];
  
      const antecedents = Array.from(leftSide.matchAll(/([^=]+?)=Y/g))
        .map(m => m[1].trim());
      const csMatch = rightSide.match(/^(.*?)=Y\s*(\d+)/);
      const consequent = csMatch[1].trim();
      const support = Number(csMatch[2]);
  
      const confMatch = line.match(/<conf:\(([^)]+)\)>/);
      const liftMatch = line.match(/lift:\(([^)]+)\)/);
      const levMatch = line.match(/lev:\(([^)]+)\)/);
      const convMatch = line.match(/conv:\(([^)]+)\)/);
  
      return {
        rule_number,
        antecedents,
        consequent,
        support,
        confidence: confMatch ? Number(confMatch[1]) : 0,
        lift: liftMatch ? Number(liftMatch[1]) : 0,
        leverage: levMatch ? Number(levMatch[1]) : 0,
        conviction: convMatch ? Number(convMatch[1]) : 0,
      };
    });
  
    // 5. ฟอร์แมต JSON ให้ดูง่าย
    let jsonString = JSON.stringify(parsed, null, 2).replace(
      /"antecedents": \[([\s\S]*?)\]/g,
      (_, g1) => `"antecedents": [${g1.replace(/\s*\n\s*/g, ' ').trim()}]`
    );
  
    setResultData(jsonString);
    Swal.fire('สำเร็จ', 'แปลงผลข้อมูลเรียบร้อย', 'success');
  };
  
  // Download JSON
  const handleDownload = () => {
    const blob = new Blob([resultData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save placeholder
  const handleSave = () => {
    Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
  };

  // 1) Hoist loadGroups ขึ้นมาให้อยู่ในสโคปของ component
  const loadGroups = async () => {
    try {
      const res  = await fetch('/api/admin/getAssociationGroups');
      const data = await res.json();
  
      // เรียงจากวันที่เก่า → ใหม่
      data.sort((a, b) =>
        new Date(a.updateDate) - new Date(b.updateDate)
      );
  
      // แปลงเป็น rows สำหรับตาราง
      const formatted = data.map((item, idx) => ({
        id:        idx + 1,
        groupId:   item.groupId,
        revisionId:item.revisionId,      // <-- จำค่านี้ไว้
        groupName: groupLabels[item.groupId] 
                     || `กลุ่ม ${item.groupId}`,
        version:   item.version,
        status:    item.active === 1 ? 'Active' : 'Not Active',
        createdAt: item.updateDate
          ? new Date(item.updateDate).toLocaleString('th-TH')
          : '–',
      }));
  
      setTableData(formatted);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลได้', 'error');
    }
  };

  // 5) เรียกครั้งแรกตอน mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Show details modal
  const handleInfo = (groupId, version, groupName) => {
    fetch(`/api/admin/getAssociationDetails?groupId=${groupId}&revision=${version}`)
      .then(res => res.json())
      .then(rows => {
        if (!rows.length) {
          return Swal.fire('Info', 'ไม่พบรายละเอียด', 'info');
        }
  
        const headers = ['Rule JSON', 'Min Support', 'Min Confidence'];
        const headerHtml = headers
          .map(h => `<th style="padding:8px;border:1px solid #ddd">${h}</th>`)
          .join('');
        const rowsHtml = rows
          .map(r => `
            <tr>
              <td style="padding:8px;border:1px solid #ddd">
                <pre style="margin:0;white-space:pre-wrap;font-size:12px">
                  ${r.rc_as_js_rule}
                </pre>
              </td>
              <td style="padding:8px;border:1px solid #ddd">${r.rc_as_js_min_support}</td>
              <td style="padding:8px;border:1px solid #ddd">${r.rc_as_js_min_confident}</td>
            </tr>
          `).join('');
        const html = `
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        `;
  
        Swal.fire({
          title: `รายละเอียดข้อมูลของ ${groupName}`,
          html,
          width: '80%',
          heightAuto: false,
          showCloseButton: true,
          customClass: {
            popup: 'max-h-[70vh] overflow-y-auto'
          },
          didOpen: () => {
            // Scroll the popup to top when it opens
            const popup = Swal.getPopup();
            if (popup) popup.scrollTop = 0;
          }
        });
      })
      .catch(error => {
        console.error(error);
        Swal.fire('Error', 'ไม่สามารถโหลดรายละเอียดได้', 'error');
      });
  };

  // ฟังก์ชันลบเวอร์ชัน
  const handleDelete = async (groupId, revisionId, groupName, version) => {
    const { isConfirmed } = await Swal.fire({
      title: `ลบเวอร์ชัน ${version} ของ "${groupName}"?`,
      text: 'จะลบกฎความสัมพันธ์ทั้งหมดในเวอร์ชันนี้ออก',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ตกลง ลบเลย',
      cancelButtonText: 'ยกเลิก',
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(
        `/api/admin/deleteAssociation?revisionId=${revisionId}&groupId=${groupId}`,
        { method: 'DELETE' }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'ลบไม่สำเร็จ');

      Swal.fire('สำเร็จ', 'ลบเวอร์ชันเรียบร้อย', 'success');
      loadGroups();  // รีโหลดตารางใหม่
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message, 'error');
    }
  };

  const handleActivate = async (groupId, revisionId, groupName, version) => {
    const { isConfirmed } = await Swal.fire({
      title: `ตั้งเวอร์ชัน ${version} ของ "${groupName}" เป็น Active?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    });
    if (!isConfirmed) return;
  
    try {
      await fetch(
        `/api/admin/activateAssociation?groupId=${groupId}&revisionId=${revisionId}`,
        { method: 'PATCH' }
      );
      Swal.fire('สำเร็จ', 'เปลี่ยนสถานะเรียบร้อย', 'success');
      loadGroups();  // รีโหลด data ใหม่
    } catch (err) {
      Swal.fire('ผิดพลาด', err.message || 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <motion.h2
        className="text-2xl font-bold mb-6 text-gray-800"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >นำเข้ากฎความสัมพันธ์</motion.h2>

      {/* Panels */}
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl">
        {/* Left */}
        <motion.div
          className="w-full lg:w-6/12 bg-white rounded-2xl shadow-lg p-4 flex flex-col h-80"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="pb-2 border-b border-gray-200 mb-2">
            <span className="text-gray-700 font-medium">String</span>
          </div>
          <textarea
            value={inputData}
            onChange={e => setInputData(e.target.value)}
            placeholder="วางข้อความที่นี่..."
            className="flex-1 w-full resize-none border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </motion.div>

        {/* Center */}
        <div className="w-full lg:w-2/12 flex items-center justify-center">
          <motion.button
            onClick={handleShowResults}
            className="px-6 py-4 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >แสดงผลข้อมูล</motion.button>
        </div>

        {/* Right */}
        <motion.div
          className="w-full lg:w-6/12 bg-white rounded-2xl shadow-lg p-4 flex flex-col h-80"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="pb-2 border-b border-gray-200 mb-2 flex justify-between items-center">
            <span className="text-gray-700 font-medium">ผลลัพธ์</span>
            <button
              onClick={handleDownload}
              disabled={!isValid}
              className="flex items-center space-x-1 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload />
              <span>ดาวน์โหลด</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto whitespace-pre-wrap text-gray-800 p-2">
            {resultData || <span className="text-gray-400">ยังไม่มีผลลัพธ์</span>}
          </div>
        </motion.div>
      </div>

      {/* Save */}
      {/* <motion.div
        className="w-full max-w-7xl mt-6 flex justify-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 focus:ring-2 focus:ring-green-400"
        >
          <FiSave />
          <span>บันทึกข้อมูล</span>
        </button>
      </motion.div> */}

      {/* Table */}
      <motion.div
        className="w-full max-w-7xl mt-6 bg-white p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">รายการกฎความสัมพันธ์</h3>
          <button
            onClick={handleAddRule}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400"
          >เพิ่มกฎความสัมพันธ์</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 font-medium text-gray-500">ลำดับ</th>
                <th className="px-4 py-2 font-medium text-gray-500">กลุ่มความสัมพันธ์</th>
                <th className="px-4 py-2 font-medium text-gray-500">เวอร์ชัน</th>
                <th className="px-4 py-2 font-medium text-gray-500">สถานะ</th>
                <th className="px-4 py-2 font-medium text-gray-500">วันที่สร้าง</th>
                <th className="px-4 py-2 font-medium text-gray-500">เลือกกฎ</th>
                <th className="px-4 py-2 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map(row => (
                <tr
                  key={row.id}
                  className={`${row.status==='Active' ? 'bg-green-50' : 'bg-white'} border-b`}
                >
                  <td className="px-4 py-2">{row.id}</td>
                  <td className="px-4 py-2">{row.groupName}</td>
                  <td className="px-4 py-2">{row.version}</td>
                  <td className="px-4 py-2">{row.status}</td>
                  <td className="px-4 py-2">{row.createdAt}</td>

                  {/* เลือกกฎ */}
                  <td className="px-4 py-2 text-center">
                    {row.status === 'Active' ? (
                      <Lock
                        className="w-6 h-6 text-red-500 opacity-60 cursor-not-allowed"
                        title="Locked"
                      />
                    ) : (
                      <motion.button
                        onClick={() => handleActivate(row.groupId, row.revisionId, row.groupName, row.version)}
                        whileHover={{ scale: 1.2 }}
                        className="p-1 rounded-full cursor-pointer"
                      >
                        <Unlock 
                          className={`
                            w-6 h-6 flex items-center justify-center rounded
                            text-green-600 hover:text-white hover:bg-green-600 transition
                          `} 
                          title="Click to Activate" 
                        />
                      </motion.button>
                    )}
                  </td>

                  {/* Action: เอา Edit ออกเหลือ Info + Delete */}
                  <td className="px-4 py-2 flex items-center space-x-2">
                    
                    {/* Info */}
                    <button
                      onClick={() => handleInfo(row.groupId, row.revisionId, row.groupName)}
                      className={`
                        flex items-center justify-center w-8 h-8 rounded
                        text-indigo-600 hover:text-white hover:bg-indigo-600 cursor-pointer transition
                        `}
                    >
                      <Info className="w-5 h-5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (row.version === 1) return;
                        handleDelete(row.groupId, row.revisionId, row.groupName, row.version);
                      }}
                      disabled={row.version === 1}
                      title={
                        row.version === 1
                          ? 'เวอร์ชัน 1 เป็น default ไม่สามารถลบได้'
                          : 'ลบเวอร์ชันนี้'
                      }
                      className={`
                        flex items-center justify-center w-8 h-8 rounded
                        ${row.version === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:text-white hover:bg-red-600 cursor-pointer transition'}
                      `}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* --- Modal --- */}
      <AnimatePresence>
        {showAddModal && (
          // Overlay
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            {/* Modal box */}
            <motion.div
              key="modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            >
              {/* Header */}
              <div className="flex items-center space-x-2 mb-6">
                <Layers className="w-6 h-6 text-indigo-600" />
                <h3 className="text-2xl font-semibold text-gray-800">
                  กรุณาเลือกกลุ่มความสัมพันธ์
                </h3>
              </div>

              {/* Group select */}
              <div className="mb-4">
                <label className="flex items-center space-x-2 text-gray-700 font-medium mb-1">
                  <Database className="w-5 h-5" />
                  <span>กลุ่ม</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                >
                  <option value="">-- เลือกกลุ่ม --</option>
                  {Array.isArray(groupOptions) &&
                    groupOptions.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* File upload */}
              <div className="mb-4">
                <label className="flex items-center space-x-2 text-gray-700 font-medium mb-1">
                  <UploadCloud className="w-5 h-5" />
                  <span>อัปโหลดไฟล์ JSON</span>
                </label>

                {/* ซ่อน input ของไฟล์ไว้ ใช้ ref สำหรับล้างค่า */}
                <input
                  id="json-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />

                <div
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg transition
                    ${fileContent 
                      ? 'bg-green-50 border border-green-400' 
                      : 'border border-dashed border-gray-300 hover:border-indigo-500'}
                  `}
                >
                  {fileContent ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <UploadCloud className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 truncate">{fileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <label
                      htmlFor="json-upload"
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <FiUpload className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-600">Choose JSON file</span>
                    </label>
                  )}
                </div>
              </div>


              {/* Min Support & Confidence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Minimum Support', value: minSupport, onChange: setMinSupport },
                  { label: 'Minimum Confidence', value: minConfidence, onChange: setMinConfidence },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block text-gray-700 font-medium mb-1">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <motion.button
                  onClick={() => setShowAddModal(false)}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  <XCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">ยกเลิก</span>
                </motion.button>
                <motion.button
                  onClick={handleSaveRule}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center px-4 py-2 rounded-lg 
                    ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} 
                    text-white`}
                >
                  <CheckCircle className="w-5 h-5" />
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}