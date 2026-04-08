"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Shift = { date: string; exitTime: string };

const TODAY = new Date().toISOString().split("T")[0];

function EmployeeContent() {
  const params = useSearchParams();
  const name = params.get("name") || "";

  const [attendance, setAttendance] = useState<"Present" | "Excused" | "Absent" | "">("");
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
    if (!attendance) return alert("Please select your status");
    if ((attendance === "Excused" || attendance === "Absent") && !reason.trim())
      return alert("Please provide a reason");
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
    showMsg("Attendance saved");
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
    showMsg("Exit time saved");
  };

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto space-y-4">

        {/* Header */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <p className="text-gray-400 text-sm">Welcome</p>
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          <p className="text-gray-500 text-xs mt-1">{TODAY}</p>
        </div>

        {/* Attendance */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-lg mb-4">
            Today&apos;s Attendance
            {attendanceSaved && (
              <span className="text-xs text-green-400 font-normal ml-2">
                (saved — you can update)
              </span>
            )}
          </h2>
          <div className="flex gap-2 mb-3">
            {(["Present", "Excused", "Absent"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setAttendance(s); setReason(""); }}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
                  attendance === s
                    ? s === "Present"
                      ? "bg-green-600 text-white"
                      : s === "Excused"
                      ? "bg-yellow-600 text-white"
                      : "bg-red-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {s === "Present" ? "✅ Present" : s === "Excused" ? "🟡 Excused" : "❌ Absent"}
              </button>
            ))}
          </div>
          {(attendance === "Excused" || attendance === "Absent") && (
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-yellow-500"
            />
          )}
          <button
            onClick={saveAttendance}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
          >
            {attendanceSaved ? "Update Attendance" : "Save Attendance"}
          </button>
        </div>

        {/* Exit Time */}
        <div className="bg-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-lg mb-1">Exit Time</h2>
          {exitSaved ? (
            <p className="text-gray-400 text-xs mb-3">
              Current:{" "}
              <span className={`font-bold ${exitTime === "4:00" ? "text-blue-400" : "text-orange-400"}`}>
                {exitTime}
              </span>
              {" "}— you can change anytime
            </p>
          ) : (
            <p className="text-gray-500 text-xs mb-3">Select your exit time for today</p>
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

        {/* Confirmation message */}
        {msg && (
          <div className="bg-green-800 text-green-200 text-center py-3 rounded-xl font-bold">
            {msg}
          </div>
        )}

        {/* Past shifts */}
        {schedule.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-5">
            <h2 className="text-white font-bold text-lg mb-4">Past Shifts</h2>
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
          Loading...
        </div>
      }
    >
      <EmployeeContent />
    </Suspense>
  );
}
