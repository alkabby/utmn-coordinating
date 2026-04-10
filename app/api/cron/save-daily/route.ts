import { google } from "googleapis";
import { NextResponse } from "next/server";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

async function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!);
  credentials.private_key = credentials.private_key.replace(/\\n/g, "\n").replace(/\r/g, "");
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const sheets = await getSheets();

    const [empRes, attRes, exitRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Employees!A2:C100" }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Attendance!A2:E500" }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Schedule!A2:E500" }),
    ]);

    const employees = empRes.data.values || [];
    const attendance = (attRes.data.values || []).filter((r) => r[0] === today);
    const exits = (exitRes.data.values || []).filter((r) => r[0] === today);

    const records = employees.map((emp) => {
      const att = attendance.find((a) => a[1] === emp[1]);
      const ex = exits.find((e) => e[2] === emp[1]);
      let time = "";
      if (att?.[4]) {
        const t = new Date(Number(att[4]));
        time = `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`;
      }
      return [today, emp[1], att?.[2] || "لم يبلّغ", att?.[3] || "", ex?.[4] || "-", time];
    });

    // حذف سجلات نفس اليوم وإعادة الكتابة
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Daily_Records!A2:F1000",
    });
    const existingRows = (existing.data.values || []).filter((r) => r[0] !== today);
    await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: "Daily_Records!A2:F1000" });
    const allRows = [...existingRows, ...records];
    if (allRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: "Daily_Records!A2",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: allRows },
      });
    }

    return NextResponse.json({ success: true, date: today, saved: records.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
