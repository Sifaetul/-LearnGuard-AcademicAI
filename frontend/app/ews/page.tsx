"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

type Student = {
  id: string;
  name: string;
  email: string;
  attendance: number;
  quiz_avg: number;
  late_submissions: number;
  cgpa: number;
  dept: string;
  semester: number;
  section: string;
  phone: string;
  last_seen: string;
};

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";
type StudentWithRisk = Student & { score: number; level: RiskLevel; alerts: string[] };

const DEMO_STUDENTS: Student[] = [
  { id: "S001", name: "Rafiq Ahmed", email: "rafiq@student.edu", attendance: 45, quiz_avg: 38, late_submissions: 5, cgpa: 2.1, dept: "CSE", semester: 4, section: "PC-C", phone: "017XXXXXXXX", last_seen: "3 days ago" },
  { id: "S002", name: "Priya Das", email: "priya@student.edu", attendance: 92, quiz_avg: 78, late_submissions: 0, cgpa: 3.7, dept: "CSE", semester: 4, section: "PC-C", phone: "018XXXXXXXX", last_seen: "Today" },
  { id: "S003", name: "Mehedi Hasan", email: "mehedi@student.edu", attendance: 67, quiz_avg: 55, late_submissions: 2, cgpa: 2.8, dept: "EEE", semester: 6, section: "A", phone: "019XXXXXXXX", last_seen: "Yesterday" },
  { id: "S004", name: "Fatima Khanam", email: "fatima@student.edu", attendance: 30, quiz_avg: 25, late_submissions: 7, cgpa: 1.8, dept: "BBA", semester: 2, section: "B", phone: "015XXXXXXXX", last_seen: "1 week ago" },
  { id: "S005", name: "Tanvir Islam", email: "tanvir@student.edu", attendance: 88, quiz_avg: 82, late_submissions: 1, cgpa: 3.5, dept: "CSE", semester: 4, section: "PC-C", phone: "016XXXXXXXX", last_seen: "Today" },
  { id: "S006", name: "Nusrat Jahan", email: "nusrat@student.edu", attendance: 55, quiz_avg: 45, late_submissions: 4, cgpa: 2.4, dept: "BBA", semester: 3, section: "A", phone: "017XXXXXXXX", last_seen: "2 days ago" },
  { id: "S007", name: "Sabbir Rahman", email: "sabbir@student.edu", attendance: 78, quiz_avg: 70, late_submissions: 1, cgpa: 3.1, dept: "EEE", semester: 5, section: "B", phone: "018XXXXXXXX", last_seen: "Today" },
  { id: "S008", name: "Ayesha Siddiqua", email: "ayesha@student.edu", attendance: 40, quiz_avg: 32, late_submissions: 6, cgpa: 2.0, dept: "LAW", semester: 2, section: "A", phone: "019XXXXXXXX", last_seen: "5 days ago" },
];

