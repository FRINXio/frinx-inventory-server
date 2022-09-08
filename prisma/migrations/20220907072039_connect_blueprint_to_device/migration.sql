-- AlterTable
ALTER TABLE "device_inventory" ADD COLUMN     "blueprint_id" TEXT,
ADD COLUMN     "device_type" TEXT,
ADD COLUMN     "version" TEXT;

-- AddForeignKey
ALTER TABLE "device_inventory" ADD CONSTRAINT "device_inventory_blueprint_id_fkey" FOREIGN KEY ("blueprint_id") REFERENCES "device_blueprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
