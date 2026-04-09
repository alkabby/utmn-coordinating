"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Shift = { date: string; exitTime: string };

const TODAY = new Date().toISOString().split("T")[0];

function EmployeeContent() {
  const params = useSearchParams();
  const name = params.get("name") || "";

  const [attendance, setAttendance] = useState<"حاضر" | "مستأذن" | "غائب" | "">("");
  const [reason, setReason] = useState("");
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  const [exitTime, setExitTime] = useState<"4:00" | "5:00" | "">("");
  const [exitSaved, setExitSaved] = useState(false);

  const [schedule, setSchedule] = useState<Shift[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!name) return;

    fetch(`/api/sheets?attendanceDate=${TODAY}`)
      .then((r) => r.json())
      .then((d) => {
        const mine = (d.attendance || []).find(
          (a: { employeeName: string; status: string; reason: string }) =>
            a.employeeName === name
        );
        if (mine) {
          setAttendance(mine.status);
          setReason(mine.reason || "");
          setAttendanceSaved(true);
        }
      });

    fetch(`/api/sheets?scheduleDate=${TODAY}`)
      .then((r) => r.json())
      .then((d) => {
        const mine = (d.schedule || []).find(
          (s: { employeeName: string; exitTime: string }) =>
            s.employeeName === name
        );
        if (mine) {
          setExitTime(mine.exitTime);
          setExitSaved(true);
        }
      });

    fetch(`/api/sheets?employee=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((d) => setSchedule(d.schedule || []));
  }, [name]);

  const saveAttendance = async () => {
    if (!attendance) return alert("اختر حالتك");
    if ((attendance === "مستأذن" || attendance === "غائب") && !reason.trim())
      return alert("اكتب سبب الاستئذان");
    await fetch("/api/sheets", {
      method: "POST",
      body: JSON.stringify({
        action: "setAttendance",
        employeeName: name,
        date: TODAY,
        status: attendance,
        reason,
      }),
    });
    setAttendanceSaved(true);
    showMsg("تم تسجيل الحضور");
  };

  const saveExitTime = async (time: "4:00" | "5:00") => {
    setExitTime(time);
    await fetch("/api/sheets", {
      method: "POST",
      body: JSON.stringify({
        action: "setExitTime",
        employeeName: name,
        date: TODAY,
        exitTime: time,
      }),
    });
    setExitSaved(true);
    showMsg("تم تسجيل وقت الخروج");
  };

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <main className="min-h-screen bg-gray-900 p-4" dir="rtl">
      <div className="max-w-md mx-auto space-y-4">

        {/* الهيدر */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <p className="text-gray-400 text-sm">مرحبا</p>
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          <p className="text-gray-500 text-xs mt-1">{TODAY}</p>
        </div>

        {/* تسجيل الحضور */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-lg mb-4">
            حضور اليوم
            {attendanceSaved && (
              <span className="text-xs text-green-400 font-normal mr-2">
                (مسجّل - يمكنك التعديل)
              </span>
            )}
          </h2>
          <div className="flex gap-2 mb-3">
            {(["حاضر", "مستأذن", "غائب"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setAttendance(s); setReason(""); }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
                  attendance === s
                    ? s === "حاضر"
                      ? "bg-green-600 text-white"
                      : s === "مستأذن"
                      ? "bg-yellow-600 text-white"
                      : "bg-red-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {s === "حاضر" ? "✅ حاضر" : s === "مستأذن" ? "🟡 مستأذن" : "❌ غائب"}
              </button>
            ))}
          </div>
          {(attendance === "مستأذن" || attendance === "غائب") && (
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب السبب..."
              className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-yellow-500"
            />
          )}
          <button
            onClick={saveAttendance}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
          >
            {attendanceSaved ? "تعديل الحضور" : "تسجيل الحضور"}
          </button>
        </div>

        {/* وقت الخروج */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-lg mb-1">وقت الخروج</h2>
          {exitSaved ? (
            <p className="text-gray-400 text-xs mb-3">
              وقتك الحالي:{" "}
              <span className={`font-bold ${exitTime === "4:00" ? "text-blue-400" : "text-orange-400"}`}>
                {exitTime}
              </span>
              {" "}— يمكنك التغيير في أي وقت
            </p>
          ) : (
            <p className="text-gray-500 text-xs mb-3">اختر وقت خروجك لليوم</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => saveExitTime("4:00")}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition ${
                exitTime === "4:00"
                  ? "bg-blue-600 text-white ring-2 ring-blue-400"
                  : "bg-gray-700 text-gray-300 hover:bg-blue-700 hover:text-white"
              }`}
            >
              4:00
            </button>
            <button
              onClick={() => saveExitTime("5:00")}
              className={`flex-1 py-4 rounded-xl font-bold text-lg transition ${
                exitTime === "5:00"
                  ? "bg-orange-600 text-white ring-2 ring-orange-400"
                  : "bg-gray-700 text-gray-300 hover:bg-orange-700 hover:text-white"
              }`}
            >
              5:00
            </button>
          </div>
        </div>

        {/* رسالة تأكيد */}
        {msg && (
          <div className="bg-green-800 text-green-200 text-center py-3 rounded-xl font-bold">
            {msg}
          </div>
        )}

        {/* الورديات السابقة */}
        {schedule.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-5">
            <h2 className="text-white font-bold text-lg mb-4">ورديات سابقة</h2>
            <div className="flex flex-col gap-2">
              {schedule
                .sort((a, b) => (a.date > b.date ? -1 : 1))
                .map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-gray-700 rounded-xl px-4 py-3"
                  >
                    <span className="text-gray-300 text-sm">{s.date}</span>
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-lg ${
                        s.exitTime === "4:00"
                          ? "bg-blue-600 text-white"
                          : "bg-orange-600 text-white"
                      }`}
                    >
                      {s.exitTime}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

export default function EmployeePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
          جاري التحميل...
        </div>
      }
    >
      <EmployeeContent />
    </Suspense>
  );
}
