-- CreateTable
CREATE TABLE "device_inventory" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50),
    "management_ip" INET,
    "config" JSON,
    "location" VARCHAR(255),
    "model" VARCHAR(255),
    "sw" VARCHAR(50),
    "sw_version" VARCHAR(50),
    "mac_address" macaddr,
    "serial_number" VARCHAR(50),
    "vendor" VARCHAR(50),
    "uniconfig_zone" INTEGER,
    "mount_parameters" JSONB,
    "username" VARCHAR(50),
    "password" VARCHAR(50),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uniconfig_zones" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "tenant_id" VARCHAR(64),

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_inventory.name_unique" ON "device_inventory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uniconfig_zones.name_unique" ON "uniconfig_zones"("name");

-- CreateIndex
CREATE INDEX "idx_uniconfig_zones_tenant_id" ON "uniconfig_zones"("tenant_id");

-- AddForeignKey
ALTER TABLE "device_inventory" ADD FOREIGN KEY ("uniconfig_zone") REFERENCES "uniconfig_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
