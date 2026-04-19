/*
  Warnings:

  - You are about to drop the column `unit` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `Product` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "providerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "measureUnit" TEXT NOT NULL DEFAULT 'KG',
    "minStock" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Product_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("description", "id", "minStock", "name", "providerId", "quantity") SELECT "description", "id", "minStock", "name", "providerId", "quantity" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
