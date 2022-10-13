/*
  Warnings:

  - Changed the type of `device_size` on the `device_inventory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "device_inventory" DROP COLUMN "device_size",
ADD COLUMN     "device_size" "DeviceSize" NOT NULL;
