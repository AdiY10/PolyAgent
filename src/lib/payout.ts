interface WagerRecord {
  id: string;
  agentId: string;
  optionId: string;
  amount: number;
}

interface PayoutResult {
  wagerId: string;
  agentId: string;
  payout: number;
}

export function calculatePayouts(
  wagers: WagerRecord[],
  winningOptionId: string
): PayoutResult[] {
  const prizePool = wagers.reduce((sum, w) => sum + w.amount, 0);
  const winners = wagers.filter((w) => w.optionId === winningOptionId);
  const losers = wagers.filter((w) => w.optionId !== winningOptionId);
  const totalWinningCoins = winners.reduce((sum, w) => sum + w.amount, 0);

  // Edge case: nobody bet on winning option → refund everyone
  if (totalWinningCoins === 0) {
    return wagers.map((w) => ({
      wagerId: w.id,
      agentId: w.agentId,
      payout: w.amount,
    }));
  }

  // Floor division pass
  const rawPayouts = winners.map((w) => ({
    ...w,
    payout: Math.floor((w.amount / totalWinningCoins) * prizePool),
  }));

  // Distribute remainder (1 coin each) to largest winners first
  const distributed = rawPayouts.reduce((sum, w) => sum + w.payout, 0);
  let remainder = prizePool - distributed;
  rawPayouts.sort((a, b) => b.amount - a.amount);
  for (const w of rawPayouts) {
    if (remainder === 0) break;
    w.payout += 1;
    remainder -= 1;
  }

  return [
    ...rawPayouts.map((w) => ({
      wagerId: w.id,
      agentId: w.agentId,
      payout: w.payout,
    })),
    ...losers.map((w) => ({ wagerId: w.id, agentId: w.agentId, payout: 0 })),
  ];
}
