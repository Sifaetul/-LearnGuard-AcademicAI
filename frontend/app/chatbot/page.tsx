"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";
type Lang = "both" | "bangla" | "en";
type Message = { role: "user" | "ai"; text: string; ts?: string };

const CHIPS: Record<Lang, string[]> = {
  both:   ["Key points কী কী?", "Exam এ কী আসতে পারে?", "একটি example দাও", "সহজভাবে বুঝিয়ে দাও"],
  bangla: ["মূল বিষয়গুলো কী?", "পরীক্ষায় কী আসতে পারে?", "একটি উদাহরণ দাও", "সহজে বোঝাও"],
  en:     ["What are the key points?", "What might come in the exam?", "Give me an example", "Explain it simply"],
};

const PLACEHOLDERS: Record<Lang, string> = {
  both:   "Type your query in Bangla or English…",
  bangla: "বাংলায় প্রশ্ন লিখুন…",
  en:     "Ask a question in English…",
};

const EMPTY_TITLE: Record<Lang, string> = {
  both:   "AI Course Intelligence Hub",
  bangla: "কোর্স সহকারী প্রস্তুত",
  en:     "AI Course Intelligence Hub",
};

const EMPTY_SUB: Record<Lang, string> = {
  both:   "Upload course material to initiate context-aware RAG processing.",
  bangla: "PDF আপলোড করুন, তারপর যেকোনো প্রশ্ন করুন",
  en:     "Upload course material to initiate context-aware RAG processing.",
};

