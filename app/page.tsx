"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Employee = { id: string; name: string; status: string };

export default function Home() {
  const [name, setName] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [savedPass, setSavedPass] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("adminPass");
    if (saved) { setSavedPass(saved); setAdminPass(saved); }
  }, []);
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
            <button
              onClick={() => {
                if (installPrompt) {
                  (installPrompt as unknown as { prompt: () => void }).prompt();
                } else {
                  setShowInstallGuide(!showInstallGuide);
                }
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-400 py-2 rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              📲 إضافة التطبيق للشاشة الرئيسية
            </button>
            {showInstallGuide && (
              <div className="bg-gray-700 rounded-xl p-4 text-gray-300 text-sm space-y-2">
                <p className="font-semibold text-white">كيف تضيف التطبيق:</p>
                <p>١. اضغط على زر المشاركة <span className="text-lg">⬆️</span> في أسفل Safari</p>
                <p>٢. اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong></p>
                <p>٣. اضغط <strong>"إضافة"</strong></p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">
                كلمة مرور المنسق
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdmin()}
                  placeholder="••••••••"
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 pl-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-lg"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdmin}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
              >
                دخول
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("adminPass", adminPass);
                  setSavedPass(adminPass);
                  alert("تم حفظ كلمة المرور");
                }}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-3 rounded-xl transition text-sm"
              >
                حفظ كلمة المرور
              </button>
            </div>
            {savedPass && (
              <p className="text-gray-500 text-xs text-center">كلمة المرور محفوظة على هذا الجهاز</p>
            )}
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
