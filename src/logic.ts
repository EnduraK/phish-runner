import type { Scenario, LevelConfig } from './data';

export interface TelemetryRecord {
  scenarioId: number;
  domainCategory: string;
  cyBOKKnowledgeArea: string;
  userSelection: 'Safe' | 'Suspicious' | 'Timeout';
  isCorrect: boolean;
  responseTimeMilliseconds: number;
}

export interface GameState {
  idx: number;
  score: number;
  lives: number;
  streak: number;
  bestStreak: number;
  correct: number;
  answered: boolean;
  paused: boolean;
  modalOpen: boolean;
  remainingTime: number;
  turnStart: number;
  history: { scenario: Scenario; chosen: string; ok: boolean }[];
  mistakes: { scenario: Scenario; chosen: string }[];
  telemetry: TelemetryRecord[];
}

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

export function calculatePoints(streak: number, multiplier: number): number {
  return (100 + (streak - 1) * 25) * multiplier;
}

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
  
  const record: TelemetryRecord = {
    scenarioId: scenario.id,
    domainCategory: scenario.type,
    cyBOKKnowledgeArea: scenario.cybok,
    userSelection: choice,
    isCorrect,
    responseTimeMilliseconds: consumedTime
  };
  const nextTelemetry = [...state.telemetry, record];

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

export function evaluateDiagnosis(telemetry: TelemetryRecord[], scenarios: Scenario[]) {
  const wrongs = telemetry.filter(t => !t.isCorrect);
  if (!wrongs.length) {
    return { title: "Phishing-aware pro", body: "You spotted every red flag this run. Keep your guard up - phishing tactics evolve." };
  }
  
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