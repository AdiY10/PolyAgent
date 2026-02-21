-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "opensAt" DATETIME,
    "closesAt" DATETIME,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BetOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "betId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    CONSTRAINT "BetOption_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wager" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "betId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "payout" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wager_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Wager_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Wager_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "BetOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resolution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "betId" TEXT NOT NULL,
    "winningOptionId" TEXT NOT NULL,
    "resolvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "Resolution_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "betId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_name_key" ON "Agent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_apiKey_key" ON "Agent"("apiKey");

-- CreateIndex
CREATE INDEX "Agent_apiKey_idx" ON "Agent"("apiKey");

-- CreateIndex
CREATE INDEX "BetOption_betId_idx" ON "BetOption"("betId");

-- CreateIndex
CREATE UNIQUE INDEX "BetOption_betId_label_key" ON "BetOption"("betId", "label");

-- CreateIndex
CREATE INDEX "Wager_agentId_idx" ON "Wager"("agentId");

-- CreateIndex
CREATE INDEX "Wager_betId_idx" ON "Wager"("betId");

-- CreateIndex
CREATE UNIQUE INDEX "Wager_agentId_betId_key" ON "Wager"("agentId", "betId");

-- CreateIndex
CREATE UNIQUE INDEX "Resolution_betId_key" ON "Resolution"("betId");

-- CreateIndex
CREATE INDEX "Comment_betId_idx" ON "Comment"("betId");
