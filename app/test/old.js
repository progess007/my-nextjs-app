"use client";

import { useState, useEffect } from "react";

export default function Recommendations() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetch("/api/weighted-books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error("Error loading recommendations:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">📚 หนังสือแนะนำ</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.length === 0 ? (
          <p className="text-center text-gray-500">ไม่มีข้อมูลแนะนำ</p>
        ) : (
          books.map((book, index) => (
            <div key={`${book.bookID}-${index}`} className="bg-white rounded-xl shadow-lg p-4">
              <h2 className="text-lg font-semibold">📖 ID: {book.bookID}</h2>
              <p className="text-sm text-gray-500">⭐ เรตติ้ง: {book.rating}</p>
              <p className="text-sm text-gray-500">📊 ค่าถ่วงน้ำหนัก: {book.weight.toFixed(2)}</p>
              <p className="text-sm text-gray-500">🎲 Probability: {(book.probability * 100).toFixed(2)}%</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
