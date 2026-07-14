-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '',
    "capacity" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "price" REAL NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "purchaseId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'available',
    "brand" TEXT NOT NULL DEFAULT '',
    "ramType" TEXT NOT NULL DEFAULT '',
    "ramSize" TEXT NOT NULL DEFAULT '',
    "ramSticks" TEXT NOT NULL DEFAULT '',
    "gpuModel" TEXT NOT NULL DEFAULT '',
    "vramSize" TEXT NOT NULL DEFAULT '',
    "vramType" TEXT NOT NULL DEFAULT '',
    "storageType" TEXT NOT NULL DEFAULT '',
    "storageCapacity" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_InventoryItem" ("brand", "capacity", "category", "createdAt", "description", "id", "name", "price", "purchaseId", "quantity", "ramSize", "ramType", "source", "status", "storageCapacity", "storageType", "type", "updatedAt") SELECT "brand", "capacity", "category", "createdAt", "description", "id", "name", "price", "purchaseId", "quantity", "ramSize", "ramType", "source", "status", "storageCapacity", "storageType", "type", "updatedAt" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
CREATE UNIQUE INDEX "InventoryItem_purchaseId_key" ON "InventoryItem"("purchaseId");
CREATE TABLE "new_LedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CUP',
    "exchangeRate" REAL NOT NULL DEFAULT 1.0,
    "description" TEXT NOT NULL DEFAULT '',
    "reference" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'posted',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LedgerEntry" ("amount", "createdAt", "currency", "description", "exchangeRate", "id", "reference", "sourceId", "sourceType", "status", "type", "updatedAt") SELECT "amount", "createdAt", "currency", "description", "exchangeRate", "id", "reference", "sourceId", "sourceType", "status", "type", "updatedAt" FROM "LedgerEntry";
DROP TABLE "LedgerEntry";
ALTER TABLE "new_LedgerEntry" RENAME TO "LedgerEntry";
CREATE INDEX "LedgerEntry_sourceType_sourceId_idx" ON "LedgerEntry"("sourceType", "sourceId");
CREATE INDEX "LedgerEntry_status_idx" ON "LedgerEntry"("status");
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "storageType" TEXT NOT NULL DEFAULT '',
    "storageCapacity" TEXT NOT NULL DEFAULT '',
    "ramType" TEXT NOT NULL DEFAULT '',
    "ramSize" TEXT NOT NULL DEFAULT '',
    "ramSticks" TEXT NOT NULL DEFAULT '',
    "gpuModel" TEXT NOT NULL DEFAULT '',
    "vramSize" TEXT NOT NULL DEFAULT '',
    "vramType" TEXT NOT NULL DEFAULT '',
    "purchasePrice" REAL NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Purchase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("brand", "clientId", "createdAt", "description", "id", "model", "notes", "purchaseDate", "purchasePrice", "ramSize", "ramType", "storageCapacity", "storageType", "updatedAt") SELECT "brand", "clientId", "createdAt", "description", "id", "model", "notes", "purchaseDate", "purchasePrice", "ramSize", "ramType", "storageCapacity", "storageType", "updatedAt" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE TABLE "new_Repair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "storageType" TEXT NOT NULL DEFAULT '',
    "storageCapacity" TEXT NOT NULL DEFAULT '',
    "ramType" TEXT NOT NULL DEFAULT '',
    "ramSize" TEXT NOT NULL DEFAULT '',
    "ramSticks" TEXT NOT NULL DEFAULT '',
    "gpuModel" TEXT NOT NULL DEFAULT '',
    "vramSize" TEXT NOT NULL DEFAULT '',
    "vramType" TEXT NOT NULL DEFAULT '',
    "faultDescription" TEXT NOT NULL,
    "proposedPrice" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT NOT NULL DEFAULT '',
    "repairDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warrantyExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Repair_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Repair" ("brand", "clientId", "createdAt", "faultDescription", "id", "model", "notes", "proposedPrice", "ramSize", "ramType", "repairDate", "status", "storageCapacity", "storageType", "updatedAt", "warrantyExpires") SELECT "brand", "clientId", "createdAt", "faultDescription", "id", "model", "notes", "proposedPrice", "ramSize", "ramType", "repairDate", "status", "storageCapacity", "storageType", "updatedAt", "warrantyExpires" FROM "Repair";
DROP TABLE "Repair";
ALTER TABLE "new_Repair" RENAME TO "Repair";
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "storageType" TEXT NOT NULL DEFAULT '',
    "storageCapacity" TEXT NOT NULL DEFAULT '',
    "ramType" TEXT NOT NULL DEFAULT '',
    "ramSize" TEXT NOT NULL DEFAULT '',
    "ramSticks" TEXT NOT NULL DEFAULT '',
    "gpuModel" TEXT NOT NULL DEFAULT '',
    "vramSize" TEXT NOT NULL DEFAULT '',
    "vramType" TEXT NOT NULL DEFAULT '',
    "saleType" TEXT NOT NULL DEFAULT 'refurbished_own',
    "salePrice" REAL NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "saleDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warrantyDays" INTEGER NOT NULL DEFAULT 15,
    "warrantyExpires" DATETIME,
    "inventoryItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Sale_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("brand", "clientId", "createdAt", "description", "id", "inventoryItemId", "model", "notes", "ramSize", "ramType", "saleDate", "salePrice", "saleType", "storageCapacity", "storageType", "updatedAt", "warrantyDays", "warrantyExpires") SELECT "brand", "clientId", "createdAt", "description", "id", "inventoryItemId", "model", "notes", "ramSize", "ramType", "saleDate", "salePrice", "saleType", "storageCapacity", "storageType", "updatedAt", "warrantyDays", "warrantyExpires" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_inventoryItemId_key" ON "Sale"("inventoryItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
