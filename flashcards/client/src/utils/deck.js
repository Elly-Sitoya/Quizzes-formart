function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stable order for one attempt: fixed sequence, or a shuffle seeded by the attempt id.
export function orderCards(cards, seed, shuffle) {
  const list = [...cards];
  if (!shuffle) return list;
  const rand = mulberry32(seed * 9301 + 49297);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * Works out where the learner is, purely from the saved answers.
 * Round 1 = every card. Round N+1 = the cards missed in round N.
 * phase: 'card' (cards remaining) | 'round_break' (round finished, misses to revisit) | 'done'
 */
export function computeDeck(ordered, answers, acked = new Set()) {
  let round = 1;
  let pending = ordered;

  for (let guard = 0; guard < 200; guard++) {
    const inRound = new Map(answers.filter((a) => a.round === round).map((a) => [a.card_id, a]));
    const remaining = pending.filter((c) => !inRound.has(c.id));

    if (remaining.length) {
      return {
        phase: 'card',
        round,
        remaining,
        total: pending.length,
        answeredInRound: pending.length - remaining.length,
      };
    }

    const missed = pending.filter((c) => inRound.get(c.id)?.correct === false);
    if (!missed.length) return { phase: 'done', round, missed: [] };

    const nextStarted = answers.some((a) => a.round === round + 1);
    if (!nextStarted && !acked.has(round + 1)) {
      return { phase: 'round_break', round, missed };
    }

    round += 1;
    pending = missed;
  }
  return { phase: 'done', round, missed: [] };
}
