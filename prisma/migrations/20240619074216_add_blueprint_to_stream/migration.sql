-- AlterTable
ALTER TABLE "stream" ADD COLUMN     "blueprint_id" TEXT;

-- AddForeignKey
ALTER TABLE "stream" ADD CONSTRAINT "stream_blueprint_id_fkey" FOREIGN KEY ("blueprint_id") REFERENCES "device_blueprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
