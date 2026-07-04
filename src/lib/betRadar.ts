// Wett-Radar: identifiziert Ausgänge mit positivem Erwartungswert
// (EV = Modellwahrscheinlichkeit x Dezimalquote - 1) und führt ein
// Paper-Trading-Konto, das die Empfehlungen out-of-sample bewertet.
//
// WICHTIG: Der In-Sample-Backtest der Gruppenphase zeigte KEINEN robusten
// Edge (siehe docs/calibration-analysis.md). Das Radar ist ein
// Erkenntnis-Werkzeug — das Paper-Konto zeigt ehrlich, ob das Modell dem
// Markt tatsächlich Geld abnehmen würde.

import type { MatchEntry } from './useMatches';
import type { RawOdds } from './fetchOdds';

export type ValueBet = {
  matchId: string;        // "HOME-AWAY"
  home: string;
  away: string;
  kickoff: string;
  side: 'H' | 'D' | 'A';
  odds: number;           // Dezimalquote (inkl. Marge)
  prob: number;           // Modellwahrscheinlichkeit (Blend, kalibriert)
  ev: number;             // Erwartungswert, z.B. 0.08 = +8 %
  kelly: number;          // Quarter-Kelly-Einsatz als Anteil der Bankroll (0-1)
};

const KELLY_FRACTION = 0.25;
export const MIN_EV = 0.05; // Anzeige-Schwelle: +5 % Erwartungswert

export function kellyStake(prob: number, odds: number, fraction = KELLY_FRACTION): number {
  if (odds <= 1) return 0;
  const f = fraction * (prob * odds - 1) / (odds - 1);
  return Math.max(0, Math.min(0.1, f)); // Deckel: nie mehr als 10 % der Bankroll
}

export function evOf(prob: number, odds: number): number {
  return prob * odds - 1;
}

/**
 * Liefert alle Value-Wetten (EV > minEv) für noch nicht gestartete Spiele.
 * rawOdds wird injiziert (statt localStorage direkt), damit testbar.
 */
export function computeValueBets(
  matches: MatchEntry[],
  rawOdds: Record<string, RawOdds>,
  minEv = MIN_EV,
): ValueBet[] {
  const bets: ValueBet[] = [];
  const now = Date.now();

  for (const m of matches) {
    if (m.finished || m.live) continue;
    if (new Date(m.kickoff).getTime() <= now) continue;

    const key = `${m.home}-${m.away}`;
    const revKey = `${m.away}-${m.home}`;
    const fwd = rawOdds[key];
    const rev = rawOdds[revKey];
    const odds: RawOdds | null = fwd ?? (rev ? { h: rev.a, d: rev.d, a: rev.h } : null);
    if (!odds) continue;

    // K.o.-Spiele: keine Remis-Empfehlung — 1X2 gilt fuer 90 Minuten, aber
    // unsere Ergebnisdaten enthalten Verlaengerung; ein Remis-Settlement
    // waere nicht zuverlaessig abbildbar. (H/A-Wetten, die erst in der
    // Verlaengerung entschieden werden, zaehlen im Paper-Konto als gewonnen —
    // leicht optimistischer als echte Buchmacher-Regeln.)
    const sides: Array<['H' | 'D' | 'A', number, number]> = m.result.knockout
      ? [['H', m.result.pH, odds.h], ['A', m.result.pA, odds.a]]
      : [['H', m.result.pH, odds.h], ['D', m.result.pD, odds.d], ['A', m.result.pA, odds.a]];

    for (const [side, prob, o] of sides) {
      if (!o || o <= 1) continue; // kein Preis verfuegbar
      const ev = evOf(prob, o);
      if (ev <= minEv) continue;
      bets.push({
        matchId: key,
        home: m.home, away: m.away, kickoff: m.kickoff,
        side, odds: o, prob, ev,
        kelly: kellyStake(prob, o),
      });
    }
  }

  return bets.sort((a, b) => b.ev - a.ev);
}

// ---------------------------------------------------------------------------
// Paper-Trading-Konto (localStorage)
// ---------------------------------------------------------------------------

const PAPER_KEY = 'wm_paperlog_v1';

export type PaperBet = {
  matchId: string;
  side: 'H' | 'D' | 'A';
  odds: number;
  ev: number;
  stake: number;                 // Anteil der Bankroll (Quarter-Kelly zum Zeitpunkt der Empfehlung)
  ts: number;
  result: 'open' | 'won' | 'lost';
};

function loadPaper(): PaperBet[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    return JSON.parse(localStorage.getItem(PAPER_KEY) ?? '[]');
  } catch { return []; }
}

function savePaper(bets: PaperBet[]): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(PAPER_KEY, JSON.stringify(bets));
  } catch { /* ignore */ }
}

/**
 * Protokolliert neue Empfehlungen (einmal pro Spiel+Seite, erste Quote zählt)
 * und rechnet offene Wetten ab, sobald das Ergebnis feststeht.
 */
export function updatePaperLog(bets: ValueBet[], matches: MatchEntry[]): void {
  const log = loadPaper();
  let changed = false;

  // Neue Empfehlungen aufnehmen
  for (const b of bets) {
    if (log.some(p => p.matchId === b.matchId && p.side === b.side)) continue;
    log.push({
      matchId: b.matchId, side: b.side, odds: b.odds,
      ev: b.ev, stake: b.kelly, ts: Date.now(), result: 'open',
    });
    changed = true;
  }

  // Offene Wetten abrechnen
  for (const p of log) {
    if (p.result !== 'open') continue;
    const m = matches.find(x => `${x.home}-${x.away}` === p.matchId);
    if (!m?.finished || !m.actual) continue;
    const actual: 'H' | 'D' | 'A' = m.actual.g1 > m.actual.g2 ? 'H'
      : m.actual.g1 < m.actual.g2 ? 'A' : 'D';
    p.result = actual === p.side ? 'won' : 'lost';
    changed = true;
  }

  if (changed) savePaper(log);
}

export type PaperSummary = {
  open: number;
  settled: number;
  won: number;
  staked: number;   // Summe der Einsätze (Bankroll-Anteile)
  returned: number; // Summe der Auszahlungen
  roi: number;      // (returned - staked) / staked, 0 wenn nichts abgerechnet
};

export function paperSummary(): PaperSummary {
  const log = loadPaper();
  const settled = log.filter(p => p.result !== 'open');
  const staked = settled.reduce((s, p) => s + p.stake, 0);
  const returned = settled.reduce((s, p) => s + (p.result === 'won' ? p.stake * p.odds : 0), 0);
  return {
    open: log.length - settled.length,
    settled: settled.length,
    won: settled.filter(p => p.result === 'won').length,
    staked, returned,
    roi: staked > 0 ? (returned - staked) / staked : 0,
  };
}
