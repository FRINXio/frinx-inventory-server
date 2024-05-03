-- CreateTable
CREATE TABLE "stream" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "device_name" TEXT NOT NULL,
    "stream_name" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "stream_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stream_device_name_stream_name_tenant_id_key" ON "stream"("device_name", "stream_name", "tenant_id");

-- AddForeignKey
ALTER TABLE "stream" ADD CONSTRAINT "stream_device_name_tenant_id_fkey" FOREIGN KEY ("device_name", "tenant_id") REFERENCES "device_inventory"("name", "tenant_id") ON DELETE RESTRICT ON UPDATE CASCADE;
