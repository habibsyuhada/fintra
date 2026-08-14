-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "original_amount" DECIMAL(18,2),
ADD COLUMN     "original_currency" TEXT;
