/*
  Warnings:

  - Added the required column `user_id` to the `receipts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "receipts_user_id_idx" ON "receipts"("user_id");

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
