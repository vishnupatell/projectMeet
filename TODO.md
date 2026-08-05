# TODO - Next Implementation Priorities

## 1. Virtual Backgrounds & Noise Suppression
- [ ] Integrate `@mediapipe/selfie_segmentation` for real-time body segmentation
- [ ] Implement Canvas/WebGL pipeline to composite video frames (blur, custom backgrounds)
- [ ] Add background image uploads & presets (office, nature, abstract, etc.)
- [ ] Integrate RNNoise (via WebAssembly) or Web Audio API noise gate for noise suppression
- [ ] Connect to `VirtualBackground.tsx` component (UI shell already exists)
- [ ] Test performance on lower-end devices (consider quality/FPS tradeoffs)

## 2. Calendar Integration
- [ ] Google Calendar OAuth2 setup (requires Google Cloud Console project + credentials)
- [ ] Microsoft Graph API integration for Outlook calendar sync
- [ ] Backend routes: `POST /api/calendar/connect`, `GET /api/calendar/events`, `POST /api/calendar/sync`
- [ ] Auto-create calendar events when scheduling a meeting
- [ ] Auto-insert meeting join link into calendar event description
- [ ] Reminder emails/push notifications before scheduled meetings (cron job or worker)
- [ ] Frontend: Calendar connect UI in Settings page
- [ ] Frontend: Show synced calendar events on dashboard

## Notes
- Virtual backgrounds require ~10MB model download on first use (MediaPipe/TF.js)
- Calendar integration requires OAuth API keys (Google Cloud + Azure AD)
- Both features have UI scaffolding already in place — need backend + real processing logic

## 3. AI Optimization (High Priority)

### Quick Wins (1-2 hours)
- [ ] **Whisper Transcription**: Increase `beam_size` from 1 to 5 for +15-25% accuracy
- [ ] Enable `word_timestamps=True` for word-level granularity
- [ ] Add `condition_on_previous_text=True` for better context continuity
- [ ] Set `temperature=0.0` for deterministic transcription output
- [ ] **LLM Prompts**: Improve prompts with few-shot examples (ask, summarize, action items)
- [ ] **Action Items**: Fix JSON parsing with proper validation + retry logic
- [ ] Reduce temperature to 0.1 for structured outputs (action items, translation)

### Medium Effort (Half day)
- [ ] **Smart Chunking**: Implement sentence-based chunking instead of crude 20k char truncation
- [ ] **Conversation Memory**: Add chat history (last 4 messages) to ask endpoint for context
- [ ] **Model Upgrade**: Upgrade Ollama model from llama3.2:3b to llama3.2:8b (+30-40% better responses)
- [ ] **Error Handling**: Add retry logic for failed LLM calls with exponential backoff
- [ ] **Response Streaming**: Implement SSE streaming for real-time AI responses (better UX)
- [ ] **Frontend**: Display word-level timestamps in LiveTranscript component

### Advanced (1-2 days)
- [ ] **RAG Implementation**: Vector embeddings + similarity search for long meetings (ChromaDB/Pinecone)
- [ ] **Speaker Diarization**: Implement speaker identification (who said what) using pyannote.audio
- [ ] **Embedding Cache**: Cache transcript embeddings for faster Q&A retrieval
- [ ] **Prompt Tuning**: A/B test and fine-tune prompts based on user feedback
- [ ] **Multi-turn Dialogue**: Implement proper conversation state management in AI assistant
- [ ] **Custom Fine-tuning**: Fine-tune smaller model on domain-specific meeting data

### Expected Impact
- Transcription accuracy: **+15-25%** with beam_size=5 + word timestamps
- LLM response relevance: **+30-40%** with better prompts + 8b model
- Action items extraction: **+50% reliability** with proper JSON validation
- User experience: **Instant feedback** with streaming, **better context** with conversation history

### Technical Notes
- beam_size=5 is ~5x slower but worth it for accuracy (still real-time for most recordings)
- llama3.2:8b requires ~8GB RAM (Docker container needs memory limit increase)
- RAG requires vector DB (add ChromaDB/Milvus service to docker-compose.yml)
- Speaker diarization adds ~2-3s processing time per minute of audio
