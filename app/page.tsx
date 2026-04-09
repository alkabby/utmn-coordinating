"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Employee = { id: string; name: string; status: string };

export default function Home() {
  const [name, setName] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/sheets")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees || []));
  }, []);

  const handleEmployee = () => {
    if (!name.trim()) return alert("اختر اسمك");
    router.push(`/employee?name=${encodeURIComponent(name)}`);
  };

  const handleAdmin = () => {
    if (adminPass === "admin123") {
      router.push("/admin");
    } else {
      alert("كلمة المرور غلط");
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          UTMN Coordinating System
        </h1>
        <p className="text-gray-400 text-center mb-8">سجّل حضورك ووقت خروجك</p>

        {!showAdmin ? (
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">اسمك</label>
              <select
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">اختر اسمك</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.name}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleEmployee}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
            >
              دخول
            </button>
            <button
              onClick={() => setShowAdmin(true)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-400 py-2 rounded-xl transition text-sm"
            >
              دخول المنسق
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">
                كلمة مرور المنسق
              </label>
              <input
                type="password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdmin()}
                placeholder="••••••••"
                className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              onClick={handleAdmin}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
            >
              دخول
            </button>
            <button
              onClick={() => { setShowAdmin(false); setAdminPass(""); }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-400 py-2 rounded-xl transition text-sm"
            >
              رجوع
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
