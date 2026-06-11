/**
 * src/logic.ts — the pure game brain (separation of concerns layer 2 of 3)
 *
 * Why a separate logic module:
 *   The architecture deliberately splits the game into three layers — data.ts
 *   holds CONTENT, logic.ts holds STATE TRANSITIONS, main.ts handles RENDERING
 *   (Sommerville, 2016). Keeping logic pure (no DOM access, no side effects)
 *   means every function in this file can be unit-tested in isolation under
 *   Vitest (Beck et al., 2001 — "working software over comprehensive
 *   documentation"), which is exactly what logic.test.ts verifies for the
 *   scoring formula.
 *
 * Why pure functions:
 *   Each function takes the current state in and returns the next state out.
 *   No hidden mutation, no DOM dependency. This makes the game brain portable
 *   (the same logic could power a CLI, a mobile build or a server-side replay)
 *   and removes whole classes of bugs that mutable state causes.
 */
import type { Scenario, LevelConfig } from './data';

/**
 * TelemetryRecord — one row of behavioural data per player decision.
 *
 * Captures NOT just whether the answer was right or wrong, but WHICH CyBOK
 * Knowledge Area the scenario sat under and HOW LONG the player spent
 * deliberating. Aggregated across a run, this lets evaluateDiagnosis()
 * surface the player's weakest cognitive lever, mirroring the per-mistake
 * coaching CyBOK Human Factors KA recommends (Rashid et al., 2021).
 *
 * The literal-union `userSelection` type was added after the first build,
 * when TypeScript's strict mode caught that `'Timeout'` (used at runtime
 * when the player did not answer) was not enforced at compile time. The
 * fix is one of the two technical challenges discussed in Appendix C.
 */
export interface TelemetryRecord {
  scenarioId: number;
  domainCategory: string;
  cyBOKKnowledgeArea: string;
  userSelection: 'Safe' | 'Suspicious' | 'Timeout';
  isCorrect: boolean;
  responseTimeMilliseconds: number;
}

/**
 * GameState — the full snapshot of one in-progress run.
 *
 * Every field is held in this one object so that the rendering layer in
 * main.ts has a single source of truth to read from. `history`, `mistakes`
 * and `telemetry` are kept as separate arrays for different reasons:
 *   - history feeds the end-screen "YOUR RUN" dot timeline,
 *   - mistakes feeds the per-mistake review panel,
 *   - telemetry feeds the personalised diagnosis (evaluateDiagnosis below).
 */
export interface GameState {
  idx: number;                  // index into the current 7-scenario deck
  score: number;                // running score, with streak + level multipliers
  lives: number;                // life counter; reaching zero ends the run
  streak: number;               // consecutive correct answers; drives bonus points
  bestStreak: number;           // best streak this run (for end-screen + Hot Streak achievement)
  correct: number;              // total correct answers this run (drives accuracy stat)
  answered: boolean;            // guard against double-answering the same scenario
  paused: boolean;              // pause flag — freezes the approach animation
  modalOpen: boolean;           // mid-game wrong-answer modal flag (blocks answers)
  remainingTime: number;        // ms left on the urgency timer for this scenario
  turnStart: number;            // Date.now() at scenario spawn — used to derive consumedTime
  history: { scenario: Scenario; chosen: string; ok: boolean }[];
  mistakes: { scenario: Scenario; chosen: string }[];
  telemetry: TelemetryRecord[];
}

/**
 * createInitialState — pure factory.
 *
 * Returns a fresh state for a chosen difficulty level. Called every time the
 * player starts a new run (PLAY, PLAY AGAIN, Daily Challenge). Because it is
 * a pure function, restarting a run can never inherit state from the previous
 * one — a class of bug we wanted to design out from day one.
 */
export const createInitialState = (level: LevelConfig): GameState => ({
  idx: 0,
  score: 0,
  lives: level.lives,
  streak: 0,
  bestStreak: 0,
  correct: 0,
  answered: false,
  paused: false,
  modalOpen: false,
  remainingTime: level.ms,
  turnStart: 0,
  history: [],
  mistakes: [],
  telemetry: []
});

/**
 * calculatePoints — the scoring formula.
 *
 * Base 100 per correct answer, plus 25 per streak step beyond the first,
 * multiplied by the level's difficulty multiplier. The streak component
 * deliberately rewards focused play over scattershot guessing; the
 * multiplier rewards taking on a harder pace.
 *
 * This formula is exactly what the Vitest suite (logic.test.ts) pins
 * down so it cannot regress silently: a streak-1 at 1x must return 100,
 * a streak-2 at 2x must return 250.
 */
export function calculatePoints(streak: number, multiplier: number): number {
  return (100 + (streak - 1) * 25) * multiplier;
}

/**
 * processAnswer — the state transition for one player decision.
 *
 * The single source of truth for what happens when the player answers.
 * Returns a new state (immutable update via the spread operator) so the
 * caller can render the consequence in main.ts without worrying that the
 * previous state has been mutated under it.
 *
 * The double-answer guard at the top (`if (state.answered)`) is what makes
 * the game robust to rapid double-clicks at the buttons — without it, a
 * lucky/unlucky double press could subtract two lives for one mistake.
 */
