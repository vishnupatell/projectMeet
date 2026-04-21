-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "TranscriptStatus" AS ENUM ('PENDING', 'TRANSCRIBING', 'SUMMARIZING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "recordings" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "recorded_by_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "mime_type" TEXT NOT NULL DEFAULT 'video/webm',
    "status" "RecordingStatus" NOT NULL DEFAULT 'PROCESSING',
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL,
    "recording_id" TEXT NOT NULL,
    "status" "TranscriptStatus" NOT NULL DEFAULT 'PENDING',
    "language" TEXT,
    "full_text" TEXT,
    "segments" JSONB,
    "summary" TEXT,
    "key_points" JSONB,
    "error_msg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recordings_meeting_id_idx" ON "recordings"("meeting_id");

-- CreateIndex
CREATE INDEX "recordings_recorded_by_id_idx" ON "recordings"("recorded_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_recording_id_key" ON "transcripts"("recording_id");

-- CreateIndex
CREATE INDEX "transcripts_recording_id_idx" ON "transcripts"("recording_id");

-- AddForeignKey
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
