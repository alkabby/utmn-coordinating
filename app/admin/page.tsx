"use client";
import { useEffect, useState, useCallback } from "react";

type Employee = { id: string; name: string; status: string };
type AttendanceRow = { employeeName: string; status: string; reason: string; timestamp: string };
type ExitRow = { employeeName: string; exitTime: string };
type EmployeeStatus = { name: string; attendance: string; reason: string; exitTime: string; time: string };

const TODAY = new Date().toISOString().split("T")[0];

type RecordRow = { employeeName: string; attendance: string; reason: string; exitTime: string; time: string };

export default function AdminPage() {
  const [tab, setTab] = useState<"live" | "records">("live");
  const [date, setDate] = useState(TODAY);
  const [data, setData] = useState<EmployeeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [recordDate, setRecordDate] = useState(TODAY);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const load = useCallback(async (d: string) => {
    setLoading(true);
    const [empRes, attRes, exitRes] = await Promise.all([
      fetch("/api/sheets").then((r) => r.json()),
      fetch(`/api/sheets?attendanceDate=${d}`).then((r) => r.json()),
      fetch(`/api/sheets?scheduleDate=${d}`).then((r) => r.json()),
    ]);

    const employees: Employee[] = empRes.employees || [];
    const attendance: AttendanceRow[] = attRes.attendance || [];
    const exits: ExitRow[] = exitRes.schedule || [];

    const merged: EmployeeStatus[] = employees.map((emp) => {
      const att = attendance.find((a) => a.employeeName === emp.name);
      const ex = exits.find((e) => e.employeeName === emp.name);
      let time = "";
      if (att?.timestamp) {
        const t = new Date(Number(att.timestamp));
        time = `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`;
      }
      return {
        name: emp.name,
        attendance: att?.status || "لم يبلّغ",
        reason: att?.reason || "",
        exitTime: ex?.exitTime || "-",
        time,
      };
    });

    setData(merged);
    setLastUpdate(new Date().toLocaleTimeString("ar-SA"));
    setLoading(false);
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  useEffect(() => {
    if (date !== TODAY) return;
    const interval = setInterval(() => load(date), 60000);
    return () => clearInterval(interval);
  }, [date, load]);

  const loadRecords = useCallback(async (d: string) => {
    setRecordsLoading(true);
    const res = await fetch(`/api/sheets?recordDate=${d}`).then((r) => r.json());
    setRecords(res.records || []);
    setRecordsLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "records") loadRecords(recordDate);
  }, [tab, recordDate, loadRecords]);

  const counts = {
    present: data.filter((d) => d.attendance === "حاضر").length,
    excused: data.filter((d) => d.attendance === "مستأذن").length,
    absent: data.filter((d) => d.attendance === "غائب").length,
    unknown: data.filter((d) => d.attendance === "لم يبلّغ").length,
    early: data.filter((d) => d.exitTime === "4:00").length,
    late: data.filter((d) => d.exitTime === "5:00").length,
  };

  const attendanceColor = (s: string) => {
    if (s === "حاضر") return "text-green-400";
    if (s === "مستأذن") return "text-yellow-400";
    if (s === "غائب") return "text-red-400";
    return "text-gray-500";
  };

  const attendanceBg = (s: string) => {
    if (s === "حاضر") return "bg-green-900/30";
    if (s === "مستأذن") return "bg-yellow-900/30";
    if (s === "غائب") return "bg-red-900/30";
    return "";
  };

  const attendanceIcon = (s: string) => {
    if (s === "حاضر") return "✅ حاضر";
    if (s === "مستأذن") return "🟡 مستأذن";
    if (s === "غائب") return "❌ غائب";
    return "❓ لم يبلّغ";
  };

  return (
    <main className="min-h-screen bg-gray-900 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* تبويبين */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("live")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${tab === "live" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            سجل اليوم
          </button>
          <button
            onClick={() => setTab("records")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${tab === "records" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            السجلات السابقة
          </button>
        </div>

        {tab === "records" ? (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-2xl p-5 flex items-center gap-3">
              <label className="text-gray-400 text-sm shrink-0">التاريخ</label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="bg-gray-800 rounded-2xl p-5">
              <h2 className="text-white font-bold text-lg mb-4">سجل {recordDate}</h2>
              {recordsLoading ? (
                <p className="text-gray-400 text-center py-8">جاري التحميل...</p>
              ) : records.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا يوجد سجل لهذا اليوم</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {records.map((r, i) => (
                    <div key={i} className={`rounded-xl px-4 py-3 flex items-center gap-3 bg-gray-700 ${
                      r.attendance === "حاضر" ? "bg-green-900/30" : r.attendance === "مستأذن" ? "bg-yellow-900/30" : r.attendance === "غائب" ? "bg-red-900/30" : ""
                    }`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">{r.employeeName}</p>
                        {r.reason && <p className="text-gray-400 text-xs mt-0.5">{r.reason}</p>}
                        {r.time && <p className="text-gray-500 text-xs mt-0.5">سجّل حضور الساعة {r.time}</p>}
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${
                        r.attendance === "حاضر" ? "text-green-400" : r.attendance === "مستأذن" ? "text-yellow-400" : r.attendance === "غائب" ? "text-red-400" : "text-gray-500"
                      }`}>
                        {r.attendance === "حاضر" ? "✅ حاضر" : r.attendance === "مستأذن" ? "🟡 مستأذن" : r.attendance === "غائب" ? "❌ غائب" : "❓ لم يبلّغ"}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                        r.exitTime === "4:00" ? "bg-blue-600 text-white" : r.exitTime === "5:00" ? "bg-orange-600 text-white" : "bg-gray-600 text-gray-400"
                      }`}>
                        {r.exitTime === "-" ? "—" : r.exitTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
        <div className="bg-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-white">لوحة المنسق</h1>
              {lastUpdate && (
                <p className="text-gray-500 text-xs mt-1">
                  آخر تحديث: {lastUpdate}
                  {date === TODAY && " (يتحدث تلقائياً)"}
                </p>
              )}
            </div>
            <button
              onClick={() => load(date)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm transition"
            >
              تحديث
            </button>
          </div>
          <button
            onClick={async () => {
              setSaving(true);
              await fetch("/api/sheets", {
                method: "POST",
                body: JSON.stringify({
                  action: "saveDailyRecord",
                  date,
                  records: data.map((e) => ({
                    date,
                    employeeName: e.name,
                    attendance: e.attendance,
                    reason: e.reason,
                    exitTime: e.exitTime,
                    time: e.time,
                  })),
                }),
              });
              setSaving(false);
              setSaveMsg("تم حفظ سجل اليوم ✅");
              setTimeout(() => setSaveMsg(""), 3000);
            }}
            className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition"
          >
            {saving ? "جاري الحفظ..." : "حفظ سجل اليوم"}
          </button>
          {saveMsg && (
            <p className="text-green-400 text-center text-sm mt-2">{saveMsg}</p>
          )}
        </div>

        <div className="bg-gray-800 rounded-2xl p-5 flex items-center gap-3">
          <label className="text-gray-400 text-sm shrink-0">التاريخ</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {date !== TODAY && (
            <button
              onClick={() => setDate(TODAY)}
              className="shrink-0 text-xs text-blue-400 hover:text-blue-300 transition"
            >
              اليوم
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-green-400 text-2xl font-bold">{counts.present}</p>
            <p className="text-gray-400 text-xs mt-1">حاضر</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-yellow-400 text-2xl font-bold">{counts.excused}</p>
            <p className="text-gray-400 text-xs mt-1">مستأذن</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-red-400 text-2xl font-bold">{counts.absent + counts.unknown}</p>
            <p className="text-gray-400 text-xs mt-1">غائب / لم يبلّغ</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-blue-400 text-2xl font-bold">{counts.early}</p>
            <p className="text-gray-400 text-xs mt-1">خروج 4:00</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-orange-400 text-2xl font-bold">{counts.late}</p>
            <p className="text-gray-400 text-xs mt-1">خروج 5:00</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-lg mb-4">الموظفون ({data.length})</h2>
          {loading ? (
            <p className="text-gray-400 text-center py-8">جاري التحميل...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.map((emp) => (
                <div
                  key={emp.name}
                  className={`rounded-xl px-4 py-3 flex items-center gap-3 bg-gray-700 ${attendanceBg(emp.attendance)}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{emp.name}</p>
                    {emp.reason && (
                      <p className="text-gray-400 text-xs truncate mt-0.5">{emp.reason}</p>
                    )}
                    {emp.time && (
                      <p className="text-gray-500 text-xs mt-0.5">سجّل حضور الساعة {emp.time}</p>
                    )}
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${attendanceColor(emp.attendance)}`}>
                    {attendanceIcon(emp.attendance)}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                    emp.exitTime === "4:00" ? "bg-blue-600 text-white"
                    : emp.exitTime === "5:00" ? "bg-orange-600 text-white"
                    : "bg-gray-600 text-gray-400"
                  }`}>
                    {emp.exitTime === "-" ? "—" : emp.exitTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

          </div>
        )}

      </div>
    </main>
  );
}
