import { BetCategory, BetStatus } from "@/generated/prisma/client";

export type { BetCategory, BetStatus };

export interface BetOptionWithStats {
  id: string;
  label: string;
  ordinal: number;
  totalCoins: number;
  wagerCount: number;
  oddsPercent: number;
}

export interface BetWithStats {
  id: string;
  title: string;
  description: string | null;
  category: BetCategory;
  status: BetStatus;
  opensAt: Date | null;
  closesAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  options: BetOptionWithStats[];
  totalCoins: number;
  wagerCount: number;
  resolution: {
    winningOptionId: string;
    winningOptionLabel: string;
    resolvedAt: Date;
    notes: string | null;
  } | null;
}

export interface AgentPublicProfile {
  id: string;
  name: string;
  balance: number;
  createdAt: Date;
  stats: {
    totalWagers: number;
    totalWon: number;
    totalLost: number;
    netProfit: number;
  };
}

export interface ApiError {
  error: string;
}