const UPLOAD_BTN: Record<Lang, string> = { both: "Upload Source PDF", bangla: "PDF আপলোড", en: "Upload Source PDF" };
const GEN_NOTES: Record<Lang, string> = { both: "Synthesize Notes", bangla: "নোট তৈরি করো", en: "Synthesize Notes" };
const GENERATING: Record<Lang, string> = { both: "Synthesizing…", bangla: "তৈরি হচ্ছে…", en: "Synthesizing…" };
const UPLOADING_TXT: Record<Lang, string> = { both: "Ingesting PDF…", bangla: "আপলোড হচ্ছে…", en: "Ingesting PDF…" };

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string) {
  return text
    .replace(/^### (.+)$/gm, `<p style="font-weight:700;font-size:12px;color:#4f46e5;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.05em">$1</p>`)
    .replace(/^## (.+)$/gm, `<p style="font-weight:700;font-size:15px;color:#1e1b4b;margin:20px 0 8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">$1</p>`)
    .replace(/^# (.+)$/gm, `<p style="font-weight:700;font-size:18px;color:#0f172a;margin:22px 0 10px">$1</p>`)
    .replace(/\*\*(.*?)\*\*/g, `<span style="color:#0f172a;font-weight:700">$1</span>`)
    .replace(/\*(.*?)\*/g, `<em style="color:#64748b">$1</em>`)
    .replace(/`(.*?)`/g, `<code style="background:#f1f5f9;color:#6366f1;padding:3px 6px;border-radius:6px;font-size:12px;border:1px solid #e2e8f0;font-family:monospace">$1</code>`)
    .replace(/^[-•] (.+)$/gm, `<div style="display:flex;gap:10px;align-items:flex-start;padding:6px 12px;border-radius:8px;background:#f8fafc;border:1px solid #f1f5f9;margin:6px 0"><span style="color:#10b981;font-size:14px;flex-shrink:0;margin-top:1px">✓</span><span style="font-size:13.5px;color:#334155">$1</span></div>`)
    .replace(/^\d+\. (.+)$/gm, `<div style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><span style="color:#6366f1;font-size:13px;font-weight:700;flex-shrink:0;min-width:16px">·</span><span style="font-size:13.5px;color:#334155">$1</span></div>`)
    .replace(/\n{2,}/g, `<div style="height:10px"></div>`)
    .replace(/\n/g, "<br/>");
}

export default function ChatbotPage() {
  const [courseId, setCourseId]   = useState("CSE101");
  const [question, setQuestion]   = useState("");
  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle"|"ok"|"err">("idle");
  const [uploadMsg, setUploadMsg] = useState("");
  const [fileName, setFileName]   = useState("");
  const [language, setLanguage]   = useState<Lang>("both");
  const [notesLoading, setNotesLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendQuestion = async () => {
    if (!question.trim() || loading) return;
    const q = question;
    setMessages(m => [...m, { role: "user", text: q, ts: now() }]);
    setQuestion("");
    setLoading(true);
    inputRef.current?.focus();

    let streamed = false;
    try {
      const res = await fetch(`${API}/api/chatbot/ask-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, question: q, language }),
      });
      if (res.ok && res.body) {
        setMessages(m => [...m, { role: "ai", text: "", ts: now() }]);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const chunk = line.slice(6);
            if (chunk === "[DONE]") break;
            streamed = true;
            setMessages(m => {
              const copy = [...m];
              copy[copy.length - 1] = { ...copy[copy.length - 1], text: copy[copy.length - 1].text + chunk.replace(/\\n/g, "\n") };
              return copy;
            });
          }
        }
      }
    } catch { /* fallback */ }

    if (!streamed) {
      try {
        const r = await axios.post(`${API}/api/chatbot/ask`, { course_id: courseId, question: q, language });
        setMessages(m => {
          const last = m[m.length - 1];
          if (last?.role === "ai" && last.text === "") {
            const copy = [...m]; copy[copy.length - 1] = { ...last, text: r.data.answer }; return copy;
          }
          return [...m, { role: "ai", text: r.data.answer, ts: now() }];
        });
      } catch {
        const errMsg = language === "en"
          ? "❌ Server error. Connection refused by host."
          : "❌ Server error। Backend সার্ভার সচল আছে কি?";
        setMessages(m => [...m, { role: "ai", text: errMsg, ts: now() }]);
      }
    }
    setLoading(false);
  };

  const uploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const autoId = file.name.replace(/\.pdf$/i, "").replace(/\s+/g, "_");
    setCourseId(autoId);
    setUploading(true);
    setUploadStatus("idle");
    const form = new FormData();
    form.append("file", file);
    try {
      const r = await axios.post(`${API}/api/chatbot/upload?course_id=${autoId}`, form);
      setUploadMsg(r.data.message);
      setUploadStatus("ok");
    } catch {
      const errMsg = language === "en" ? "Ingestion pipeline failure." : "আপলোড ব্যর্থ হয়েছে।";
      setUploadMsg(errMsg);
      setUploadStatus("err");
    }
    setUploading(false);
  };

  const generateNotes = async () => {
    setNotesLoading(true);
    const notesPrompt = language === "en"
      ? `📝 Generate executive notes (${language})`
      : `📝 Full notes generate করো (${language})`;
    setMessages(m => [...m, { role: "user", text: notesPrompt, ts: now() }]);
    try {
      const r = await axios.post(`${API}/api/chatbot/generate-notes?course_id=${courseId}&language=${language}`);
      setMessages(m => [...m, { role: "ai", text: r.data.notes, ts: now() }]);
    } catch {
      const errMsg = language === "en" ? "❌ Synthesis task failed." : "❌ নোট জেনারেট করা যায়নি।";
      setMessages(m => [...m, { role: "ai", text: errMsg, ts: now() }]);
    }
    setNotesLoading(false);
  };

  const langLabels: Record<Lang, string> = { both: "🌐 Auto-detect", bangla: "বাংলা", en: "English" };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", width: "100vw",
      fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif",
      background: "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
      padding: "20px", boxSizing: "border-box"
    }}>

      {/* ── CORE HUB CONTAINER ── */}
      <div style={{
        display: "flex", flexDirection: "column",
        height: "100%", maxWidth: "1100px", width: "100%",
        margin: "0 auto", background: "#ffffff",
        borderRadius: "16px", overflow: "hidden",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
      }}>

        {/* ── HEADER ── */}
        <div style={{
          background: "#ffffff",
          borderBottom: "1px solid #f1f5f9",
          padding: "18px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
                boxShadow: "0 4px 12px rgba(79,70,229,0.2)",
              }}>✨</div>
              <div style={{
                position: "absolute", bottom: "-1px", right: "-1px",
                width: "11px", height: "11px", borderRadius: "50%",
                background: "#10b981", border: "2.5px solid #fff",
              }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Enterprise Course Assistant
              </p>
              <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#64748b", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#6366f1" }}>●</span> LLaMA 3.3 70B Engine
                <span style={{ color: "#cbd5e1" }}>|</span>
                <span style={{ color: "#10b981" }}>●</span> Advanced RAG Ingestion
              </p>
            </div>
          </div>

          {/* Language Selection Toggle */}
          <div style={{
            display: "flex", gap: "2px",
            background: "#f1f5f9", borderRadius: "10px", padding: "3px",
            border: "1px solid #e2e8f0",
          }}>
            {(["both","bangla","en"] as Lang[]).map(l => (
              <button key={l} onClick={() => { setLanguage(l); inputRef.current?.focus(); }} style={{
                padding: "6px 14px", borderRadius: "8px", border: "none",
                cursor: "pointer", fontSize: "12px", fontWeight: 600,
                fontFamily: "inherit", transition: "all .15s ease-in-out",
                background: language === l ? "#ffffff" : "transparent",
                color: language === l ? "#4f46e5" : "#64748b",
                boxShadow: language === l ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}>
                {langLabels[l]}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTEXT INGESTION BAR ── */}
        <div style={{
          background: "#fafafa", borderBottom: "1px solid #f1f5f9",
          padding: "12px 32px",
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "180px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: ".05em", textTransform: "uppercase" }}>
                Context ID
              </span>
              <input
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                style={{
                  flex: 1, height: "36px", padding: "0 14px",
                  border: "1px solid #e2e8f0", borderRadius: "8px",
                  fontSize: "13px", color: "#0f172a", background: "#ffffff",
                  fontFamily: "inherit", outline: "none",
                  fontWeight: 500, transition: "all .15s",
                }}
              />
            </div>

            <label style={{ cursor: "pointer" }}>
              <input type="file" accept=".pdf" onChange={uploadPDF} style={{ display: "none" }} />
              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                height: "36px", padding: "0 16px", borderRadius: "8px",
                background: uploading ? "#f1f5f9" : "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#334155", fontSize: "13px", fontWeight: 600,
                transition: "all .15s", cursor: uploading ? "not-allowed" : "pointer",
              }}>
                {uploading ? "⚡" : "📥"} {uploading ? UPLOADING_TXT[language] : UPLOAD_BTN[language]}
              </div>
            </label>

            <button
              onClick={generateNotes}
              disabled={notesLoading}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                height: "36px", padding: "0 16px", borderRadius: "8px",
                background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                border: "none", color: "#ffffff",
                fontSize: "13px", fontWeight: 600,
                cursor: notesLoading ? "not-allowed" : "pointer",
                opacity: notesLoading ? .7 : 1, fontFamily: "inherit",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all .15s",
              }}
            >
              ✏️ {notesLoading ? GENERATING[language] : GEN_NOTES[language]}
            </button>

            {(uploadMsg || fileName) && (
              <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                {fileName && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>📄 {fileName}</span>}
                {uploadMsg && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    fontSize: "12px", fontWeight: 500,
                    background: uploadStatus === "ok" ? "#ecfdf5" : "#fef2f2",
                    border: `1px solid ${uploadStatus === "ok" ? "#a7f3d0" : "#fecaca"}`,
                    color: uploadStatus === "ok" ? "#065f46" : "#991b1b",
                    padding: "4px 10px", borderRadius: "6px",
                  }}>
                    {uploadStatus === "ok" ? "✓ Successfully Verified" : "✕ Error"} {uploadMsg}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── CENTRAL CONVERSATION CANVAS ── */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "32px 32px 12px",
          display: "flex", flexDirection: "column", gap: "24px",
          background: "#ffffff",
        }}>

          {messages.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "16px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "28px", marginBottom: "20px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              }}>🧠</div>
              <p style={{ fontSize: "18px", fontWeight: 600, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                {EMPTY_TITLE[language]}
              </p>
              <p style={{ fontSize: "13.5px", color: "#64748b", margin: "0 0 28px", maxWidth: "340px", lineHeight: 1.5, textAlign: "center" }}>
                {EMPTY_SUB[language]}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", maxWidth: "600px" }}>
                {CHIPS[language].map(c => (
                  <button key={c} onClick={() => { setQuestion(c); inputRef.current?.focus(); }} style={{
                    padding: "8px 16px", borderRadius: "20px",
                    border: "1px solid #e2e8f0", background: "#ffffff",
                    color: "#4f46e5", fontSize: "12.5px", fontWeight: 500,
                    cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.background = "#f5f3ff"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#ffffff"; }}
                  >{c}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", maxWidth: "85%", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                
                {/* Refined Minimal Avatars */}
                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0, marginTop: "4px",
                  background: m.role === "user" ? "#4f46e5" : "#f1f5f9",
                  border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 700,
                  color: m.role === "user" ? "#ffffff" : "#4f46e5",
                }}>
                  {m.role === "user" ? "USR" : "AI"}
                </div>

                {/* Advanced Contrast Chat Bubble */}
                <div style={{
                  padding: "14px 18px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "#4f46e5" : "#f8fafc",
                  border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                  fontSize: "14px", lineHeight: "1.75",
                  color: m.role === "user" ? "#ffffff" : "#1e293b",
                  wordBreak: "break-word",
                  boxShadow: m.role === "user" ? "0 4px 12px rgba(79,70,229,0.12)" : "none",
                }}>
                  {m.role === "ai"
                    ? <span dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
                    : m.text
                  }
                </div>
              </div>
              {m.ts && (
                <p style={{ margin: "6px 42px 0", fontSize: "10px", color: "#94a3b8", fontWeight: 500 }}>
                  {m.ts}{m.role === "user" ? " · Dispatched" : ""}
                </p>
              )}
            </div>
          ))}

          {(loading || notesLoading) && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "8px",
                background: "#f1f5f9", border: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 700, color: "#4f46e5",
              }}>AI</div>
              <div style={{
                padding: "14px 20px", borderRadius: "16px 16px 16px 4px",
                background: "#f8fafc", border: "1px solid #e2e8f0",
                display: "flex", gap: "6px", alignItems: "center",
              }}>
                {[0,1,2].map(n => (
                  <div key={n} style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "#4f46e5", opacity: 0.6,
                    animation: "bounce 1.4s ease-in-out infinite",
                    animationDelay: `${n * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && !loading && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingTop: "6px" }}>
              {CHIPS[language].map(c => (
                <button key={c} onClick={() => { setQuestion(c); inputRef.current?.focus(); }} style={{
                  padding: "6px 14px", borderRadius: "20px",
                  border: "1px solid #e2e8f0", background: "#ffffff",
                  color: "#4f46e5", fontSize: "12px", fontWeight: 500,
                  cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.background = "#f5f3ff"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#ffffff"; }}
                >{c}</button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── PREMIUM INPUT ENGAGEMENT DECK ── */}
        <div style={{
          background: "#ffffff", borderTop: "1px solid #f1f5f9",
          padding: "16px 32px", display: "flex", gap: "12px", alignItems: "center",
        }}>
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: "16px", fontSize: "15px", color: "#94a3b8", pointerEvents: "none" }}>⚡</span>
            <input
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendQuestion()}
              placeholder={PLACEHOLDERS[language]}
              style={{
                width: "100%", height: "48px", padding: "0 16px 0 46px",
                border: "1px solid #cbd5e1", borderRadius: "10px",
                fontSize: "14px", color: "#0f172a", background: "#ffffff",
                fontFamily: "inherit", outline: "none", transition: "all .15s ease-in-out",
              }}
              onFocus={e => { e.target.style.borderColor = "#4f46e5"; e.target.style.boxShadow = "0 0 0 3px rgba(79,70,229,.08)"; }}
              onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <button
            onClick={sendQuestion}
            disabled={loading || !question.trim()}
            style={{
              width: "48px", height: "48px", borderRadius: "10px", border: "none",
              background: loading || !question.trim()
                ? "#f1f5f9"
                : "linear-gradient(135deg, #1e1b4b, #4f46e5)",
              color: loading || !question.trim() ? "#94a3b8" : "#ffffff",
              cursor: loading || !question.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: "16px", transition: "all .15s",
              boxShadow: loading || !question.trim() ? "none" : "0 2px 4px rgba(79,70,229,0.1)",
            }}
          >→</button>
        </div>

      </div>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}