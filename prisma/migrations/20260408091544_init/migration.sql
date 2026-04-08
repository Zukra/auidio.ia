-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ad_guid" TEXT NOT NULL,
    "ad_login" TEXT NOT NULL,
    "email" TEXT,
    "full_name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_ad_guid_key" ON "users"("ad_guid");

-- CreateIndex
CREATE UNIQUE INDEX "users_ad_login_key" ON "users"("ad_login");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
