-- CreateTable
CREATE TABLE "UniqueView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "viewerKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "UniqueView_targetType_targetId_viewerKey_key" ON "UniqueView"("targetType", "targetId", "viewerKey");
