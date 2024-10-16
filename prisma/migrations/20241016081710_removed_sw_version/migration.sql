/*
  Warnings:

  - You are about to drop the column `sw_version` on the `device_inventory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "device_inventory" DROP COLUMN "sw_version";
