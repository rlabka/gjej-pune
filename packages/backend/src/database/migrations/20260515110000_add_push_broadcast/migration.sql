-- CreateTable
CREATE TABLE "PushBroadcast" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "filter" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "usersTargeted" INTEGER NOT NULL,
    "devicesTargeted" INTEGER NOT NULL,
    "devicesSent" INTEGER NOT NULL,
    "devicesFailed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PushBroadcast_createdAt_idx" ON "PushBroadcast"("createdAt");

-- CreateIndex
CREATE INDEX "PushBroadcast_adminId_idx" ON "PushBroadcast"("adminId");

-- AddForeignKey
ALTER TABLE "PushBroadcast" ADD CONSTRAINT "PushBroadcast_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
