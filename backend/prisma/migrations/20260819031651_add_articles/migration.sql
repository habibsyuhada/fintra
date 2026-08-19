-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('UNREAD', 'READ', 'FAVORIT');

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body_md" TEXT NOT NULL,
    "topic_id" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'UNREAD',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_queue" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "context" TEXT,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE INDEX "articles_created_at_idx" ON "articles"("created_at");

-- CreateIndex
CREATE INDEX "topic_queue_used_at_idx" ON "topic_queue"("used_at");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topic_queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
