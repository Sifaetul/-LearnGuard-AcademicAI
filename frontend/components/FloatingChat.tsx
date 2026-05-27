"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

type Lang = "both" | "bangla" | "en";
type Message = { role: "user" | "ai"; text: string; textBn?: string; textEn?: string };

// ল্যাঙ্গুয়েজ ভিত্তিক কুইক চিপস (সুইচ করার সাথে সাথে চেঞ্জ হবে)
const CHIPS: Record<Lang, string[]> = {
  both:   ["Key points কী কী?", "Exam এ কী আসতে পারে?", "একটি example দাও", "সহজভাবে বুঝিয়ে দাও"],
  bangla: ["মূল বিষয়গুলো কী?", "পরীক্ষায় কী আসতে পারে?", "একটি উদাহরণ দাও", "সহজে বোঝাও"],
  en:     ["What are the key points?", "What might come in the exam?", "Give me an example", "Explain it simply"],
};

// ল্যাঙ্গুয়েজ ভিত্তিক কুইক আস্ক সাজেশনস
const QUICK_ASKS: Record<Lang, string[]> = {
  both:   ["📚 All lecture topics", "📝 Assignment deadlines", "🔬 Lab instructions", "📊 Exam syllabus & format", "👨‍🏫 Teacher details", "💯 Grading breakdown"],
  bangla: ["📚 সব লেকচার টপিক", "📝 অ্যাসাইনমেন্ট ডেডলাইন", "🔬 ল্যাব ইন্সট্রাকশন", "📊 পরীক্ষার সিলেবাস ও ফরম্যাট", "👨‍🏫 শিক্ষকের বিবরণ", "💯 গ্রেডিং ব্রেকডাউন"],
  en:     ["📚 All lecture topics", "📝 Assignment deadlines", "🔬 Lab instructions", "📊 Exam syllabus & format", "👨‍🏫 Teacher details", "💯 Grading breakdown"]
};