function numberValue(...values: unknown[]) {
  const found = values.find((value) => value !== undefined && value !== null && value !== "");
  const parsed = Number(found);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringValue(...values: unknown[]) {
  const found = values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
  return found ? String(found) : "";
}

function normalizeStudent(student: any): Student {
  const id = stringValue(student.id, student.student_id, student.roll, student.studentId);
  const fallback = DEMO_STUDENTS.find((item) => item.id === id);

  return {
    id: id || fallback?.id || "N/A",
    name: stringValue(student.name, student.student_name, student.full_name, fallback?.name, "Unknown Student"),
    email: stringValue(student.email, student.student_email, fallback?.email),
    attendance: numberValue(student.attendance, student.attendance_percentage, student.attendanceRate, fallback?.attendance),
    quiz_avg: numberValue(student.quiz_avg, student.quiz, student.quiz_average, student.quizAvg, fallback?.quiz_avg),
    late_submissions: numberValue(student.late_submissions, student.late, student.lateSubmission, fallback?.late_submissions),
    cgpa: numberValue(student.cgpa, student.gpa, student.cgpa_avg, student.result, fallback?.cgpa),
    dept: stringValue(student.dept, student.department, student.program, fallback?.dept, "CSE"),
    semester: numberValue(student.semester, student.sem, student.current_semester, fallback?.semester),
    section: stringValue(student.section, student.batch_section, student.sec, fallback?.section, "N/A"),
    phone: stringValue(student.phone, student.mobile, fallback?.phone, "N/A"),
    last_seen: stringValue(student.last_seen, student.last_activity, fallback?.last_seen, "N/A"),
  };
}

function calcRisk(student: Student): StudentWithRisk {
  const attendanceRisk = (100 - student.attendance) * 0.36;
  const quizRisk = (100 - student.quiz_avg) * 0.3;
  const cgpaRisk = Math.max(0, (4 - student.cgpa) / 4) * 24;
  const lateRisk = Math.min(student.late_submissions * 4, 16);
  const score = Math.min(100, Math.max(0, Math.round(attendanceRisk + quizRisk + cgpaRisk + lateRisk)));

  const alerts = [
    student.attendance < 60 ? `Attendance low: ${student.attendance}%` : "",
    student.quiz_avg < 50 ? `Quiz performance weak: ${student.quiz_avg}/100` : "",
    student.cgpa < 2.5 ? `CGPA warning: ${student.cgpa}` : "",
    student.late_submissions > 3 ? `${student.late_submissions} late submissions` : "",
  ].filter(Boolean);

  return {
    ...student,
    score,
    alerts,
    level: score >= 60 ? "HIGH" : score >= 36 ? "MEDIUM" : "LOW",
  };
}

function style(level: RiskLevel) {
  if (level === "HIGH") return { dot: "bg-red-500", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-600 text-white" };
  if (level === "MEDIUM") return { dot: "bg-yellow-500", bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-500 text-white" };
  return { dot: "bg-green-500", bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-600 text-white" };
}

export default function EWSPage() {
  const [rawStudents, setRawStudents] = useState<Student[]>(DEMO_STUDENTS);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | RiskLevel>("ALL");
  const [tab, setTab] = useState<"details" | "analysis" | "meeting">("details");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [sendingMail, setSendingMail] = useState(false);
  const [mailStatus, setMailStatus] = useState("");
  const [meeting, setMeeting] = useState({ date: "", time: "", place: "", message: "" });

  useEffect(() => {
    async function loadStudents() {
      try {
        const response = await axios.get(`${API}/api/ews/students`);
        if (Array.isArray(response.data?.students) && response.data.students.length) {
          setRawStudents(response.data.students.map(normalizeStudent));
        }
      } catch {
        setRawStudents(DEMO_STUDENTS);
      }
    }

    loadStudents();
  }, []);

  const students = useMemo(
    () => rawStudents.map(normalizeStudent).map(calcRisk).sort((a, b) => b.score - a.score),
    [rawStudents]
  );

  const filtered = students.filter((student) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      student.id.toLowerCase().includes(q) ||
      student.name.toLowerCase().includes(q) ||
      student.section.toLowerCase().includes(q) ||
      student.dept.toLowerCase().includes(q);

    const matchFilter = filter === "ALL" || student.level === filter;
    return matchSearch && matchFilter;
  });

  const selected = students.find((student) => student.id === selectedId);
  const highRiskStudents = students.filter((student) => student.level === "HIGH");

  const summary = {
    total: students.length,
    high: students.filter((student) => student.level === "HIGH").length,
    medium: students.filter((student) => student.level === "MEDIUM").length,
    low: students.filter((student) => student.level === "LOW").length,
  };

  async function generateAI(student: StudentWithRisk) {
    setTab("analysis");
    setLoadingAI(true);
    setAiAnalysis("");

    const fallbackReport = `
EXECUTIVE RISK BRIEF
${student.name} is currently marked as ${student.level} RISK with a risk score of ${student.score}/100. The academic indicators show ${
      student.level === "HIGH"
        ? "an urgent need for mentor intervention and close follow-up."
        : student.level === "MEDIUM"
        ? "early signs of academic decline that should be handled before the risk becomes critical."
        : "a stable performance profile that should remain under regular monitoring."
    }

ACADEMIC RISK SIGNALS
${student.alerts.length ? student.alerts.map((alert, index) => `${index + 1}. ${alert}`).join("\n") : "No critical warning signal detected."}

MENTOR PRIORITY
${
  student.level === "HIGH"
    ? "Schedule a personal meeting immediately. The mentor should identify the student's core barrier and create a written recovery commitment."
    : student.level === "MEDIUM"
    ? "Arrange a short check-in meeting and review attendance, quiz preparation, and submission discipline."
    : "Continue monitoring progress and reinforce the student's current academic habits."
}

RECOMMENDED ACTION PLAN
1. Review attendance and quiz trend before the meeting.
2. Ask about academic pressure, course difficulty, and personal obstacles.
3. Identify missed topics, weak chapters, and pending submissions.
4. Set weekly measurable targets for attendance, quiz practice, and assignment submission.
5. Track progress again after 7 days.

PERSONAL MEETING AGENDA
1. Discuss current academic standing clearly and respectfully.
2. Ask what is preventing consistent class participation.
3. Review recent quiz performance and weak learning areas.
4. Agree on a realistic recovery plan.
5. Confirm the next follow-up date.

4-WEEK RECOVERY ROADMAP
Week 1: Identify weak topics, clear pending submissions, and attend all scheduled classes.
Week 2: Practice quiz questions and meet mentor for progress check.
Week 3: Improve consistency in attendance and class activities.
Week 4: Review academic improvement and decide whether further support is needed.

EXPECTED OUTCOME
If the student follows this recovery plan, the risk level can be reduced within 3-4 weeks through improved attendance, timely submissions, and focused quiz preparation.
`.trim();

    try {
      const response = await axios.post(`${API}/api/chatbot/ask`, {
        course_id: "ews",
        question: `You are LearnGuard AI Early Warning System. Analyze this student using only the academic data below. Do not ask for course material. Do not include Bangla summary.

Student: ${student.name}
ID: ${student.id}
Department: ${student.dept}
Section: ${student.section}
Semester: ${student.semester}
Attendance: ${student.attendance}%
Quiz Average: ${student.quiz_avg}/100
Late Submissions: ${student.late_submissions}
CGPA: ${student.cgpa}
Risk: ${student.level} (${student.score}/100)
Alerts: ${student.alerts.join(", ")}

Create a professional mentor intervention report with these exact sections:
EXECUTIVE RISK BRIEF
ACADEMIC RISK SIGNALS
MENTOR PRIORITY
RECOMMENDED ACTION PLAN
PERSONAL MEETING AGENDA
4-WEEK RECOVERY ROADMAP
EXPECTED OUTCOME`,
      });

      const answer = String(response.data?.answer || "");

      if (
        !answer ||
        answer.includes("material upload") ||
        answer.includes("কোনো material upload") ||
        answer.includes("কোন material upload")
      ) {
        setAiAnalysis(fallbackReport);
      } else {
        setAiAnalysis(answer);
      }
    } catch {
      setAiAnalysis(fallbackReport);
    } finally {
      setLoadingAI(false);
    }
  }

  async function sendMeetingEmail() {
  if (!selected) return;

  if (!meeting.date || !meeting.time || !meeting.place) {
    setMailStatus("Please provide meeting date, time, and place.");
    return;
  }

  const subject = "Academic Mentorship Meeting";
  const emailBody = `Dear ${selected.name},

You are requested to attend an academic mentorship meeting.

Meeting Details
Date: ${meeting.date}
Time: ${meeting.time}
Place: ${meeting.place}

Reason for Meeting
Your academic progress has been reviewed by the mentorship system. The meeting will focus on your current academic situation, challenges, and a practical recovery plan.

Mentor Note
${meeting.message || "Please attend the meeting on time and bring any questions or concerns you want to discuss."}

Regards,
Academic Mentor
LearnGuard AI`;

  setSendingMail(true);
  setMailStatus("");

  try {
    await axios.post(`${API}/api/ews/send-meeting-mail`, {
      student_id: selected.id,
      student_name: selected.name,
      student_email: selected.email,
      subject,
      date: meeting.date,
      time: meeting.time,
      place: meeting.place,
      message: meeting.message,
      body: emailBody,
    });

    setMailStatus(`Professional meeting email sent to ${selected.name}.`);
  } catch {
    const gmailUrl =
      "https://mail.google.com/mail/?view=cm&fs=1" +
      `&to=${encodeURIComponent(selected.email)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(emailBody)}`;

    window.open(gmailUrl, "_blank");

    setMailStatus(
      `Gmail draft opened for ${selected.name}. Please review and send the email.`
    );
  } finally {
    setSendingMail(false);
  }
}




  return (
    <div className="grid min-h-[calc(100vh-120px)] grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-black text-slate-950">Mentorship Students</h2>
          <p className="mt-1 text-sm text-slate-500">Search by ID, name, section, or department.</p>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student ID or name"
            className="mt-4 w-full rounded-xl border-2 border-blue-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />

          <div className="mt-3 grid grid-cols-4 gap-2">
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg px-2 py-2 text-xs font-black ${
                  filter === item ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[680px] space-y-2 overflow-y-auto p-4">
          {filtered.map((student) => {
            const s = style(student.level);
            const active = selected?.id === student.id;

            return (
              <button
                key={student.id}
                onClick={() => {
                  setSelectedId(student.id);
                  setTab("details");
                  setAiAnalysis("");
                  setMailStatus("");
                }}
                className={`w-full rounded-xl border p-3 text-left transition hover:shadow-sm ${
                  active ? "border-blue-600 bg-blue-50 ring-4 ring-blue-100" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                      <p className="truncate text-sm font-black text-slate-900">{student.name}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {student.id} · {student.dept} · Sec {student.section}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black ${s.badge}`}>
                      {student.level}
                    </span>
                    <p className={`mt-1 text-xs font-black ${s.text}`}>{student.score}/100</p>
                  </div>
                </div>
              </button>
            );
          })}

          {!filtered.length && (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              No student found.
            </div>
          )}
        </div>
      </aside>

      <main className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Early Warning System</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Mentor Dashboard</h1>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Total Students" value={summary.total} color="blue" />
            <Metric label="High Alert" value={summary.high} color="red" />
            <Metric label="Medium" value={summary.medium} color="yellow" />
            <Metric label="Good Status" value={summary.low} color="green" />
          </div>
        </div>

        {!selected ? (
          <div className="p-6">
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-red-800">Risk Alert Notifications</h2>
                  <p className="mt-1 text-sm text-red-700">
                    Only high-risk mentees are shown here for urgent mentor attention.
                  </p>
                </div>
                <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white">
                  {highRiskStudents.length} Alerts
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {highRiskStudents.length ? (
                  highRiskStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedId(student.id)}
                      className="w-full rounded-xl border border-red-200 bg-white p-4 text-left transition hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-950">{student.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {student.id} · {student.dept} · Section {student.section}
                          </p>
                        </div>
                        <p className="text-xl font-black text-red-700">{student.score}/100</p>
                      </div>
                      <p className="mt-2 text-sm text-red-700">{student.alerts.join(" · ")}</p>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                    No high-risk student right now.
                  </div>
                )}
              </div>
            </section>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <h2 className="text-xl font-black text-slate-900">Select a student from the left list</h2>
              <p className="mt-2 text-sm text-slate-500">
                Individual academic details, AI analysis, and meeting setup will appear after selection.
              </p>
            </div>
          </div>
        ) : (
          <StudentDetails
            student={selected}
            tab={tab}
            setTab={setTab}
            aiAnalysis={aiAnalysis}
            loadingAI={loadingAI}
            generateAI={generateAI}
            meeting={meeting}
            setMeeting={setMeeting}
            sendMeetingEmail={sendMeetingEmail}
            sendingMail={sendingMail}
            mailStatus={mailStatus}
          />
        )}
      </main>
    </div>
  );
}

function StudentDetails({
  student,
  tab,
  setTab,
  aiAnalysis,
  loadingAI,
  generateAI,
  meeting,
  setMeeting,
  sendMeetingEmail,
  sendingMail,
  mailStatus,
}: {
  student: StudentWithRisk;
  tab: "details" | "analysis" | "meeting";
  setTab: (tab: "details" | "analysis" | "meeting") => void;
  aiAnalysis: string;
  loadingAI: boolean;
  generateAI: (student: StudentWithRisk) => void;
  meeting: { date: string; time: string; place: string; message: string };
  setMeeting: (meeting: { date: string; time: string; place: string; message: string }) => void;
  sendMeetingEmail: () => void;
  sendingMail: boolean;
  mailStatus: string;
}) {
  const s = style(student.level);

  return (
    <div>
      <div className={`border-b p-6 ${s.bg} ${s.border}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className={`h-4 w-4 rounded-full ${s.dot}`} />
              <h2 className="text-2xl font-black text-slate-950">{student.name}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${s.badge}`}>{student.level}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              ID: {student.id} · {student.dept} · Section {student.section} · Semester {student.semester}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Email: {student.email || "Not connected"} · Phone: {student.phone}
            </p>
          </div>

          <div className="rounded-2xl bg-white px-6 py-4 text-center shadow-sm">
            <p className={`text-4xl font-black ${s.text}`}>{student.score}</p>
            <p className="text-xs font-black uppercase text-slate-500">Risk Score</p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-6">
        <div className="flex gap-1">
          {[
            ["details", "Student Details"],
            ["analysis", "AI Analysis"],
            ["meeting", "Meeting Setup"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id as "details" | "analysis" | "meeting")}
              className={`border-b-2 px-5 py-4 text-sm font-black ${
                tab === id ? "border-blue-700 bg-white text-blue-700" : "border-transparent text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {tab === "details" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Attendance" value={`${student.attendance}%`} danger={student.attendance < 60} />
              <Stat label="Quiz Average" value={`${student.quiz_avg}/100`} danger={student.quiz_avg < 50} />
              <Stat label="CGPA" value={student.cgpa.toFixed(2)} danger={student.cgpa < 2.5} />
              <Stat label="Late Submission" value={student.late_submissions} danger={student.late_submissions > 3} />
            </div>

            <section className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Risk Signals</h3>
              <div className="mt-4 space-y-2">
                {student.alerts.length ? (
                  student.alerts.map((alert) => (
                    <div key={alert} className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                      {alert}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-700">
                    Student status is stable.
                  </div>
                )}
              </div>
            </section>

            <button
              onClick={() => generateAI(student)}
              className="w-full rounded-xl bg-blue-700 px-5 py-4 text-sm font-black text-white hover:bg-blue-800"
            >
              Generate Premium AI Intervention Report
            </button>
          </div>
        )}

        {tab === "analysis" && (
          <div>
            {loadingAI ? (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-12 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
                <p className="mt-4 font-black text-blue-800">AI is preparing the mentor intervention report...</p>
              </div>
            ) : aiAnalysis ? (
              <AIReport report={aiAnalysis} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <p className="text-sm font-bold text-slate-500">Generate AI analysis from Student Details tab.</p>
              </div>
            )}
          </div>
        )}

        {tab === "meeting" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">AI Meeting Assistant</h3>
              <p className="mt-2 text-sm text-slate-500">
                Provide the meeting time and place. LearnGuard will prepare a professional email for this student.
              </p>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <Input label="Date" type="date" value={meeting.date} onChange={(value) => setMeeting({ ...meeting, date: value })} />
                <Input label="Time" type="time" value={meeting.time} onChange={(value) => setMeeting({ ...meeting, time: value })} />
                <Input label="Place" type="text" value={meeting.place} onChange={(value) => setMeeting({ ...meeting, place: value })} />
              </div>

              <textarea
                value={meeting.message}
                onChange={(event) => setMeeting({ ...meeting, message: event.target.value })}
                placeholder="Optional mentor note, example: Please bring your recent quiz scripts and pending assignment list."
                className="mt-4 h-36 w-full resize-none rounded-xl border-2 border-slate-300 bg-white p-4 text-sm font-medium text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />

              <button
                onClick={sendMeetingEmail}
                disabled={sendingMail}
                className="mt-4 rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingMail ? "Sending Email..." : "Send Professional Meeting Email"}
              </button>

              {mailStatus && (
                <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-800">
                  {mailStatus}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Email Preview</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p><b>To:</b> {student.email || "Student email not connected"}</p>
                <p><b>Subject:</b> Academic Mentorship Meeting</p>
                <div className="rounded-xl border border-slate-200 bg-white p-4 leading-6">
                  Dear {student.name},<br /><br />
                  You are requested to attend an academic mentorship meeting.<br /><br />
                  <b>Date:</b> {meeting.date || "Not selected"}<br />
                  <b>Time:</b> {meeting.time || "Not selected"}<br />
                  <b>Place:</b> {meeting.place || "Not selected"}<br /><br />
                  The meeting will focus on your academic progress, current challenges, and a practical recovery plan.<br /><br />
                  {meeting.message || "Please attend the meeting on time and bring any questions or concerns you want to discuss."}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function AIReport({ report }: { report: string }) {
  const titles = [
    "EXECUTIVE RISK BRIEF",
    "ACADEMIC RISK SIGNALS",
    "MENTOR PRIORITY",
    "RECOMMENDED ACTION PLAN",
    "PERSONAL MEETING AGENDA",
    "4-WEEK RECOVERY ROADMAP",
    "EXPECTED OUTCOME",
  ];

  const sections = titles.map((title, index) => {
    const nextTitle = titles[index + 1];
    const start = report.indexOf(title);
    if (start === -1) return null;
    const end = nextTitle ? report.indexOf(nextTitle) : report.length;
    return {
      title,
      body: report.slice(start + title.length, end === -1 ? report.length : end).trim(),
    };
  }).filter(Boolean) as { title: string; body: string }[];

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <section
          key={section.title}
          className={`rounded-2xl border p-5 shadow-sm ${
            index === 0 ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
          }`}
        >
          <h3 className={`text-sm font-black uppercase tracking-[0.18em] ${index === 0 ? "text-blue-800" : "text-slate-700"}`}>
            {section.title}
          </h3>
          <div className="mt-4 space-y-2">
            {section.body.split("\n").filter(Boolean).map((line) => {
              const clean = line.trim();
              const highlighted = /^\d+\./.test(clean) || /^Week \d+:/i.test(clean);

              return (
                <p
                  key={clean}
                  className={
                    highlighted
                      ? "rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold leading-6 text-slate-800"
                      : "text-sm leading-7 text-slate-700"
                  }
                >
                  {clean}
                </p>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: "blue" | "red" | "yellow" | "green" }) {
  const colors = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    red: "border-red-200 bg-red-50 text-red-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
    green: "border-green-200 bg-green-50 text-green-700",
  };

  return (
    <div className={`rounded-xl border p-4 text-center ${colors[color]}`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs font-black uppercase">{label}</p>
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: string | number; danger: boolean }) {
  return (
    <div className={`rounded-xl border bg-white p-4 ${danger ? "border-red-200" : "border-slate-200"}`}>
      <p className={`text-2xl font-black ${danger ? "text-red-700" : "text-slate-950"}`}>{value}</p>
      <p className="mt-1 text-xs font-black uppercase text-slate-500">{label}</p>
    </div>
  );
}

function Input({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
