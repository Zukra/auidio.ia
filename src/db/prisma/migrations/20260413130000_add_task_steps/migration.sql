-- CreateTable
CREATE TABLE "task_steps" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "task_id" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_steps_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "task_steps_task_id_idx" ON "task_steps"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_steps_task_id_step_name_key" ON "task_steps"("task_id", "step_name");