const PLACEHOLDERS: Record<Lang, string> = {
  both:   "Type your message here…",
  bangla: "এখানে আপনার প্রশ্নটি লিখুন…",
  en:     "Type your question here…",
};

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(true);
  const [courseId, setCourseId] = useState("CSE101");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Lang>("both");

  // রিসাইজ ও পজিশন গ্লোবাল স্টেট
  const [dimensions, setDimensions] = useState({ width: 380, height: 580 });
  const [position, setPosition] = useState({ bottom: 30, right: 30 });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, isOpen]);

  // অল-ডাইরেকশন মাউস ড্র্যাগ রিসাইজ মেকানিজম
  const startResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;
    const startBottom = position.bottom;
    const startRight = position.right;
    const startX = e.clientX;
    const startY = e.clientY;

    const doResize = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newBottom = startBottom;
      let newRight = startRight;

      if (direction.includes("w")) newWidth = startWidth - deltaX;
      else if (direction.includes("e")) {
        newWidth = startWidth + deltaX;
        newRight = startRight - deltaX;
      }

      if (direction.includes("n")) newHeight = startHeight - deltaY;
      else if (direction.includes("s")) {
        newHeight = startHeight + deltaY;
        newBottom = startBottom - deltaY;
      }

      if (newWidth >= 325 && newWidth <= 900) {
        setDimensions(prev => ({ ...prev, width: newWidth }));
        setPosition(prev => ({ ...prev, right: newRight }));
      }
      if (newHeight >= 450 && newHeight <= 950) {
        setDimensions(prev => ({ ...prev, height: newHeight }));
        setPosition(prev => ({ ...prev, bottom: newBottom }));
      }
    };

    const stopResize = () => {
      window.removeEventListener("mousemove", doResize);
      window.removeEventListener("mouseup", stopResize);
    };

    window.addEventListener("mousemove", doResize);
    window.addEventListener("mouseup", stopResize);
  };

  const sendQuestion = async (overrideText?: string, currentLang?: Lang) => {
    const rawQuestion = overrideText || question;
    if (!rawQuestion.trim() || loading) return;

    const activeLang = currentLang || language;
    
    // স্ট্রাকচার ও রিয়েল ওয়ার্ল্ড এক্সাম্পলের জন্য মাস্টার প্রম্পট
    const formattingInstruction = 
      "\n\n[FORMATTING: Respond with deep analytical breakdown. Use descriptive Markdown headers, bold phrases, and distinct bullet points. Always include a structured 'Real-World Software Engineering Use-Case/Example' section.]";

    let langInstruction = "";
    if (activeLang === "en") {
      langInstruction = "\n[LANGUAGE: Output MUST be entirely in English language only. Avoid any Bengali glyphs.]";
    } else if (activeLang === "bangla") {
      langInstruction = "\n[LANGUAGE: Output MUST be entirely in Bengali (বাংলা) language only.]";
    }

    const finalQuestionToSend = rawQuestion + formattingInstruction + langInstruction;

    // মেসেজ পুশ
    setMessages((m) => [...m, { role: "user", text: rawQuestion }]);
    if (!overrideText) setQuestion("");
    setLoading(true);

    try {
      const r = await axios.post(`${API}/api/chatbot/ask`, {
        course_id: courseId,
        question: finalQuestionToSend,
        language: activeLang,
      });

      const responseText = r.data.answer || r.data.response || "Success";

      // যদি ব্যাকএন্ড অবজেক্টে বাংলা ও ইংলিশ আলাদা পাঠায় (ঐচ্ছিক হ্যান্ডলার)
      setMessages((m) => [
        ...m, 
        { 
          role: "ai", 
          text: responseText,
          textBn: r.data.answer_bn || undefined, 
          textEn: r.data.answer_en || undefined 
        }
      ]);
    } catch {
      const errorMsg = activeLang === "en" 
        ? "❌ Connection error. Is the backend server online?"
        : "❌ Connection error. Backend चालू আছে?";
      setMessages((m) => [...m, { role: "ai", text: errorMsg }]);
    }
    setLoading(false);
  };

  const langLabels: Record<Lang, string> = { both: "🌐 Auto", bangla: "বাংলা", en: "English" };

  return (
    <div style={{ position: "fixed", bottom: `${position.bottom}px`, right: `${position.right}px`, zIndex: 99999, fontFamily: "sans-serif" }}>
      
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer", boxShadow: "0 8px 24px rgba(79,70,229,0.35)" }}
        >
          💬
        </button>
      )}

      {isOpen && (
        <div style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid rgba(79, 70, 229, 0.25)",
          boxShadow: "0 12px 40px rgba(15, 23, 42, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative"
        }}>
          
          {/* =========================================================
              রিসাইজার গ্রিপ জোন (ইউজার কার্সার দিয়ে ড্র্যাগ করতে পারবে)
             ========================================================= */}
          <div onMouseDown={(e) => startResize(e, "n")} style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", cursor: "n-resize", zIndex: 100 }} />
          <div onMouseDown={(e) => startResize(e, "s")} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "6px", cursor: "s-resize", zIndex: 100 }} />
          <div onMouseDown={(e) => startResize(e, "w")} style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "6px", cursor: "w-resize", zIndex: 100 }} />
          <div onMouseDown={(e) => startResize(e, "e")} style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "6px", cursor: "e-resize", zIndex: 100 }} />
          <div onMouseDown={(e) => startResize(e, "nw")} style={{ position: "absolute", top: 0, left: 0, width: "12px", height: "12px", cursor: "nw-resize", zIndex: 101 }} />
          <div onMouseDown={(e) => startResize(e, "ne")} style={{ position: "absolute", top: 0, right: 0, width: "12px", height: "12px", cursor: "ne-resize", zIndex: 101 }} />
          <div onMouseDown={(e) => startResize(e, "sw")} style={{ position: "absolute", bottom: 0, left: 0, width: "12px", height: "12px", cursor: "sw-resize", zIndex: 101 }} />
          <div onMouseDown={(e) => startResize(e, "se")} style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", cursor: "se-resize", zIndex: 101 }} />

          {/* CHAT HEADER */}
          <div style={{ background: "linear-gradient(135deg, #1e1b4b, #4f46e5)", padding: "14px 16px", display: "flex", alignItems: "center", justifyValue: "space-between", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>🎓</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#fff" }}>DIU BLC Assistant</h3>
                <p style={{ margin: 0, fontSize: "10px", color: "#cbd5e1" }}>AI Powered • Always Available</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }}>✕</button>
          </div>

          {/* DYNAMIC OUTPUT LANGUAGE SWITCHER */}
          <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Output Language:</span>
            <div style={{ display: "flex", gap: "2px", background: "#e2e8f0", borderRadius: "6px", padding: "2px" }}>
              {(["both", "bangla", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  style={{ padding: "3px 8px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "10.5px", fontWeight: 600, background: language === l ? "#ffffff" : "transparent", color: language === l ? "#4f46e5" : "#64748b", transition: "all 0.1s ease" }}
                >
                  {langLabels[l]}
                </button>
              ))}
            </div>
          </div>

          {/* COURSE SELECTOR */}
          <div style={{ padding: "10px 14px", background: "#ffffff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>Course:</span>
            {["CSE101", "CSE201", "CSE301"].map((c) => (
              <button
                key={c}
                onClick={() => setCourseId(c)}
                style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid", borderColor: courseId === c ? "#4f46e5" : "#cbd5e1", background: courseId === c ? "#4f46e5" : "#fff", color: courseId === c ? "#fff" : "#475569", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* CHAT DISPLAY PANEL */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", background: "#fafafa" }}>
            
            {/* কুইক আস্ক সাজেশনস - সুইচ করার সাথে সাথে এর টেক্সট ল্যাঙ্গুয়েজ ও পরিবর্তন হবে */}
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>
                  {language === "bangla" ? "⚡ দ্রুত জিজ্ঞাসা করুন:" : "⚡ Quick Ask:"}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {QUICK_ASKS[language].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendQuestion(q, language)}
                      style={{ padding: "6px 10px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px", color: "#334155", cursor: "pointer", fontWeight: 500 }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* মেসেজ রেন্ডারিং */}
            {messages.map((m, i) => {
              // ইনস্ট্যান্ট ল্যাঙ্গুয়েজ ইন্টারচেঞ্জ কন্ডিশন
              let renderText = m.text;
              if (m.role === "ai") {
                if (language === "bangla" && m.textBn) renderText = m.textBn;
                if (language === "en" && m.textEn) renderText = m.textEn;
              }

              return (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    padding: "12px 14px",
                    borderRadius: m.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: m.role === "user" ? "#4f46e5" : "#ffffff",
                    color: m.role === "user" ? "#fff" : "#0f172a",
                    fontSize: "13.5px",
                    maxWidth: "90%",
                    border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                  }}>
                    {renderText}
                  </div>
                </div>
              );
            })}
            {loading && <div style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>Generating detailed response...</div>}
            <div ref={bottomRef} />
          </div>

          {/* চিপ সাজেশন লাইন */}
          {messages.length > 0 && !loading && (
            <div style={{ padding: "6px 8px", background: "#f8fafc", display: "flex", gap: "4px", overflowX: "auto", borderTop: "1px solid #e2e8f0" }}>
              {CHIPS[language].map(c => (
                <button 
                  key={c} 
                  onClick={() => sendQuestion(c, language)}
                  style={{ padding: "4px 10px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", color: "#4f46e5", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* হাই-ভিজিবিলিটি ইনপুট ডক */}
          <div style={{ padding: "12px", borderTop: "1px solid #cbd5e1", display: "flex", gap: "8px", background: "#ffffff" }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendQuestion(undefined, language)}
              placeholder={PLACEHOLDERS[language]}
              style={{ flex: 1, height: "42px", padding: "0 14px", border: "2px solid #64748b", borderRadius: "8px", fontSize: "14px", color: "#0f172a", background: "#ffffff", outline: "none", fontWeight: "500" }}
            />
            <button 
              onClick={() => sendQuestion(undefined, language)}
              disabled={loading || !question.trim()}
              style={{ width: "42px", height: "42px", borderRadius: "8px", border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyValue: "center", justifyContent: "center", fontSize: "16px" }}
            >
              ➔
            </button>
          </div>

        </div>
      )}
    </div>
  );
}