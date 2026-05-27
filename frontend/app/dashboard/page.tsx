"use client";
import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";

/* ══════════════════════════════════════════════
   MOCK DATA — replace with real API calls
══════════════════════════════════════════════ */
const DEPTS = ["CSE", "EEE", "BBA", "Civil", "Textile", "Pharmacy"];

function mockLive() {
  const base = { CSE: 87, EEE: 79, BBA: 91, Civil: 74, Textile: 83, Pharmacy: 88 };
  return DEPTS.map(d => ({
    dept: d,
    attendance: Math.max(50, Math.min(100, (base as any)[d] + Math.floor(Math.random() * 7 - 3))),
    active: Math.floor(Math.random() * 120 + 40),
    avgCGPA: +(3.0 + Math.random() * 1.2).toFixed(2),
    atRisk: Math.floor(Math.random() * 12 + 2),
  }));
}

function mockTimeSeries() {
  const labels = ["8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM"];
  return labels.map((t, i) => ({
    time: t,
    attendance: Math.floor(60 + Math.sin(i / 2) * 20 + Math.random() * 10),
    active: Math.floor(200 + Math.sin(i / 1.5) * 80 + Math.random() * 30),
    alerts: Math.floor(Math.random() * 5),
  }));
}

function mockAlerts() {
  return [
    { id: 1, type: "HIGH",   dept: "CSE",     msg: "Farida Khanam — attendance dropped to 38%", time: "2m ago" },
    { id: 2, type: "MEDIUM", dept: "EEE",     msg: "3 students missed 5+ consecutive classes",   time: "8m ago" },
    { id: 3, type: "HIGH",   dept: "BBA",     msg: "Sabbir Rahman — Quiz avg critically low (22)", time: "15m ago" },
    { id: 4, type: "LOW",    dept: "Civil",   msg: "Department avg attendance recovered to 74%", time: "22m ago" },
    { id: 5, type: "MEDIUM", dept: "Pharmacy","msg: Ayasha Siddiqui — 6 late submissions logged", time: "31m ago" },
  ];
}

/* ══════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════ */
function Pulse({ color }: { color: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%", background: color,
        opacity: .6, animation: "ping 1.4s cubic-bezier(0,0,.2,1) infinite",
      }} />
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
    </span>
  );
}

