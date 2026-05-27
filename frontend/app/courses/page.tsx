"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = "http://127.0.0.1:8000";

const ENROLLED = ["CSE101", "CSE201", "CSE301"];

const DEPT_COLORS: Record<string, string> = {
  CSE: "from-blue-600 to-indigo-700",
  EEE: "from-emerald-600 to-teal-700",
  BBA: "from-orange-500 to-amber-600",
};

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      ENROLLED.map(id => axios.get(`${API}/api/courses/${id}`).then(r => r.data))
    ).then(data => { setCourses(data); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-blue-600 font-medium">Loading your courses...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📚 My Courses</h1>
          <p className="text-gray-500 mt-1">Spring 2025 • {courses.length} Enrolled Courses</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700 font-medium">
          🎓 Student: Traxem Harze
        </div>
      </div>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          const color = DEPT_COLORS[course.dept] || "from-gray-600 to-gray-700";
          const teacher = course.teacher_details;
          return (
            <div key={course.code}
              onClick={() => router.push(`/courses/${course.code}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer overflow-hidden group">

              {/* Card Header */}
              <div className={`bg-gradient-to-br ${color} p-5 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-6 -mb-6" />
                <div className="relative">
                  <span className="text-white/80 text-xs font-medium bg-white/20 px-2.5 py-1 rounded-full">
                    {course.dept} • Semester {course.semester}
                  </span>
                  <h2 className="text-white font-bold text-xl mt-2">{course.code}</h2>
                  <p className="text-white/90 text-sm mt-0.5 leading-snug">{course.title}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                {/* Teacher */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {teacher?.name?.charAt(0) || "T"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{teacher?.name || "N/A"}</p>
                    <p className="text-xs text-gray-400">{teacher?.title} • {teacher?.dept}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Lectures", value: course.lectures?.length || 0, icon: "📖" },
                    { label: "Assignments", value: course.assignments?.length || 0, icon: "📝" },
                    { label: "Labs", value: course.labs?.length || 0, icon: "🧪" },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl py-2">
                      <div className="text-lg">{s.icon}</div>
                      <div className="text-sm font-bold text-gray-700">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Schedule */}
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                  <span>🕐</span>
                  <span>{course.schedule}</span>
                  <span>•</span>
                  <span>🏫 {course.room}</span>
                </div>

                {/* CTA */}
                <button className={`w-full bg-gradient-to-r ${color} text-white py-2.5 rounded-xl text-sm font-semibold group-hover:opacity-90 transition-all flex items-center justify-center gap-2`}>
                  🤖 Open AI Assistant
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}