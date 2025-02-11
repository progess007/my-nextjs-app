'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function VerifyPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);

  useEffect(() => {
    // ดึง token จาก URL เฉพาะใน Client-Side
    const searchParams = new URLSearchParams(window.location.search);
    const tokenFromURL = searchParams.get('token');
    setToken(tokenFromURL);

    if (!tokenFromURL) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "Token ไม่ถูกต้อง",
        icon: "error",
        confirmButtonText: "กลับไปหน้าแรก",
      }).then(() => {
        router.push("/");
      });
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify?token=${token}`);
        const result = await response.json();

        if (response.ok && result.success) {
          Swal.fire({
            title: "ยืนยันตัวตนสำเร็จ!",
            text: "คุณสามารถใช้งานระบบได้แล้ว",
            icon: "success",
            confirmButtonText: "กลับไปหน้าแรก",
          }).then(() => {
            router.push("/");
          });
        } else {
          Swal.fire({
            title: "ยืนยันตัวตนล้มเหลว",
            text: result.message || "Token ไม่ถูกต้องหรือหมดอายุ",
            icon: "error",
            confirmButtonText: "กลับไปหน้าแรก",
          }).then(() => {
            router.push("/");
          });
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถยืนยันตัวตนได้ กรุณาลองใหม่อีกครั้ง",
          icon: "error",
          confirmButtonText: "กลับไปหน้าแรก",
        }).then(() => {
          router.push("/");
        });
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <h2 className="text-xl font-bold text-gray-700">กำลังตรวจสอบการยืนยันตัวตน...</h2>
    </div>
  );
}
