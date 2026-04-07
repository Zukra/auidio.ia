PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_users" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "account" TEXT NOT NULL,
  "email" TEXT,
  "name" TEXT,
  "short_name" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_users" ("account", "email", "name", "short_name", "active", "updated_at")
SELECT "account", "email", "name", "short_name", "active", "updated_at"
FROM "users";

DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";

CREATE UNIQUE INDEX "users_account_key" ON "users"("account");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
