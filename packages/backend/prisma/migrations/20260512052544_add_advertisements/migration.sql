-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "image_data" BLOB NOT NULL,
    "mime_type" TEXT NOT NULL,
    "image_name" TEXT NOT NULL,
    "link_url" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
