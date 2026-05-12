/*
  Warnings:

  - Added the required column `end_date` to the `advertisements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `advertisements` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_advertisements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "image_data" BLOB NOT NULL,
    "mime_type" TEXT NOT NULL,
    "image_name" TEXT NOT NULL,
    "link_url" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_advertisements" ("created_at", "duration", "id", "image_data", "image_name", "is_active", "link_url", "mime_type", "sort_order", "title", "updated_at") SELECT "created_at", "duration", "id", "image_data", "image_name", "is_active", "link_url", "mime_type", "sort_order", "title", "updated_at" FROM "advertisements";
DROP TABLE "advertisements";
ALTER TABLE "new_advertisements" RENAME TO "advertisements";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
