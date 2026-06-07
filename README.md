# Phish Runner: Safe or Suspicious?

> A CyBOK-grounded browser game that trains players to spot phishing in real-world digital messages.

**[Play it live](https://endurak.github.io/phish-runner/)**

![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4.x-6E9F18?logo=vitest&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-181717?logo=github&logoColor=white)
![CyBOK v1.1.0](https://img.shields.io/badge/Curriculum-CyBOK%20v1.1.0-8B5CF6)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## What it is

Phish Runner is a lane-runner game built for a 503IT cybersecurity coursework module at CU London. Messages — phishing texts, prize scams, fake invoices, calendar invites, lecturer notes — glide toward you on a perspective-warped runway. Swerve **left for Safe** or **right for Suspicious** before each one reaches you. Every wrong answer surfaces the red flags you missed and the CyBOK concept behind them. Every run ends with a personalised diagnostic that names the kind of social-engineering lever that caught you out.

It is an attempt to make a security-awareness game that is actually fun to play and academically defensible.

## Why it exists

Built for **503IT Communication and Collaboration** at CU London (Group C, May–June 2026). The brief was a collaborative cybersecurity project; we picked phishing awareness because students consistently report it as one of the most relevant and least-trained threats they face. The game and its scenarios are grounded in **CyBOK v1.1.0** — the Cyber Security Body of Knowledge — so the content reflects established practice rather than ad-hoc folklore.

## How to play

1. **Pick a difficulty.** Beginner gives you 9 seconds per message and 5 lives; Cyber Sprint gives you 3.4 seconds and 3 lives.
2. **Try the practice round.** One free scenario with no lives lost so you learn the lane mechanic before anything counts.
3. **Play 7 randomly-drawn scenarios** from a pool of 32.
4. **Read every message.** The clock is short. Some are obviously phishing; some are subtly off; some are completely safe and reward you for not over-reacting.
5. **Swerve into the correct lane** (`← Safe` or `→ Suspicious`) before the message reaches you. Buttons or keyboard (`A`/`←`, `D`/`→`). Pause anywhere with `Space`.
6. **Mistakes pause the run** and open the anatomy modal: red-flag chips, the one-line rule to remember, and on demand the full CyBOK breakdown (target cue, attack vector, countermeasure).
7. **End screen** gives you a personalised diagnosis — the social-engineering lever you missed most — plus a per-Knowledge-Area accuracy table and a reviewable list of every mistake from the run.

## Difficulty levels

| Level | Time per message | Lives | Score multiplier |
|---|---|---|---|
| Beginner | 9.0 s | 5 | ×1 |
| Regular | 6.5 s | 4 | ×2 |
| Expert | 4.8 s | 3 | ×3 |
| Cyber Sprint | 3.4 s | 3 | ×5 |

## CyBOK grounding

All 32 scenarios are authored against named CyBOK v1.1.0 concepts. The four Knowledge Areas exercised in-game:

| CyBOK Knowledge Area | Concepts surfaced |
|---|---|
| Human Factors | Authority cues, urgency under time pressure, fear-based decision making, NEAT-compliant safe-message patterns |
| Adversarial Behaviours | Typosquatting / look-alike domains, baiting, pretexting (fake IT, recruiters, compliance), QR-code phishing (quishing), Cyber Kill Chain Delivery step |
| Privacy & Online Rights | Networked-privacy attacks, hijacked-friend channels, 2FA-code theft |
| Malware & Attack Technologies | Malware-by-attachment (double extensions such as `invoice.pdf.exe`) |

Each scenario in [`src/data.ts`](src/data.ts) carries an explicit `flags[]` array (the chips shown in-game), a `rule` (the one memorable line), and a `cybok` field naming the parent Knowledge Area.

## Tech stack

- **TypeScript 6** with strict mode (`noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`)
- **Vite 8** — development server with hot-module reload, production bundler with tree-shaking
- **Vitest 4** — unit tests for the pure logic functions
- **@tabler/icons-webfont** — icon system, bundled rather than CDN-loaded
- **GitHub Actions** — type-check → tests → build → deploy, on every push to `main`
- **GitHub Pages** — static hosting

## Architecture

Strict three-layer **separation of concerns**:

```
src/
├── data.ts        Content: Scenario + LevelConfig interfaces, LEVELS array, SCENARIOS array (32 items)
├── logic.ts       Pure brain: GameState + TelemetryRecord interfaces, createInitialState,
│                  calculatePoints, processAnswer (immutable state transition),
│                  evaluateDiagnosis (personalised coaching from telemetry)
├── main.ts        Orchestrator: imports data + logic, binds them to the DOM,
│                  renders animations, owns event handlers
├── logic.test.ts  Vitest unit tests on the pure functions
└── style.css      Visual layer (colours, animations, layout, responsive media query)
```

The logic layer has zero DOM dependencies — that is exactly what makes it directly unit-testable. The data layer can change without touching either logic or rendering. The rendering layer in `main.ts` reads from state and never mutates it directly; mutations happen through pure functions that return new immutable state.

## Run locally

Prerequisites: Node.js 18+ and Git.

```bash
git clone https://github.com/EnduraK/phish-runner.git
cd phish-runner
npm install
npm run dev        # opens at http://localhost:5173
```

Other scripts:

- `npm test` — run the Vitest unit tests once
- `npm run build` — type-check and produce a production bundle in `dist/`
- `npm run preview` — preview the production bundle at http://localhost:4173

## How deploy works

Every push to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. Checkout the repo onto an Ubuntu runner.
2. Install Node 20 and project dependencies.
3. Run the Vitest unit tests (the deploy stops here if any fail).
4. `npm run build` — TypeScript type-check, then Vite bundle.
5. Upload `dist/` as a GitHub Pages artifact.
6. Deploy to <https://endurak.github.io/phish-runner/>.

Typical end-to-end time from `git push` to live update: ~60 seconds.

## Credits

- **Khalik Oketokun** (Student ID 16085781) — Project Coordinator & Game Build Lead
- **Group C** — 503IT Communication and Collaboration, CU London, May–June 2026

Scenarios reference CyBOK v1.1.0 (Rashid et al., 2021) — see <https://www.cybok.org>.

## License

MIT — see [LICENSE](LICENSE).
