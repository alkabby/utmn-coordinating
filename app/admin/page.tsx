"use client";
import { useEffect, useState, useCallback } from "react";

type Employee = { id: string; name: string; status: string };
type AttendanceRow = {
  employeeName: string;
  status: string;
  reason: string;
  timestamp: string;
};
type ExitRow = { employeeName: string; exitTime: string };

type EmployeeStatus = {
  name: string;
  attendance: string;
  reason: string;
  exitTime: string;
};

const TODAY = new Date().toISOString().split("T")[0];

export default function AdminPage() {
  const [date, setDate] = useState(TODAY);
  const [data, setData] = useState<EmployeeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

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
      return {
        name: emp.name,
        attendance: att?.status || "No report",
        reason: att?.reason || "",
        exitTime: ex?.exitTime || "-",
      };
    });

    setData(merged);
    setLastUpdate(new Date().toLocaleTimeString("en-US"));
    setLoading(false);
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  useEffect(() => {
    if (date !== TODAY) return;
    const interval = setInterval(() => load(date), 60000);
    return () => clearInterval(interval);
  }, [date, load]);

  const counts = {
    present: data.filter((d) => d.attendance === "Present").length,
    excused: data.filter((d) => d.attendance === "Excused").length,
    absent: data.filter((d) => d.attendance === "Absent").length,
    unknown: data.filter((d) => d.attendance === "No report").length,
    early: data.filter((d) => d.exitTime === "4:00").length,
    late: data.filter((d) => d.exitTime === "5:00").length,
  };

  const attendanceColor = (status: string) => {
    if (status === "Present") return "text-green-400";
    if (status === "Excused") return "text-yellow-400";
    if (status === "Absent") return "text-red-400";
    return "text-gray-500";
  };

  const attendanceBg = (status: string) => {
    if (status === "Present") return "bg-green-900/30";
    if (status === "Excused") return "bg-yellow-900/30";
    if (status === "Absent") return "bg-red-900/30";
    return "";
  };

  const attendanceIcon = (status: string) => {
    if (status === "Present") return "✅ Present";
    if (status === "Excused") return "🟡 Excused";
    if (status === "Absent") return "❌ Absent";
    return "❓ No report";
  };

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="bg-gray-800 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Schedule Dashboard</h1>
            {lastUpdate && (
              <p className="text-gray-500 text-xs mt-1">
                Last updated: {lastUpdate}
                {date === TODAY && " (auto-refreshes every minute)"}
              </p>
            )}
          </div>
          <button
            onClick={() => load(date)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm transition"
          >
            Refresh
          </button>
        </div>

        {/* Date picker */}
        <div className="bg-gray-800 rounded-2xl p-4">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 outline-none"
          />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-green-400 text-2xl font-bold">{counts.present}</p>
            <p className="text-gray-400 text-xs mt-1">Present</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-yellow-400 text-2xl font-bold">{counts.excused}</p>
            <p className="text-gray-400 text-xs mt-1">Excused</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-red-400 text-2xl font-bold">{counts.absent + counts.unknown}</p>
            <p className="text-gray-400 text-xs mt-1">Absent / No report</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-blue-400 text-2xl font-bold">{counts.early}</p>
            <p className="text-gray-400 text-xs mt-1">Exit 4:00</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4 text-center">
            <p className="text-orange-400 text-2xl font-bold">{counts.late}</p>
            <p className="text-gray-400 text-xs mt-1">Exit 5:00</p>
          </div>
        </div>

        {/* Employee list */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-lg mb-4">
            Employees ({data.length})
          </h2>
          {loading ? (
            <p className="text-gray-400 text-center py-8">Loading...</p>
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
                      <p className="text-gray-400 text-xs truncate mt-0.5">
                        {emp.reason}
                      </p>
                    )}
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${attendanceColor(emp.attendance)}`}>
                    {attendanceIcon(emp.attendance)}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                      emp.exitTime === "4:00"
                        ? "bg-blue-600 text-white"
                        : emp.exitTime === "5:00"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-600 text-gray-400"
                    }`}
                  >
                    {emp.exitTime === "-" ? "—" : emp.exitTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
