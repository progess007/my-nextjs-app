import { FaHome, FaChalkboardTeacher, FaUserGraduate, FaUserCircle, FaCogs, FaSignOutAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

const Sidebar = ({user, setCurrentPage}) => {
  const router = useRouter();

  const handleLogout = () => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการออกจากระบบใช่หรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ใช่, ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        // ลบ token และนำผู้ใช้กลับไปยังหน้าแรก
        localStorage.removeItem("authToken");

        Swal.fire("ออกจากระบบแล้ว", "คุณได้ออกจากระบบเรียบร้อย", "success").then(() => {
          // Redirect ไปหน้าแรก
          router.push("/");
        });
      }
      else {
        Swal.fire("ออกจากระบบแล้ว", "คุณได้ออกจากระบบเรียบร้อย", "success")
      }
    });
  };

  const setting = () => {
    Swal.fire({
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการออกจากระบบใช่หรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ใช่, ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    })
  }

  const menuItems = [
    { label: 'หน้าหลัก', icon: FaHome, page: 'home' },
    { label: 'ค้นหาหนังสือ', icon: FaChalkboardTeacher, page: 'search' },
    { label: 'รายการโปรด', icon: FaUserGraduate, page: 'favorites' },
  ];

  const otherItems = [
    { label: 'Profile', icon: FaUserCircle },
    { label: 'Settings', icon: FaCogs, action: setting},
    { label: 'Logout', icon: FaSignOutAlt, action: handleLogout },
  ];

  return (
    <aside className="w-64 bg-white p-6 shadow-md">
      <div className="flex items-center space-x-3 mb-8">
        <div className="h-10 w-10 bg-indigo-500 text-white rounded-full flex items-center justify-center">
          <span className="text-xl font-bold">U</span>
        </div>
        <h1 className="text-2xl font-bold text-purple-600">UBU Library</h1>
      </div>

      <div className="mb-8">
        <h2 className="text-gray-500 text-xs font-semibold mb-2">MENU</h2>
        <ul className="space-y-4">
          {menuItems.map((item, index) => (
            <li
              key={index}
              onClick={() => setCurrentPage(item.page)} // เปลี่ยนหน้าผ่านฟังก์ชัน setCurrentPage
              className="flex items-center space-x-3 text-gray-700 hover:bg-blue-100 hover:text-indigo-500 transition-colors cursor-pointer rounded-lg px-3 py-2"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-gray-500 text-xs font-semibold mb-2">OTHER</h2>
        <ul className="space-y-4">
          {otherItems.map((item, index) => (
            <li
              key={index}
              onClick={item.action || null}
              className="flex items-center space-x-3 text-gray-700 hover:bg-blue-100 hover:text-indigo-500 transition-colors cursor-pointer rounded-lg px-3 py-2"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;