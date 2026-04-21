-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "meeting_invitations" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "error_msg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_invitations_meeting_id_idx" ON "meeting_invitations"("meeting_id");

-- CreateIndex
CREATE INDEX "meeting_invitations_email_idx" ON "meeting_invitations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_invitations_meeting_id_email_key" ON "meeting_invitations"("meeting_id", "email");

-- AddForeignKey
ALTER TABLE "meeting_invitations" ADD CONSTRAINT "meeting_invitations_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
