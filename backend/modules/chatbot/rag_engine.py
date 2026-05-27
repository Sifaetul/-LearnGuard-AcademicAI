import os
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_DATASETS_OFFLINE"] = "1"

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from typing import Generator

load_dotenv()

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)


def load_course_pdf(pdf_path: str, course_id: str):
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)
    vectorstore = Chroma.from_documents(
        chunks, embeddings, persist_directory=f"./db/{course_id}"
    )
    return {"status": "success", "chunks": len(chunks)}


def _get_llm(temperature: float = 0.3, max_tokens: int = 1500, streaming: bool = False):
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=temperature,
        max_tokens=max_tokens,
        streaming=streaming,
    )


def _lang_instruction(language: str) -> str:
    if language == "english":
        return "Answer in English only."
    elif language == "bangla":
        return "উত্তর সম্পূর্ণ বাংলায় দাও।"
    else:
        return "যে ভাষায় প্রশ্ন করা হয়েছে সেই ভাষায় উত্তর দাও। বাংলা প্রশ্নের জন্য বাংলায়, English প্রশ্নের জন্য English এ।"


# ── Normal (non-streaming) ask ────────────────────────────────────────────────
def ask_question(question: str, course_id: str, language: str = "both"):
    db_path = f"./db/{course_id}"
    if not os.path.exists(db_path):
        return {"answer": "এই course এর কোনো material upload করা হয়নি।"}

    llm = _get_llm()
    vectorstore = Chroma(persist_directory=db_path, embedding_function=embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})  # k=5 for better context

    lang_note = _lang_instruction(language)

    prompt = PromptTemplate.from_template(
        """তুমি DIU এর একজন বিশেষজ্ঞ AI শিক্ষা সহকারী।
{lang_note}
নিচের course material থেকে প্রশ্নের উত্তর দাও — বিস্তারিত ও সহজভাবে।
যদি উত্তর material এ না থাকে, বলো "এই তথ্য course material এ নেই।"

Context:
{context}

প্রশ্ন: {question}

উত্তর:"""
    )

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough(), "lang_note": lambda _: lang_note}
        | prompt
        | llm
        | StrOutputParser()
    )

    answer = chain.invoke(question)
    return {"answer": answer, "course_id": course_id}


# ── Streaming ask ─────────────────────────────────────────────────────────────
def ask_question_stream(question: str, course_id: str, language: str = "both") -> Generator[str, None, None]:
    db_path = f"./db/{course_id}"
    if not os.path.exists(db_path):
        yield "এই course এর কোনো material upload করা হয়নি।"
        return

    llm = _get_llm(streaming=True)
    vectorstore = Chroma(persist_directory=db_path, embedding_function=embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

    lang_note = _lang_instruction(language)

    # Retrieve context first
    docs = retriever.invoke(question)
    context = "\n\n".join(doc.page_content for doc in docs)

    prompt_text = f"""তুমি DIU এর একজন বিশেষজ্ঞ AI শিক্ষা সহকারী।
{lang_note}
নিচের course material থেকে প্রশ্নের উত্তর দাও — বিস্তারিত ও সহজভাবে।
যদি উত্তর material এ না থাকে, বলো "এই তথ্য course material এ নেই।"

Context:
{context}

প্রশ্ন: {question}

উত্তর:"""

    for chunk in llm.stream(prompt_text):
        if chunk.content:
            yield chunk.content


# ── Generate full notes ────────────────────────────────────────────────────────
def generate_full_notes(course_id: str, language: str = "both"):
    db_path = f"./db/{course_id}"
    if not os.path.exists(db_path):
        return {"notes": "কোনো material upload করা হয়নি।"}

    llm = _get_llm(temperature=0.2, max_tokens=4000)
    vectorstore = Chroma(persist_directory=db_path, embedding_function=embeddings)

    all_docs = vectorstore.get()
    full_text = "\n\n".join(all_docs["documents"][:25])  # increased from 20 to 25

    if language == "english":
        lang_instruction = "Write EVERYTHING in English only. No Bangla."
    elif language == "bangla":
        lang_instruction = "সম্পূর্ণ বাংলায় লিখো। কোনো English ব্যবহার করো না।"
    else:
        lang_instruction = "Each topic: first English explanation, then বাংলায় ব্যাখ্যা।"

    prompt = f"""You are an expert university teacher creating COMPREHENSIVE EXAM-READY NOTES.

Language instruction: {lang_instruction}

Format the notes EXACTLY like this structure:

## 📚 Course Overview
[2-3 sentence summary of the entire course material]

## 📖 Topic-wise Detailed Notes
[For each major topic:]
### [Topic Name]
- Full explanation
- Key concepts
- Examples

## 🔑 Must-Remember Key Points
[Bullet list of the most important facts and definitions]

## ❓ Likely Exam Questions
1. [Question]
2. [Question]
...up to 10 questions with brief answer hints

## ✅ Quick Revision Summary
[One-liner for each major concept]

---
Course Material:
{full_text}

Generate complete, detailed notes now:"""

    response = llm.invoke(prompt)
    return {"notes": response.content, "course_id": course_id}