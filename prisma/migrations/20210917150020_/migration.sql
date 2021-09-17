/*
  Warnings:

  - A unique constraint covering the columns `[name,tenant_id]` on the table `device_blueprint` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "udx_device_blueprint_name_tenant_id";

-- CreateIndex
CREATE INDEX "idx_device_blueprint_tenant_id" ON "device_blueprint"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_blueprint_name_tenant_id_key" ON "device_blueprint"("name", "tenant_id");

-- CreateIndex
CREATE INDEX "idx_device_tenant_id" ON "device_inventory"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_label_tenant_id" ON "label"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_location_tenant_id" ON "location"("tenant_id");

-- RenameIndex
ALTER INDEX "udx_device_name_tenant_id" RENAME TO "device_inventory_name_tenant_id_key";

-- RenameIndex
ALTER INDEX "udx_device_label_device_id_label_id" RENAME TO "device_label_device_id_label_id_key";

-- RenameIndex
ALTER INDEX "udx_label_name_tenant_id" RENAME TO "label_name_tenant_id_key";

-- RenameIndex
ALTER INDEX "udx_location_name_tenant_id" RENAME TO "location_name_tenant_id_key";

-- RenameIndex
ALTER INDEX "udx_uniconfig_zone_name_tenant_id" RENAME TO "uniconfig_zone_name_tenant_id_key";
