"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

const API = "http://127.0.0.1:8000";

type Msg = { role: "user"|"ai"; text: string; time: string };

const QUICK = [
  { label: "📖 All Lectures",        q: "Give me a complete overview of all lectures and their topics" },
  { label: "📝 Assignments",         q: "What are all the assignments, deadlines and submission instructions?" },
  { label: "🧪 Lab Instructions",    q: "Explain all lab reports with instructions and submission format" },
  { label: "📊 Exam Syllabus",       q: "What is the exam syllabus, format and important topics for midterm and final?" },
  { label: "👨‍🏫 Teacher Info",        q: "Tell me about the course teacher - their background, research and office hours" },
  { label: "📋 Grading Breakdown",   q: "Explain the complete grading breakdown and how marks are distributed" },
  { label: "🎯 Exam Preparation",    q: "Create a complete exam preparation plan with important topics and study strategy" },
  { label: "📅 All Deadlines",       q: "List all upcoming deadlines for assignments, labs and presentations" },
];

export default function CoursePage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [course, setCourse]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [activeTab, setActiveTab] = useState<"chat"|"lectures"|"tasks"|"teacher">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);

  const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    axios.get(`${API}/api/courses/${courseId}`).then(r => {
      setCourse(r.data);
      setLoading(false);
      setMessages([{
        role: "ai",
        text: `👋 Welcome to **${r.data.code} — ${r.data.title}**!\n\nI'm your AI course assistant. I have complete knowledge of:\n\n📚 All ${r.data.lectures?.length} lectures & topics\n📝 ${r.data.assignments?.length} assignments with deadlines\n🧪 ${r.data.labs?.length} lab reports & instructions\n📊 Exam syllabus & preparation tips\n👨‍🏫 Teacher: ${r.data.teacher_details?.name}\n\nClick any quick button or ask me anything!`,
        time: now()
      }]);
    });
  }, [courseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q, time: now() }]);
    setSending(true);
    try {
      const r = await axios.post(
        `${API}/api/chatbot/course-ask?course_id=${courseId}&question=${encodeURIComponent(q)}`
      );
      setMessages(m => [...m, { role: "ai", text: r.data.answer, time: now() }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "❌ Error. Backend চালু আছে?", time: now() }]);
    }
    setSending(false);
  };

  const fmt = (t: string) => t
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const teacher = course.teacher_details;
  const deptColor = course.dept === "CSE" ? "from-blue-600 to-indigo-700" : "from-emerald-600 to-teal-700";

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">

      {/* LEFT: Course Info Panel */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">

        {/* Back + Course Header */}
        <div className={`bg-gradient-to-br ${deptColor} rounded-2xl p-4 text-white`}>
          <button onClick={() => router.push("/courses")}
            className="text-white/70 hover:text-white text-xs mb-3 flex items-center gap-1">
            ← Back to Courses
          </button>
          <div className="text-2xl font-black">{course.code}</div>
          <div className="text-sm font-medium mt-0.5 leading-snug">{course.title}</div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="bg-white/20 text-xs px-2 py-1 rounded-full">{course.dept}</span>
            <span className="bg-white/20 text-xs px-2 py-1 rounded-full">Sem {course.semester}</span>
            <span className="bg-white/20 text-xs px-2 py-1 rounded-full">{course.credits} Credits</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1.5 rounded-xl">
          {[
            { id: "lectures", icon: "📖", label: "Lectures" },
            { id: "tasks",    icon: "📝", label: "Tasks" },
            { id: "teacher",  icon: "👨‍🏫", label: "Teacher" },
            { id: "chat",     icon: "🤖", label: "Quick" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === t.id ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "lectures" && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">
              {course.lectures?.length} Lectures
            </h3>
            {course.lectures?.map((lec: any) => (
              <div key={lec.no}
                onClick={() => send(`Explain Lecture ${lec.no}: ${lec.title} in detail with all topics, examples, and exam tips`)}
                className="bg-white border border-gray-100 rounded-xl p-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {lec.no}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 leading-tight">
                    {lec.title}
                  </span>
                </div>
                <div className="ml-8 flex flex-wrap gap-1">
                  {lec.topics?.slice(0,2).map((t: string) => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                  {lec.topics?.length > 2 && (
                    <span className="text-xs text-gray-400">+{lec.topics.length - 2} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-3">
            {course.assignments?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1 mb-2">Assignments</h3>
                {course.assignments?.map((a: any) => (
                  <div key={a.no}
                    onClick={() => send(`Explain Assignment ${a.no}: ${a.title} — what exactly to do, how to submit, and tips to get full marks`)}
                    className="bg-white border border-orange-100 rounded-xl p-3 mb-2 cursor-pointer hover:border-orange-300 transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-gray-700">{a.title}</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{a.marks}%</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 block">📅 Due: {a.deadline}</span>
                  </div>
                ))}
              </div>
            )}
            {course.labs?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1 mb-2">Lab Reports</h3>
                {course.labs?.map((l: any) => (
                  <div key={l.no}
                    onClick={() => send(`Explain Lab ${l.no}: ${l.title} — detailed instructions, report format, and what to include`)}
                    className="bg-white border border-green-100 rounded-xl p-3 mb-2 cursor-pointer hover:border-green-300 transition-all">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-gray-700">{l.title}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{l.marks}%</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 block">📅 Due: {l.deadline}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Grading */}
            <div className="bg-white border rounded-xl p-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">📊 Grading</h3>
              {Object.entries(course.grading || {}).map(([k, v]: any) => (
                <div key={k} className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-600 capitalize">{k}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${v}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{v}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "teacher" && teacher && (
          <div className="space-y-3">
            <div className={`bg-gradient-to-br ${deptColor} rounded-xl p-4 text-white text-center`}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-2">
                {teacher.name?.charAt(0)}
              </div>
              <p className="font-bold">{teacher.name}</p>
              <p className="text-sm text-white/80">{teacher.title}</p>
              <p className="text-xs text-white/60 mt-1">{teacher.dept} Department</p>
            </div>
            <div className="bg-white border rounded-xl p-3 space-y-2 text-sm">
              {[
                { icon: "📧", label: teacher.email },
                { icon: "🏢", label: teacher.office },
                { icon: "🕐", label: teacher.office_hours },
                { icon: "📚", label: `${teacher.publications} Publications` },
                { icon: "🎓", label: `${teacher.experience_years} Years Experience` },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-gray-600">
                  <span>{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="bg-white border rounded-xl p-3">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Specialization</p>
              <div className="flex flex-wrap gap-1.5">
                {teacher.specialization?.map((s: string) => (
                  <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <button onClick={() => send(`Tell me everything about ${teacher.name} — their teaching style, research work, and how to get good grades in their course`)}
              className={`w-full bg-gradient-to-r ${deptColor} text-white py-2.5 rounded-xl text-sm font-semibold`}>
              🤖 Ask AI About Teacher
            </button>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1">Quick Questions</h3>
            {QUICK.map(q => (
              <button key={q.label} onClick={() => send(q.q)}
                className="w-full text-left bg-white border border-gray-100 hover:border-blue-300 hover:bg-blue-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:text-blue-700 transition-all">
                {q.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Chat Panel */}
      <div className="flex-1 bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden">

        {/* Chat Header */}
        <div className={`bg-gradient-to-r ${deptColor} px-5 py-3.5 flex items-center gap-3`}>
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">🤖</div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{course.code} AI Assistant</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <p className="text-white/70 text-xs">Powered by Groq LLaMA 3.3 • RAG Engine</p>
            </div>
          </div>
          <div className="text-right text-xs text-white/60">
            <div>{messages.length - 1} messages</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "ai" && (
                <div className={`w-8 h-8 bg-gradient-to-br ${deptColor} rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1 shadow`}>
                  🤖
                </div>
              )}
              <div className="max-w-[80%]">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm shadow-sm"
                    : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                }`}
                  dangerouslySetInnerHTML={{ __html: fmt(m.text) }}
                />
                <div className={`text-xs text-gray-400 mt-1 ${m.role === "user" ? "text-right" : "text-left"}`}>
                  {m.time}
                </div>
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1 shadow">
                  👤
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex gap-3 justify-start">
              <div className={`w-8 h-8 bg-gradient-to-br ${deptColor} rounded-full flex items-center justify-center text-sm shadow`}>🤖</div>
              <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  {[0,150,300].map(d => (
                    <div key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay:`${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={`Ask anything about ${course.code}...`}
              className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm placeholder-gray-400 text-gray-800"
            />
            <button onClick={() => send()} disabled={sending || !input.trim()}
              className={`bg-gradient-to-br ${deptColor} hover:opacity-90 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow`}>
              Send ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}