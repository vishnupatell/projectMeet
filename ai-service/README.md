# ProjectMeet AI Service

Python FastAPI sidecar that powers post-meeting reports — transcription (faster-whisper) and summarization (Ollama + Llama 3.2). For the project overview see the [root README](../README.md).

## Endpoints

| Method | Path          | What it does                                                                 |
|--------|---------------|------------------------------------------------------------------------------|
| GET    | `/health`     | Health check. Reports Whisper model + Ollama reachability.                   |
| POST   | `/transcribe` | Runs faster-whisper on a file path (inside container). Returns text + segments. |
| POST   | `/summarize`  | Sends transcript to Ollama (Llama 3.2). Returns ~20-line summary + key points. |

See [../ProjectMeet_API_Reference.xlsx](../ProjectMeet_API_Reference.xlsx) sheet **AI Service** for full request/response examples.

## Run via Docker (recommended)

```bash
# From repo root
docker compose up -d ollama ai-service

# One-time: pull the Llama model into Ollama
docker exec projectmeet-ollama ollama pull llama3.2:3b

# Smoke test
curl http://localhost:8001/health
```

## Run standalone (development)

```bash
pip install -r requirements.txt

# Point at a running Ollama instance
export OLLAMA_URL=http://localhost:11434
export OLLAMA_MODEL=llama3.2:3b

uvicorn app:app --reload --port 8000
```

## Config (env vars)

| Variable               | Default                       | Notes                                         |
|------------------------|-------------------------------|-----------------------------------------------|
| `WHISPER_MODEL`        | `base`                        | `tiny`, `base`, `small`, `medium`, `large-v3` |
| `WHISPER_DEVICE`       | `cpu`                         | Set to `cuda` if GPU is available             |
| `WHISPER_COMPUTE_TYPE` | `int8`                        | `int8` for CPU, `float16` for GPU             |
| `OLLAMA_URL`           | `http://ollama:11434`         | Internal Docker hostname                      |
| `OLLAMA_MODEL`         | `llama3.2:3b`                 | Any model pulled into Ollama                  |

## Notes

- Whisper models are downloaded from HuggingFace on first use (~150 MB for `base`). They're cached in the `whisper_models` Docker volume so later runs are instant.
- Llama 3.2 3B summarization takes ~30-90s on CPU. Switch to `phi3:mini` (smaller) or run GPU-backed for faster turnaround.
- The `/recordings` volume is shared read-only between backend and ai-service so Whisper can read recordings the backend saved.
