"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const API = "http://127.0.0.1:8000";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    axios.get(`${API}/api/dashboard/kpi`).then(r => setData(r.data));
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-blue-600 text-xl animate-pulse">Loading Dashboard...</div>
    </div>
  );

  const { kpis, obe, monthly_attendance, department_performance } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-blue-900">📊 Institutional KPI Dashboard</h1>
        <p className="text-gray-500 mt-1">{data.university} — {data.semester}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students",   value: kpis.total_students.toLocaleString(), color: "bg-blue-600" },
          { label: "Retention Rate",   value: `${kpis.retention_rate}%`,            color: "bg-green-600" },
          { label: "At-Risk Students", value: kpis.at_risk_students.toLocaleString(), color: "bg-red-500" },
          { label: "Average CGPA",     value: kpis.avg_cgpa,                        color: "bg-purple-600" },
        ].map(card => (
          <div key={card.label} className={`${card.color} text-white rounded-xl p-5 shadow`}>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm mt-1 opacity-90">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "CLO Attainment",         value: `${obe.clo_attainment_avg}%` },
          { label: "PLO Attainment",         value: `${obe.plo_attainment_avg}%` },
          { label: "Courses Meeting Target", value: obe.courses_meeting_target },
          { label: "Courses Below Target",   value: obe.courses_below_target },
        ].map(card => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-2xl font-bold text-blue-800">{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold text-gray-700 mb-4">📅 Monthly Attendance Rate</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly_attendance}>
              <XAxis dataKey="month" />
              <YAxis domain={[60, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="font-semibold text-gray-700 mb-4">🏫 Department Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={department_performance}>
              <XAxis dataKey="dept" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg_cgpa" fill="#7c3aed" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}