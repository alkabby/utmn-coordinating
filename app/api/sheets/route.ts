import { google } from "googleapis";
import { NextResponse } from "next/server";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

async function getSheets() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT!;
  const credentials = JSON.parse(raw);
  credentials.private_key = credentials.private_key
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sheets = await getSheets();

    // جلب حضور يوم معين
    const attendanceDate = searchParams.get("attendanceDate");
    if (attendanceDate) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Attendance!A2:E500",
      });
      const rows = res.data.values || [];
      const attendance = rows
        .filter((row) => row[0] === attendanceDate)
        .map((row) => ({
          date: row[0],
          employeeName: row[1],
          status: row[2],
          reason: row[3] || "",
          timestamp: row[4] || "",
        }));
      return NextResponse.json({ attendance });
    }

    // جلب وقت خروج يوم معين
    const scheduleDate = searchParams.get("scheduleDate");
    if (scheduleDate) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Schedule!A2:E500",
      });
      const rows = res.data.values || [];
      const schedule = rows
        .filter((row) => row[0] === scheduleDate)
        .map((row) => ({ employeeName: row[2], exitTime: row[4] }));
      return NextResponse.json({ schedule });
    }

    // جلب ورديات موظف معين
    const employeeName = searchParams.get("employee");
    if (employeeName) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Schedule!A2:E500",
      });
      const rows = res.data.values || [];
      const schedule = rows
        .filter((row) => row[2] === employeeName)
        .map((row) => ({ date: row[0], exitTime: row[4] }));
      return NextResponse.json({ schedule });
    }

    // جلب قائمة الموظفين
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Employees!A2:C100",
    });
    const rows = res.data.values || [];
    const employees = rows.map((row) => ({
      id: row[0],
      name: row[1],
      status: row[2],
    }));
    return NextResponse.json({ employees });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sheets = await getSheets();

    // تسجيل الحضور (إضافة أو تعديل)
    if (body.action === "setAttendance") {
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Attendance!A2:E500",
      });
      const rows = existing.data.values || [];
      const rowIndex = rows.findIndex(
        (r) => r[0] === body.date && r[1] === body.employeeName
      );
      const values = [[body.date, body.employeeName, body.status, body.reason || "", String(Date.now())]];
      if (rowIndex !== -1) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Attendance!A${rowIndex + 2}:E${rowIndex + 2}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values },
        });
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: "Attendance!A:E",
          valueInputOption: "USER_ENTERED",
          requestBody: { values },
        });
      }
    }

    // تحديد أو تعديل وقت الخروج
    if (body.action === "setExitTime") {
      const empRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Employees!A2:C100",
      });
      const empRows = empRes.data.values || [];
      const emp = empRows.find((r) => r[1] === body.employeeName);

      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Schedule!A2:E500",
      });
      const rows = existing.data.values || [];
      const rowIndex = rows.findIndex(
        (r) => r[0] === body.date && r[2] === body.employeeName
      );
      const group = body.exitTime === "4:00" ? "A" : "B";
      const values = [[body.date, emp?.[0] || "", body.employeeName, group, body.exitTime]];
      if (rowIndex !== -1) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Schedule!A${rowIndex + 2}:E${rowIndex + 2}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values },
        });
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: "Schedule!A:E",
          valueInputOption: "USER_ENTERED",
          requestBody: { values },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