export function processAnswer(
  state: GameState,
  choice: 'Safe' | 'Suspicious' | 'Timeout',
  scenario: Scenario,
  multiplier: number,
  consumedTime: number
): { newState: GameState; pointsAwarded: number; isCorrect: boolean } {
  if (state.answered) return { newState: state, pointsAwarded: 0, isCorrect: false };

  const isCorrect = choice === scenario.answer;
  const nextHistory = [...state.history, { scenario, chosen: choice, ok: isCorrect }];
  const nextMistakes = isCorrect ? state.mistakes : [...state.mistakes, { scenario, chosen: choice }];

  // Telemetry row — preserves the CyBOK KA tag so the end-screen diagnosis
  // can aggregate wrong answers by Knowledge Area, not just by red-flag chip.
  const record: TelemetryRecord = {
    scenarioId: scenario.id,
    domainCategory: scenario.type,
    cyBOKKnowledgeArea: scenario.cybok,
    userSelection: choice,
    isCorrect,
    responseTimeMilliseconds: consumedTime
  };
  const nextTelemetry = [...state.telemetry, record];

  // Streak/score/life arithmetic. Streak resets to 0 on any mistake — the
  // pressure of losing the streak is part of the game's emotional design.
  let nextStreak = isCorrect ? state.streak + 1 : 0;
  let nextBestStreak = nextStreak > state.bestStreak ? nextStreak : state.bestStreak;
  let pointsAwarded = isCorrect ? calculatePoints(nextStreak, multiplier) : 0;
  let nextLives = isCorrect ? state.lives : state.lives - 1;
  let nextCorrect = isCorrect ? state.correct + 1 : state.correct;

  return {
    newState: {
      ...state,
      answered: true,
      score: state.score + pointsAwarded,
      lives: nextLives,
      streak: nextStreak,
      bestStreak: nextBestStreak,
      correct: nextCorrect,
      history: nextHistory,
      mistakes: nextMistakes,
      telemetry: nextTelemetry
    },
    pointsAwarded,
    isCorrect
  };
}

/**
 * evaluateDiagnosis — the personalised end-of-run coaching engine.
 *
 * Aggregates the telemetry of wrong answers and surfaces the single
 * red-flag the player most often missed. The four mapped categories
 * (urgency, authority, lookalike domain, credential trap) align directly
 * with CyBOK's Human Factors and Adversarial Behaviours Knowledge Areas
 * (Rashid et al., 2021). Each branch names the cognitive lever the player
 * most consistently fell for, then gives a one-line coaching cue.
 *
 * Limitation acknowledged in the report: this metric measures speed and
 * frequency of mistakes, not depth of comprehension. A fast wrong answer
 * could equally be a careless guess; a slow wrong answer could be over-
 * thinking. The end-screen surfaces both metrics independently so the
 * player can read them against each other.
 */
export function evaluateDiagnosis(telemetry: TelemetryRecord[], scenarios: Scenario[]) {
  const wrongs = telemetry.filter(t => !t.isCorrect);
  if (!wrongs.length) {
    return { title: "Phishing-aware pro", body: "You spotted every red flag this run. Keep your guard up - phishing tactics evolve." };
  }

  // Count how often each red-flag chip appeared across the player's mistakes.
  // We tally by flag rather than by KA so the diagnosis can name a specific
  // lever ("urgency", "lookalike domain") rather than a vague KA label.
  const cat: Record<string, number> = {};
  for (const w of wrongs) {
    const s = scenarios.find(x => x.id === w.scenarioId);
    if (!s || !s.flags) continue;
    for (const f of s.flags) cat[f] = (cat[f] || 0) + 1;
  }

  const top = Object.entries(cat).sort((a, b) => b[1] - a[1])[0];
  if (!top) {
    return { title: "Mixed weaknesses", body: "Review your mistakes below - each one names the specific cues that caught you." };
  }

  // Map the most-missed flag to a CyBOK-aligned coaching tile.
  // The regexes are intentionally broad so that closely-related chips
  // ("urgency", "pressure", "fear", "time") collapse into one coaching
  // category — players don't need four separate lessons for what is, in
  // CyBOK terms, the single "bounded rationality under stress" lever.
  const tag = top[0];
  const maps = [
    { regex: /urgency|pressure|fear|time/i, title: "You reacted too quickly to time pressure", body: "You missed messages that rushed you. Next run, slow down and verify the source before choosing." },
    { regex: /authority|gov|impersonation|pretexting|recruiter|id document/i, title: "You trusted official-looking names too easily", body: "Authority cues are the most-used phishing lever. Verify through an app or known phone number, not the message itself." },
    { regex: /domain|lookalike|tld|wallet/i, title: "You need to check domains more carefully", body: "Letters can lie (rnicrosoft vs microsoft). Hover-check every URL and look for slightly-off TLDs like .tk, .support." },
    { regex: /2fa|credential|seed|privacy|hacked|theft/i, title: "You were vulnerable to credential traps", body: "Never forward 2FA codes, seed phrases, or passwords - real services never ask via simple messaging channels." }
  ];

  for (const m of maps) {
    if (m.regex.test(tag)) return m;
  }
  return { title: `Most-missed flag: ${tag}`, body: "Review the mistakes configuration below for recurrent behavioral triggers." };
}
