import os, shutil, tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from modules.database.course_db import get_course_context, COURSES, TEACHERS

load_dotenv()

from modules.chatbot.rag_engine   import load_course_pdf, ask_question, ask_question_stream, generate_full_notes
from modules.ews.risk_engine      import calculate_risk_scores
from modules.dashboard.kpi_engine import get_kpi_data

app = FastAPI(title="LearnGuard AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionRequest(BaseModel):
    course_id: str
    question: str
    language: str = "both"   # ← new field


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "🚀 LearnGuard AI v2 is running!", "version": "2.0.0"}


# ── Upload PDF ────────────────────────────────────────────────────────────────
@app.post("/api/chatbot/upload")
async def upload_material(course_id: str, file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "শুধু PDF file upload করা যাবে।")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    result = load_course_pdf(tmp_path, course_id)
    os.unlink(tmp_path)
    return {
        "message": f"✅ Course '{course_id}' loaded! ({result['chunks']} chunks)",
        "chunks": result["chunks"],
    }


# ── Ask (non-streaming fallback) ──────────────────────────────────────────────
@app.post("/api/chatbot/ask")
def ask(req: QuestionRequest):
    return ask_question(req.question, req.course_id, req.language)


# ── Ask (streaming — SSE) ─────────────────────────────────────────────────────
@app.post("/api/chatbot/ask-stream")
def ask_stream(req: QuestionRequest):
    def event_generator():
        for chunk in ask_question_stream(req.question, req.course_id, req.language):
            # Escape newlines so SSE stays on one "data:" line per chunk
            safe = chunk.replace("\n", "\\n")
            yield f"data: {safe}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # important for nginx proxying
        },
    )


# ── Generate Notes ────────────────────────────────────────────────────────────
@app.post("/api/chatbot/generate-notes")
def notes(course_id: str, language: str = "both"):
    return generate_full_notes(course_id, language)


# ── Early Warning System ──────────────────────────────────────────────────────
@app.get("/api/ews/students")
def get_students():
    return calculate_risk_scores()


# ── KPI Dashboard ─────────────────────────────────────────────────────────────
@app.get("/api/dashboard/kpi")
def get_kpi():
    return get_kpi_data()



@app.post("/api/chatbot/course-ask")
def course_ask(course_id: str, question: str):
    from langchain_groq import ChatGroq
    from langchain_core.prompts import PromptTemplate
    import os

    course_context = get_course_context(course_id)

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.3
    )

    prompt = f"""You are DIU BLC AI Assistant — an expert academic assistant for Daffodil International University.

You have complete knowledge of this course. Answer the student's question based on the course information below.
- Be helpful, detailed, and exam-focused
- For lecture questions: explain topics fully with examples
- For assignment/lab questions: give step-by-step instructions
- For exam questions: provide study plan and important topics
- Answer in the same language the student uses (Bangla or English)
- Always be encouraging and supportive

{course_context}

Student Question: {question}

Provide a comprehensive, helpful answer:"""

    response = llm.invoke(prompt)
    return {"answer": response.content, "course_id": course_id}

@app.get("/api/courses")
def get_courses():
    return {"courses": list(COURSES.keys()), "details": {k: {"title": v["title"], "teacher": TEACHERS.get(v["teacher"], {}).get("name", ""), "schedule": v["schedule"]} for k, v in COURSES.items()}}

@app.get("/api/courses/{course_id}")
def get_course(course_id: str):
    course = COURSES.get(course_id.upper())
    if not course:
        raise HTTPException(404, "Course not found")
    teacher = TEACHERS.get(course["teacher"], {})
    return {**course, "teacher_details": teacher}