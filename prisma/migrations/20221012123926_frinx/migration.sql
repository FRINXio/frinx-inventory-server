/*
  Warnings:

  - Added the required column `device_size` to the `device_inventory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeviceSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "device_inventory" ADD COLUMN     "device_size" TEXT NOT NULL;