function StatCard({
  icon, label, value, sub, color, trend,
}: {
  icon: string; label: string; value: string | number;
  sub?: string; color: string; trend?: number;
}) {
  return (
    <div style={{
      background: "#0a0f1e", borderRadius: "14px",
      border: "1px solid #0f1e35", padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: "6px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -16, right: -16, width: 80, height: 80,
        borderRadius: "50%", background: color, opacity: .06,
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
        {trend !== undefined && (
          <span style={{
            fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "6px",
            background: trend >= 0 ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
            color: trend >= 0 ? "#4ade80" : "#f87171",
            border: `1px solid ${trend >= 0 ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)"}`,
          }}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, color, letterSpacing: "-1px", lineHeight: 1 }}>{value}</p>
      <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#475569" }}>{label}</p>
      {sub && <p style={{ margin: 0, fontSize: "11px", color: "#334155" }}>{sub}</p>}
    </div>
  );
}

const ALERT_CFG: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  HIGH:   { bg: "rgba(239,68,68,.08)",  color: "#f87171", border: "rgba(239,68,68,.2)",  dot: "#ef4444" },
  MEDIUM: { bg: "rgba(234,179,8,.07)",  color: "#fbbf24", border: "rgba(234,179,8,.2)",  dot: "#eab308" },
  LOW:    { bg: "rgba(34,197,94,.07)",  color: "#4ade80", border: "rgba(34,197,94,.15)", dot: "#22c55e" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f1525", border: "1px solid #1a2744", borderRadius: "10px", padding: "10px 14px" }}>
      <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: "#60a5fa" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ margin: "2px 0", fontSize: "12px", color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════ */
export default function CampusAnalytics() {
  const [deptData, setDeptData]     = useState(mockLive());
  const [timeData]                  = useState(mockTimeSeries());
  const [alerts]                    = useState(mockAlerts());
  const [tick, setTick]             = useState(0);
  const [liveTime, setLiveTime]     = useState("");
  const [activeTab, setActiveTab]   = useState<"overview"|"departments"|"alerts">("overview");
  const [lastUpdated, setLastUpdated] = useState("");

  // Live refresh every 5s
  useEffect(() => {
    const id = setInterval(() => {
      setDeptData(mockLive());
      setTick(t => t + 1);
      setLastUpdated(new Date().toLocaleTimeString());
    }, 5000);
    setLastUpdated(new Date().toLocaleTimeString());
    return () => clearInterval(id);
  }, []);

  // Clock
  useEffect(() => {
    const id = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    setLiveTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    return () => clearInterval(id);
  }, []);

  const totalStudents  = deptData.reduce((a, d) => a + d.active, 0);
  const avgAttendance  = Math.round(deptData.reduce((a, d) => a + d.attendance, 0) / deptData.length);
  const totalAtRisk    = deptData.reduce((a, d) => a + d.atRisk, 0);
  const avgCGPA        = (deptData.reduce((a, d) => a + d.avgCGPA, 0) / deptData.length).toFixed(2);
  const highAlerts     = alerts.filter(a => a.type === "HIGH").length;

  const radialData = deptData.slice(0, 4).map((d, i) => ({
    name: d.dept, value: d.attendance,
    fill: ["#3b82f6","#8b5cf6","#22c55e","#f59e0b"][i],
  }));

  const tabStyle = (t: string) => ({
    padding: "6px 16px", borderRadius: "8px", border: "none",
    cursor: "pointer", fontSize: "12px", fontWeight: 600,
    fontFamily: "inherit", transition: "all .2s",
    background: activeTab === t ? "#1d4ed8" : "transparent",
    color: activeTab === t ? "#fff" : "#475569",
  });

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column", gap: "14px", minHeight: "100vh" }}>

      {/* ── TOPBAR ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-.4px" }}>
              📡 Live Campus Analytics
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.2)", borderRadius: "20px", padding: "3px 10px" }}>
              <Pulse color="#22c55e" />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#4ade80" }}>LIVE</span>
            </div>
          </div>
          <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#334155" }}>
            Daffodil International University &nbsp;·&nbsp; Updated: <span style={{ color: "#60a5fa" }}>{lastUpdated}</span> &nbsp;·&nbsp; Refreshes every 5s
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {highAlerts > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "10px", padding: "6px 12px" }}>
              <Pulse color="#ef4444" />
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#f87171" }}>{highAlerts} Critical Alert{highAlerts > 1 ? "s" : ""}</span>
            </div>
          )}
          <div style={{ background: "#0a0f1e", border: "1px solid #0f1e35", borderRadius: "10px", padding: "6px 14px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#60a5fa", fontVariantNumeric: "tabular-nums", letterSpacing: ".05em" }}>{liveTime}</p>
            <p style={{ margin: 0, fontSize: "10px", color: "#334155" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: "flex", gap: "3px", background: "#0a0f1e", borderRadius: "10px", padding: "3px", border: "1px solid #0f1e35", width: "fit-content" }}>
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "departments", label: "🏫 Departments" },
          { key: "alerts", label: `⚠️ Alerts (${alerts.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={tabStyle(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ══ */}
      {activeTab === "overview" && (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
            <StatCard icon="👥" label="Active Students" value={totalStudents} sub="Currently on campus" color="#60a5fa" trend={3} />
            <StatCard icon="✅" label="Avg Attendance" value={`${avgAttendance}%`} sub="All departments" color="#4ade80" trend={2} />
            <StatCard icon="⚠️" label="At-Risk Students" value={totalAtRisk} sub="Need intervention" color="#f87171" trend={-5} />
            <StatCard icon="🎓" label="Avg CGPA" value={avgCGPA} sub="University wide" color="#a78bfa" trend={1} />
            <StatCard icon="🏫" label="Departments" value={DEPTS.length} sub="All active" color="#fbbf24" />
            <StatCard icon="🔴" label="Critical Alerts" value={highAlerts} sub="Immediate action" color="#f87171" />
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

            {/* Attendance over time */}
            <div style={{ background: "#0a0f1e", borderRadius: "14px", border: "1px solid #0f1e35", padding: "16px" }}>
              <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>
                📈 Attendance Rate · Today
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: "#334155", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#334155", fontSize: 11 }} axisLine={false} tickLine={false} domain={[40, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2} fill="url(#attGrad)" name="Attendance %" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Active students */}
            <div style={{ background: "#0a0f1e", borderRadius: "14px", border: "1px solid #0f1e35", padding: "16px" }}>
              <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>
                👥 Active Students · Today
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: "#334155", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#334155", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="active" stroke="#8b5cf6" strokeWidth={2} fill="url(#activeGrad)" name="Students" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dept Bar + Radial */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
            <div style={{ background: "#0a0f1e", borderRadius: "14px", border: "1px solid #0f1e35", padding: "16px" }}>
              <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>
                🏫 Department Attendance %
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} barSize={28}>
                  <XAxis dataKey="dept" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#334155", fontSize: 11 }} axisLine={false} tickLine={false} domain={[50, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="attendance" name="Attendance %" radius={[6, 6, 0, 0]}
                    fill="#3b82f6"
                    label={{ position: "top", fill: "#475569", fontSize: 11, formatter: (v: number) => `${v}%` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#0a0f1e", borderRadius: "14px", border: "1px solid #0f1e35", padding: "16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>
                🎯 Attendance Radial
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData}>
                  <RadialBar dataKey="value" cornerRadius={4} label={{ position: "insideStart", fill: "#fff", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginTop: "6px" }}>
                {radialData.map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.fill }} />
                    <span style={{ fontSize: "10px", color: "#475569" }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ DEPARTMENTS TAB ══ */}
      {activeTab === "departments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {deptData.map((d, i) => {
            const attColor = d.attendance < 70 ? "#f87171" : d.attendance < 80 ? "#fbbf24" : "#4ade80";
            const colors   = ["#3b82f6","#8b5cf6","#22c55e","#f59e0b","#ec4899","#14b8a6"];
            return (
              <div key={d.dept} style={{ background: "#0a0f1e", borderRadius: "14px", border: "1px solid #0f1e35", padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "12px",
                      background: `${colors[i]}18`, border: `1px solid ${colors[i]}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px", fontWeight: 800, color: colors[i],
                    }}>{d.dept.charAt(0)}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#e2e8f0" }}>{d.dept}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#334155" }}>Department</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                    {[
                      { label: "Attendance", value: `${d.attendance}%`, color: attColor },
                      { label: "Active Now", value: d.active, color: "#60a5fa" },
                      { label: "Avg CGPA", value: d.avgCGPA, color: "#a78bfa" },
                      { label: "At-Risk", value: d.atRisk, color: d.atRisk > 8 ? "#f87171" : "#fbbf24" },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: m.color }}>{m.value}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#334155", textTransform: "uppercase", letterSpacing: ".05em" }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attendance bar */}
                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontSize: "11px", color: "#334155" }}>Attendance Rate</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: attColor }}>{d.attendance}%</span>
                  </div>
                  <div style={{ height: "6px", background: "#0f1e35", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "3px",
                      width: `${d.attendance}%`,
                      background: `linear-gradient(90deg, ${colors[i]}, ${attColor})`,
                      transition: "width .8s ease",
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ ALERTS TAB ══ */}
      {activeTab === "alerts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
            {["HIGH","MEDIUM","LOW"].map(t => {
              const count = alerts.filter(a => a.type === t).length;
              const c = ALERT_CFG[t];
              return (
                <div key={t} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "6px 14px", display: "flex", gap: "6px", alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: c.color }}>{t}: {count}</span>
                </div>
              );
            })}
          </div>

          {alerts.map(a => {
            const c = ALERT_CFG[a.type];
            return (
              <div key={a.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "10px", background: `${c.dot}20`, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "16px" }}>{a.type === "HIGH" ? "🔴" : a.type === "MEDIUM" ? "🟡" : "🟢"}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: c.color, textTransform: "uppercase", letterSpacing: ".05em" }}>{a.type}</span>
                    <span style={{ fontSize: "11px", background: "rgba(99,102,241,.12)", color: "#818cf8", padding: "1px 7px", borderRadius: "5px", border: "1px solid rgba(99,102,241,.2)" }}>{a.dept}</span>
                    <span style={{ fontSize: "11px", color: "#334155", marginLeft: "auto" }}>{a.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8", lineHeight: 1.5 }}>{a.msg}</p>
                </div>
                <button style={{
                  height: "30px", padding: "0 12px", borderRadius: "7px",
                  border: `1px solid ${c.border}`, background: "transparent",
                  color: c.color, fontSize: "11px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
                }}>View →</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Live tick indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", paddingTop: "4px" }}>
        <Pulse color="#334155" />
        <span style={{ fontSize: "11px", color: "#1e3a5f" }}>Auto-refreshing every 5 seconds · Tick #{tick}</span>
      </div>

      <style>{`
        @keyframes ping { 75%,100% { transform:scale(2); opacity:0 } }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
      `}</style>
    </div>
  );
}