import os
import logging
import tempfile
from typing import Optional

import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

app = FastAPI(title="ProjectMeet AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_model: Optional[WhisperModel] = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        logger.info(f"Loading Whisper model: {WHISPER_MODEL} ({WHISPER_DEVICE}/{WHISPER_COMPUTE_TYPE})")
        _model = WhisperModel(WHISPER_MODEL, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE)
        logger.info("Whisper model loaded")
    return _model


class TranscribeRequest(BaseModel):
    file_path: str
    language: Optional[str] = None


class TranscribeSegment(BaseModel):
    start: float
    end: float
    text: str


class TranscribeResponse(BaseModel):
    language: str
    full_text: str
    segments: list[TranscribeSegment]


class SummarizeRequest(BaseModel):
    text: str


class SummarizeResponse(BaseModel):
    summary: str
    key_points: list[str]


class AskRequest(BaseModel):
    transcript: str
    question: str
    user_name: Optional[str] = None


class AskResponse(BaseModel):
    answer: str


@app.get("/health")
async def health():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        pass
    return {
        "status": "ok",
        "whisper_model": WHISPER_MODEL,
        "ollama_reachable": ollama_ok,
        "ollama_model": OLLAMA_MODEL,
    }


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(req: TranscribeRequest):
    if not os.path.exists(req.file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {req.file_path}")

    try:
        model = get_model()
        segments_iter, info = model.transcribe(
            req.file_path,
            language=req.language,
            beam_size=1,
            vad_filter=True,
        )
        segments = []
        full_text_parts = []
        for seg in segments_iter:
            segments.append(TranscribeSegment(start=seg.start, end=seg.end, text=seg.text.strip()))
            full_text_parts.append(seg.text.strip())

        return TranscribeResponse(
            language=info.language,
            full_text=" ".join(full_text_parts).strip(),
            segments=segments,
        )
    except Exception as e:
        logger.exception("Transcription failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe-upload", response_model=TranscribeResponse)
async def transcribe_upload(
    file: UploadFile = File(...),
    language: Optional[str] = None,
    initial_prompt: Optional[str] = None,
):
    """Accept a raw audio blob (webm/wav/mp4) and return the transcript."""
    suffix = ".webm"
    if file.filename:
        ext = os.path.splitext(file.filename)[1]
        if ext:
            suffix = ext

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        model = get_model()
        segments_iter, info = model.transcribe(
            tmp_path,
            language=language,
            beam_size=1,
            vad_filter=True,
            initial_prompt=initial_prompt or None,
        )
        segments = []
        full_text_parts = []
        for seg in segments_iter:
            segments.append(TranscribeSegment(start=seg.start, end=seg.end, text=seg.text.strip()))
            full_text_parts.append(seg.text.strip())

        return TranscribeResponse(
            language=info.language,
            full_text=" ".join(full_text_parts).strip(),
            segments=segments,
        )
    except Exception as e:
        logger.exception("Upload transcription failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


SUMMARY_PROMPT = """You are summarizing a meeting transcript.

Produce:
1. A concise summary of the meeting in approximately 20 lines (plain prose, no bullet points, no headings).
2. 5 to 8 key discussion points as short bullet items.

Respond STRICTLY in this exact format, nothing else:

SUMMARY:
<the 20-line summary here>

KEY_POINTS:
- <point 1>
- <point 2>
- <point 3>

Transcript:
{transcript}
"""


def _parse_summary(raw: str) -> tuple[str, list[str]]:
    summary = ""
    key_points: list[str] = []
    if "KEY_POINTS:" in raw:
        summary_part, kp_part = raw.split("KEY_POINTS:", 1)
        summary = summary_part.replace("SUMMARY:", "").strip()
        for line in kp_part.splitlines():
            line = line.strip()
            if line.startswith(("- ", "* ", "• ")):
                key_points.append(line[2:].strip())
            elif line and line[0].isdigit() and "." in line[:3]:
                key_points.append(line.split(".", 1)[1].strip())
    else:
        summary = raw.replace("SUMMARY:", "").strip()
    return summary, key_points


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Empty transcript")

    prompt = SUMMARY_PROMPT.format(transcript=req.text[:24000])

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            r = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3},
                },
            )
            r.raise_for_status()
            data = r.json()
            raw = data.get("response", "")
            summary, key_points = _parse_summary(raw)
            return SummarizeResponse(summary=summary, key_points=key_points)
    except httpx.HTTPError as e:
        logger.exception("Ollama call failed")
        raise HTTPException(status_code=502, detail=f"Ollama error: {e}")


ASK_PROMPT = """You are an AI assistant helping a meeting participant catch up on what was discussed.
The participant's name is: {user_name}

Meeting transcript so far:
{transcript}

Participant's question: {question}

Answer the question based only on what is in the transcript. If the transcript doesn't contain enough information, say so clearly. Be concise and helpful. If the question is about what was said about the participant, search for their name in the transcript."""


@app.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    if not req.transcript.strip():
        return AskResponse(answer="No transcript is available yet for this meeting.")

    user_name = req.user_name or "the participant"
    prompt = ASK_PROMPT.format(
        user_name=user_name,
        transcript=req.transcript[:20000],
        question=req.question,
    )

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3},
                },
            )
            r.raise_for_status()
            data = r.json()
            return AskResponse(answer=data.get("response", "").strip())
    except httpx.HTTPError as e:
        logger.exception("Ollama ask failed")
        raise HTTPException(status_code=502, detail=f"Ollama error: {e}")
