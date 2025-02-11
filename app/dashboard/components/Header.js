import { FaHome, FaBookOpen, FaInfoCircle } from 'react-icons/fa';
import Image from "next/image";

const Header = ({ user }) => {
  return (
    <header className="bg-white shadow-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
        <div className="relative">
            <input
            type="text"
            placeholder="Search..."
            className="bg-gray-100 rounded-full px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-gray-500">
            <FaHome className="h-5 w-5" />
            </span>
        </div>
        </div>
        <div className="flex items-center space-x-6">
        <button className="relative">
            <FaInfoCircle className="h-6 w-6 text-gray-600" />
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">1</span>
        </button>
        <FaBookOpen className="h-6 w-6 text-gray-600" />
        <div className="flex items-center space-x-2">
            <div className="text-right">
            <h4 className="text-sm font-semibold text-purple-600">
                {user.rc_ac_name} {user.rc_ac_lastname}
            </h4>
            <p className="text-xs text-gray-500">{user.rc_ac_permissions === 1 ? "ผู้ดูแลระบบ" : "ผู้ใช้งานทั่วไป"}</p>
            </div>
            <div className="h-10 w-10 bg-red-500 text-white rounded-full flex items-center justify-center">
            K
            </div>
        </div>
        </div>
    </header>
  );
};

export default Header;
