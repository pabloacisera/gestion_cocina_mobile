-- CreateTable
CREATE TABLE "Purchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "providerId" INTEGER NOT NULL,
    "totalAmount" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchaseId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "providerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Product_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("description", "id", "minStock", "name", "providerId", "quantity", "unit") SELECT "description", "id", "minStock", "name", "providerId", "quantity", "unit" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
