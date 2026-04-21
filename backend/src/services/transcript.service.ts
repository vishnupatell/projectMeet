import path from 'path';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
const AI_RECORDINGS_PATH = process.env.AI_RECORDINGS_PATH || '/recordings';

interface TranscribeResponse {
  language: string;
  full_text: string;
  segments: Array<{ start: number; end: number; text: string }>;
}

interface SummarizeResponse {
  summary: string;
  key_points: string[];
}

function mapFilePathForAiService(backendFilePath: string): string {
  const filename = path.basename(backendFilePath);
  return path.posix.join(AI_RECORDINGS_PATH, filename);
}

export class TranscriptService {
  async getByRecordingId(recordingId: string) {
    return prisma.transcript.findUnique({ where: { recordingId } });
  }

  async ensureForRecording(recordingId: string) {
    const existing = await prisma.transcript.findUnique({ where: { recordingId } });
    if (existing) return existing;
    return prisma.transcript.create({
      data: { recordingId, status: 'PENDING' },
    });
  }

  async processRecording(recordingId: string): Promise<void> {
    const recording = await prisma.recording.findUnique({ where: { id: recordingId } });
    if (!recording) throw new NotFoundError('Recording');

    const transcript = await this.ensureForRecording(recordingId);

    try {
      await prisma.transcript.update({
        where: { id: transcript.id },
        data: { status: 'TRANSCRIBING', errorMsg: null },
      });

      const aiFilePath = mapFilePathForAiService(recording.filePath);
      logger.info({ recordingId, aiFilePath }, 'Starting transcription');

      const transcribeRes = await fetch(`${AI_SERVICE_URL}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: aiFilePath }),
      });

      if (!transcribeRes.ok) {
        const errText = await transcribeRes.text();
        throw new Error(`Transcribe failed: ${transcribeRes.status} ${errText}`);
      }

      const transcribeData = (await transcribeRes.json()) as TranscribeResponse;

      await prisma.transcript.update({
        where: { id: transcript.id },
        data: {
          status: 'SUMMARIZING',
          language: transcribeData.language,
          fullText: transcribeData.full_text,
          segments: transcribeData.segments as any,
        },
      });

      logger.info({ recordingId, textLen: transcribeData.full_text.length }, 'Transcription done, summarizing');

      let summary = '';
      let keyPoints: string[] = [];

      if (transcribeData.full_text.trim().length > 0) {
        const summarizeRes = await fetch(`${AI_SERVICE_URL}/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcribeData.full_text }),
        });

        if (!summarizeRes.ok) {
          const errText = await summarizeRes.text();
          throw new Error(`Summarize failed: ${summarizeRes.status} ${errText}`);
        }

        const summarizeData = (await summarizeRes.json()) as SummarizeResponse;
        summary = summarizeData.summary;
        keyPoints = summarizeData.key_points;
      } else {
        summary = 'No speech detected in the recording.';
      }

      await prisma.transcript.update({
        where: { id: transcript.id },
        data: {
          status: 'READY',
          summary,
          keyPoints: keyPoints as any,
        },
      });

      logger.info({ recordingId }, 'Transcript + summary ready');
    } catch (err: any) {
      logger.error({ err, recordingId }, 'Transcript pipeline failed');
      await prisma.transcript.update({
        where: { id: transcript.id },
        data: { status: 'FAILED', errorMsg: err?.message || 'Unknown error' },
      });
    }
  }

  async processRecordingAsync(recordingId: string): Promise<void> {
    this.processRecording(recordingId).catch((err) => {
      logger.error({ err, recordingId }, 'Async transcript processing error');
    });
  }

  async getMeetingTranscripts(meetingId: string) {
    return prisma.transcript.findMany({
      where: { recording: { meetingId } },
      include: {
        recording: {
          select: { id: true, filename: true, startedAt: true, endedAt: true, duration: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const transcriptService = new TranscriptService();
