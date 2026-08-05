-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ActionItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add new columns to meetings
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "waiting_room_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "e2ee_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: polls
CREATE TABLE IF NOT EXISTS "polls" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable: poll_votes
CREATE TABLE IF NOT EXISTS "poll_votes" (
    "id" TEXT NOT NULL,
    "poll_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable: breakout_rooms
CREATE TABLE IF NOT EXISTS "breakout_rooms" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "breakout_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable: breakout_participants
CREATE TABLE IF NOT EXISTS "breakout_participants" (
    "id" TEXT NOT NULL,
    "breakout_room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breakout_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: shared_files
CREATE TABLE IF NOT EXISTS "shared_files" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "uploader_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable: webhooks
CREATE TABLE IF NOT EXISTS "webhooks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "events" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: meeting_analytics
CREATE TABLE IF NOT EXISTS "meeting_analytics" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "total_duration" INTEGER NOT NULL DEFAULT 0,
    "peak_participants" INTEGER NOT NULL DEFAULT 0,
    "total_participants" INTEGER NOT NULL DEFAULT 0,
    "speaking_data" JSONB,
    "join_leave_log" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable: action_items
CREATE TABLE IF NOT EXISTS "action_items" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ActionItemStatus" NOT NULL DEFAULT 'PENDING',
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "polls_meeting_id_idx" ON "polls"("meeting_id");
CREATE INDEX IF NOT EXISTS "poll_votes_poll_id_idx" ON "poll_votes"("poll_id");
CREATE UNIQUE INDEX IF NOT EXISTS "poll_votes_poll_id_user_id_key" ON "poll_votes"("poll_id", "user_id");
CREATE INDEX IF NOT EXISTS "breakout_rooms_meeting_id_idx" ON "breakout_rooms"("meeting_id");
CREATE INDEX IF NOT EXISTS "breakout_participants_breakout_room_id_idx" ON "breakout_participants"("breakout_room_id");
CREATE UNIQUE INDEX IF NOT EXISTS "breakout_participants_breakout_room_id_user_id_key" ON "breakout_participants"("breakout_room_id", "user_id");
CREATE INDEX IF NOT EXISTS "shared_files_meeting_id_idx" ON "shared_files"("meeting_id");
CREATE INDEX IF NOT EXISTS "webhooks_user_id_idx" ON "webhooks"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_analytics_meeting_id_key" ON "meeting_analytics"("meeting_id");
CREATE INDEX IF NOT EXISTS "action_items_meeting_id_idx" ON "action_items"("meeting_id");
CREATE INDEX IF NOT EXISTS "action_items_assignee_id_idx" ON "action_items"("assignee_id");

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "breakout_rooms" ADD CONSTRAINT "breakout_rooms_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "breakout_participants" ADD CONSTRAINT "breakout_participants_breakout_room_id_fkey" FOREIGN KEY ("breakout_room_id") REFERENCES "breakout_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shared_files" ADD CONSTRAINT "shared_files_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shared_files" ADD CONSTRAINT "shared_files_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "meeting_analytics" ADD CONSTRAINT "meeting_analytics_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
