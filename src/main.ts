/**
 * src/main.ts — the DOM orchestrator (separation of concerns layer 3 of 3).
 *
 * This is the only file in the project that touches the DOM directly. It
 * imports scenarios from data.ts and pure-state transitions from logic.ts,
 * then binds them to the rendered page — screens, animations, click handlers,
 * keyboard shortcuts, sound effects, vibration, achievements, daily challenge,
 * share API, PWA install prompt.
 *
 * WHY THIS SEPARATION
 * -------------------
 * The three-file split (data / logic / main) is textbook separation of
 * concerns (Sommerville, 2016). The benefits, in plain terms:
 *
 *   - logic.ts can be unit-tested without a browser (and is — see
 *     logic.test.ts and the GitHub Actions CI/CD output).
 *   - data.ts can be edited by the team's researcher without risk of
 *     breaking the game loop.
 *   - main.ts can be replaced wholesale (e.g., port to React Native, or
 *     to a WebGL renderer) without touching either of the other two.
 *
 * EVENT FLOW (one round)
 * ----------------------
 *   1. spawn()         — pulls deck[state.idx] from data.ts, renders the
 *                        message card, kicks off the urgency animation.
 *   2. user clicks Safe or Suspicious (or keyboard / swipe / timeout)
 *   3. answer()        — calls processAnswer() from logic.ts to compute
 *                        the new state immutably, then renders the result.
 *   4. collide()       — on a wrong answer, opens the mid-game modal with
 *                        the red-flag chips and rule callout from data.ts.
 *   5. next() / gameOver() — advances the deck or ends the run.
 *
 * v2.4 BUTTONS PACK
 * -----------------
 * In v2.4 we added an explicit Back-to-menu (Home) and Restart icon to the
 * HUD plus an End-run option inside the pause overlay, because external
 * testers (Josh, Saleem) both reported they wanted to bail out of a long
 * Cyber Sprint run without losing their highest streak. ESC and R are
 * bound for keyboard players. See quitToMenu / restartRun / endRunNow below.
 */
import './style.css';
import { SCENARIOS, LEVELS, type Scenario } from './data';
import { createInitialState, processAnswer, evaluateDiagnosis, type GameState } from './logic';

const CONFETTI_COLORS = ['#FFD93D','#FF6B6B','#4ECDC4','#5DCAA5','#FAC775','#A78BFA','#60A5FA','#F472B6','#34D399'];
const $ = (id: string) => (document.getElementById(id) || (() => { console.warn('[phish] missing #'+id); return document.createElement('div'); })()) as HTMLElement;

let state: GameState = createInitialState(LEVELS[0]);
let currentLevel = LEVELS[0];
let deck: Scenario[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let advanceT: ReturnType<typeof setTimeout> | null = null;
let pendingLevel = 0;

function show(s: string) {
  ["screen-start", "screen-practice", "screen-game", "screen-over"].forEach(x => {
    const el = document.getElementById(x);
    if(el) el.classList.add("hidden");
  });
  const target = document.getElementById(s);
  if(target) target.classList.remove("hidden");
  document.body.classList.toggle("is-playing", s === "screen-game" || s === "screen-practice");
  // v2.4.1: entering the game screen always clears any stale pause overlay
  if (s === "screen-game") {
    const gp = document.getElementById("g-paused");
    if (gp) gp.classList.add("hidden");
    const gm = document.getElementById("g-modal");
    if (gm) gm.classList.add("hidden");
  }
}

function shuffle(a: Scenario[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function setLives() {
  let h = "";
  for (let i = 0; i < currentLevel.lives; i++) {
    h += `<i class="ti ti-heart" style="color:${i < state.lives ? 'var(--danger)' : 'rgba(255,255,255,.2)'}"></i>`;
  }
  $("g-lives").innerHTML = h;
}

function setStreak(prev: number) {
  const el = $("g-streak");
  if (state.streak > 1) {
    $("g-streak-n").textContent = state.streak.toString();
    el.style.opacity = "1";
    el.classList.add("active");
  } else {
    el.style.opacity = "0";
    el.classList.remove("active");
  }
  if (state.streak === 3 && prev === 2) {
    const h = document.querySelector(".hud") as HTMLElement;
    if(h) {
      h.classList.remove("hud-shake");
      void h.offsetWidth;
      h.classList.add("hud-shake");
    }
  }
}

function buildStars() {
  const c = $("g-stars");
  if (!c) return;
  let h = '';
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * 100, y = Math.random() * 45, d = Math.random() * 3, s = 1 + Math.random() * 2;
    h += `<div class="star" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-delay:${d}s;"></div>`;
  }
  c.innerHTML = h;
}

function buildLevels() {
  const map: Record<string, string[]> = {
    safe: ["--safe-bg", "--safe-ink", "--safe-l"],
    blue: ["--blue-bg", "--blue-ink", "--blue"],
    amber: ["--amber-bg", "--amber-ink", "--amber"],
    sus: ["--sus-bg", "--sus-ink", "--sus-l"]
  };
  
  $("level-grid").innerHTML = LEVELS.map((L, i) => {
    const c = map[L.accent];
    const best = loadBest(L.name);
    const bestBadge = best > 0 ? `<span class="lvl-best" style="display:block;font-size:11px;color:${"#" + c[1].slice(2)};margin-top:2px;font-weight:600;letter-spacing:.04em;">★ BEST ${best.toLocaleString()}</span>` : "";
    return `<button class="lvl" data-i="${i}" data-accent="${L.accent}" style="border-color:var(${c[2]});">
      <div style="flex:none;width:44px;height:44px;border-radius:10px;background:var(${c[0]});display:flex;align-items:center;justify-content:center;"><i class="ti ${L.icon}" style="font-size:24px;color:var(${c[1]});"></i></div>
      <div><p style="margin:0;font-weight:600;font-size:15px;color:var(${c[1]});">${L.name}</p><p style="margin:1px 0 0;font-size:12px;color:var(--muted);">${L.blurb}</p>${bestBadge}</div></button>`;
  }).join("");
  
  document.querySelectorAll(".lvl").forEach(b => {
    b.addEventListener("click", () => enterPractice(parseInt((b as HTMLElement).dataset.i || "0")));
  });
}

function enterPractice(i: number) {
  pendingLevel = i;
  $("pr-explain").classList.add("hidden");
  $("pr-go").classList.add("hidden");
  $("pr-choice").classList.remove("hidden");
  show("screen-practice");
}

function practiceAnswer(c: string) {
  $("pr-choice").classList.add("hidden");
  $("pr-status").textContent = c === "Suspicious" ? "Spotted it. This is suspicious." : "Not quite - here's why. This is suspicious.";
  $("pr-explain").classList.remove("hidden");
  $("pr-go").classList.remove("hidden");
  // v2.3.4: scroll Start Real Game into view so user always sees it
  setTimeout(() => { try { $("pr-start").scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {} }, 80);
}

function startGame(li: number) {
  currentLevel = LEVELS[li];
  deck = shuffle(SCENARIOS).slice(0, 7);
  state = createInitialState(currentLevel);
  
  $("g-score").textContent = "0";
  setLives();
  setStreak(0);
  
  $("g-paused").classList.add("hidden");
  $("g-modal").classList.add("hidden");
  show("screen-game");
  buildStars();
  showLaneReminder(() => spawn());
}

function showLaneReminder(then: () => void) {
  // v2.4.1: lane reminder is now tap-to-skip so players never get stuck waiting.
  // Auto-advance after 2s. Tapping the reminder OR the stage skips immediately.
  const stage = $("stage");
  const r = document.createElement('div');
  r.className = 'lane-reminder';
  r.innerHTML = '<span class="lr-tag lr-safe"><i class="ti ti-arrow-left-circle" aria-hidden="true"></i> SAFE LANE</span><span class="lr-vs">vs</span><span class="lr-tag lr-sus">SUSPICIOUS LANE <i class="ti ti-arrow-right-circle" aria-hidden="true"></i></span>';
  stage.appendChild(r);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    try { r.remove(); } catch(_) {}
    if (then) then();
  };
  r.addEventListener('click', finish);
  setTimeout(finish, 2000);
  // Failsafe: if for any reason the timeout never fires (page hidden, throttled tab),
  // a backup timer guarantees we never leave the message stuck on "Loading..."
  setTimeout(finish, 4000);
}

function highlightMalicious(t: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc(t).replace(/((?:[a-z0-9-]+\.)+[a-z]{2,})(\/[^\s]*)?/gi, m => `<span class="url-mal">${m}</span>`);
}

function spawn() {
  const s = deck[state.idx];
  $("g-icon").className = "ti " + s.icon;
  $("g-type").textContent = s.type;
  $("g-text").innerHTML = highlightMalicious(s.message);
  $("g-num").textContent = (state.idx + 1) + " / " + deck.length;
  
  const m = $("g-msg");
  m.style.animation = "none";
  void m.offsetWidth;
  m.style.animation = `approach ${currentLevel.ms}ms linear forwards`;
  m.style.animationPlayState = "running";
  
  const v = $("g-vignette");
  v.style.animation = "none";
  void v.offsetWidth;
  v.style.animation = `urgent ${currentLevel.ms}ms linear forwards`;
  v.style.animationPlayState = "running";
  
  state.answered = false;
  state.paused = false;
  state.modalOpen = false;
  $("g-char").style.transform = "translateX(-50%)";
  $("g-fb").style.background = "var(--panel2)";
  $("g-fb").innerHTML = '<p style="margin:0;color:var(--muted);"><i class="ti ti-info-circle" style="font-size:14px;vertical-align:-2px;margin-right:4px;"></i>Read it, then swerve - left for Safe, right for Suspicious.</p>';
  
  state.turnStart = Date.now();
  state.remainingTime = currentLevel.ms;
  
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    if (!state.answered && !state.paused) collide("missed");
  }, currentLevel.ms);
}

function popup(t: string, c: string, big: boolean = false) {
  const p = $("g-popup");
  const tx = $("g-popup-txt");
  tx.textContent = t;
  tx.style.color = c || "#fff";
  tx.classList.toggle("big", !!big);
  p.style.display = "block";
  p.classList.remove("pop");
  void p.offsetWidth;
  p.classList.add("pop");
  setTimeout(() => p.style.display = "none", 1100);
}

function flash(c: string) {
  const f = $("g-flash");
  f.style.background = c;
  setTimeout(() => f.style.background = "rgba(0,0,0,0)", 250);
}

function fireConfetti() {
  const container = $("g-confetti");
  const corners = [
    {x:0, y:0, dx:1, dy:1}, {x:100, y:0, dx:-1, dy:1},
    {x:0, y:100, dx:1, dy:-1}, {x:100, y:100, dx:-1, dy:-1}
  ];
  corners.forEach(corner => {
    for (let i = 0; i < 18; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const shape = Math.random();
      piece.style.background = color;
      piece.style.left = corner.x + '%';
      piece.style.top = corner.y + '%';
      if (shape < 0.33) { piece.style.borderRadius = '50%'; piece.style.width = '8px'; piece.style.height = '8px'; }
      else if (shape < 0.66) { piece.style.width = '6px'; piece.style.height = '12px'; }
      else { piece.style.width = '10px'; piece.style.height = '4px'; }
      const dist = 180 + Math.random() * 160;
      const spread = (Math.random() - 0.5) * 120;
      const tx = corner.dx * dist + spread;
      const ty = corner.dy * dist + (Math.random() - 0.5) * 80;
      const tr = (Math.random() * 720 - 360);
      piece.style.setProperty('--tx', tx + 'px');
      piece.style.setProperty('--ty', ty + 'px');
      piece.style.setProperty('--tr', tr + 'deg');
      piece.style.animationDuration = (1.2 + Math.random() * 0.8) + 's';
      piece.style.animationDelay = (Math.random() * 0.15) + 's';
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 2200);
    }
  });
  const ring = document.createElement('div');
  ring.className = 'success-ring';
  $("stage").appendChild(ring);
  setTimeout(() => ring.remove(), 850);
}

function showWarning() {
  const w = $("g-warning");
  w.classList.remove('show');
  void w.offsetWidth;
  w.classList.add('show');
  setTimeout(() => w.classList.remove('show'), 1200);
}

function pauseGame() {
  if ($("screen-game").classList.contains("hidden") || state.answered || state.paused || state.modalOpen) return;
  state.paused = true;
  if(timer) clearTimeout(timer);
  state.remainingTime = state.remainingTime - (Date.now() - state.turnStart);
  $("g-msg").style.animationPlayState = "paused";
  $("g-floor").style.animationPlayState = "paused";
  $("g-vignette").style.animationPlayState = "paused";
  $("g-paused").classList.remove("hidden");
}

function resumeGame() {
  // v2.4.1: ALWAYS hide overlay and reset paused, even if state thinks we are not paused.
  // Fixes the "Paused + Loading..." stuck state where overlay shows but state desyncs.
  state.paused = false;
  $("g-paused").classList.add("hidden");
  $("g-msg").style.animationPlayState = "running";
  $("g-floor").style.animationPlayState = "running";
  $("g-vignette").style.animationPlayState = "running";
  state.turnStart = Date.now();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    if (!state.answered && !state.paused) collide("missed");
  }, Math.max(200, state.remainingTime));
}

function togglePause() {
  state.paused ? resumeGame() : pauseGame();
}

function answer(choice: 'Safe' | 'Suspicious') {
  if (state.answered || state.paused || state.modalOpen) return;
  if (timer) clearTimeout(timer);
  
  const scenario = deck[state.idx];
  const consumed = Math.max(0, Date.now() - state.turnStart);
  const ms = Math.min(currentLevel.ms, currentLevel.ms - state.remainingTime + consumed);
  
  const prevStreak = state.streak;
  const result = processAnswer(state, choice, scenario, currentLevel.mult, ms);
  state = result.newState;

  $("g-char").style.transform = choice === "Safe" ? "translateX(-180%)" : "translateX(80%)";
  $("g-msg").style.animationPlayState = "paused";
  $("g-vignette").style.animationPlayState = "paused";

  if (result.isCorrect) {
    $("g-score").textContent = state.score.toString();
    setStreak(prevStreak);
    flash("rgba(29,158,117,.25)");
    fireConfetti();
    const big = state.streak >= 3;
    popup((state.streak > 1 ? "STREAK x" + state.streak + "  " : "") + "+" + result.pointsAwarded, "var(--safe-l)", big);
    feedback(true, scenario);
    // v2.0: sound + haptic
    sfx(big ? "streak" : "correct");
    haptic([8]);
    if (advanceT) clearTimeout(advanceT);
    advanceT = setTimeout(next, 1900);
  } else {
    setStreak(0);
    // v2.0: sound + haptic on wrong answer
    sfx("wrong");
    haptic([30, 40, 30]);
    collide("wrong", scenario);
  }
}

function collide(reason: string, sc?: Scenario) {
  const scenario = sc || deck[state.idx];
  
  if(reason === "missed") {
      const consumed = Math.max(0, Date.now() - state.turnStart);
      const ms = Math.min(currentLevel.ms, currentLevel.ms - state.remainingTime + consumed);
      state = processAnswer(state, 'Timeout', scenario, currentLevel.mult, ms).newState;
  }

  setLives();
  setStreak(0);
  flash("rgba(226,75,74,.3)");
  $("stage").classList.add("shake");
  setTimeout(() => $("stage").classList.remove("shake"), 500);
  showWarning();
  
  popup(reason === "missed" ? "TOO LATE" : "WRONG LANE", "#FFD93D");
  feedback(false, scenario);
  
  state.modalOpen = true;
  showAnatomy(scenario, reason);
}

function chipMarkup(s: Scenario) {
  const cls = s.answer === "Suspicious" ? "chip-sus" : "chip-safe";
  return (s.flags || []).map(f => `<span class="chip ${cls}"><i class="ti ${s.answer === "Suspicious" ? "ti-alert-triangle" : "ti-circle-check"}" aria-hidden="true"></i>${f}</span>`).join("");
}

function ruleMarkup(s: Scenario) {
  return `<i class="ti ti-bulb" aria-hidden="true"></i><div><strong>Remember</strong>${s.rule}</div>`;
}

function showAnatomy(s: Scenario, reason: string) {
  let title;
  if (reason === "missed") title = "Time's up";
  else if (s.answer === "Suspicious") title = "Missed - that was suspicious";
  else title = "False alarm - that one was safe";

  $("m-title").textContent = title;
  $("m-chips").innerHTML = chipMarkup(s);
  $("m-rule").innerHTML = ruleMarkup(s);
  $("m-target").innerHTML = `<code>${s.breakdown.targetCue}</code>`;
  $("m-vector").textContent = s.breakdown.attackVector;
  $("m-counter").textContent = s.breakdown.countermeasure;
  $("m-cybok").textContent = s.cybok;
  
  $("m-deep").classList.add("hidden");
  $("m-chips").classList.remove("show");
  $("m-flag-label").classList.remove("show");
  $("m-show-deep").classList.remove("hidden");
  $("g-modal").classList.remove("hidden");
  // v2.3.2 safety: if user doesnt dismiss in 12s, force advance
  setTimeout(() => { if (state.modalOpen) { console.warn("[phish] safety auto-dismiss"); dismissModal(); } }, 12000);
}

function dismissModal() {
  if (!state.modalOpen) return;
  state.modalOpen = false;
  try { $("g-modal").classList.add("hidden"); } catch (e) { console.warn(e); }
  try {
    if (state.lives <= 0) { gameOver(); } else { next(); }
  } catch (e) {
    console.error('[phish] dismiss->next failed, force advancing:', e);
    state.idx++;
    if (state.idx >= deck.length) { try { gameOver(); } catch(_) {} } else { try { spawn(); } catch(_) {} }
  }
}

function feedback(ok: boolean, s: Scenario) {
  const fb = $("g-fb");
  const bg = ok ? "var(--safe-bg)" : "var(--sus-bg)";
  const ac = ok ? "var(--safe-ink)" : "var(--sus-ink)";
  const status = ok ? (s.answer === "Suspicious" ? "Spotted the red flags" : "Correct - this one was safe") : (s.answer === "Suspicious" ? "Got hit - red flags missed" : "That one was actually safe");
  const icon = ok ? "ti-circle-check" : "ti-bulb";
  
  fb.style.background = bg;
  fb.innerHTML = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><i class="ti ${icon}" style="font-size:14px;color:${ac};"></i><span style="font-size:13px;font-weight:600;color:${ac};">${status}</span></div><div class="chips" style="margin:0;">${chipMarkup(s)}</div>`;
}

function next() {
  state.idx++;
  if (state.idx >= deck.length) { gameOver(); } else { spawn(); }
}

// v2.3: rank tiers + coach lines
const RANK_TIERS: { name: string; min: number; mod: string; coachH: string; coachB: string }[] = [
  { name: "PHISH BAIT", min: 0, mod: "rank-caught", coachH: "You got hooked.", coachB: "Read the domain before you swerve - that's where the lie lives." },
  { name: "ROOKIE SPOTTER", min: 350, mod: "", coachH: "Sharper than most.", coachB: "Build a streak - three correct in a row doubles your points." },
  { name: "PHISH HUNTER", min: 1000, mod: "", coachH: "Reflexes are dialled in.", coachB: "Try the next level up - speed is what catches everyone else." },
  { name: "CYBER SENTINEL", min: 2200, mod: "", coachH: "You are the firewall.", coachB: "Daily Challenge is unlocked - beat it before tomorrow." },
  { name: "CYBER LEGEND", min: 4500, mod: "rank-legend", coachH: "Legendary read on every message.", coachB: "Share your score and challenge a friend to top it." }
];
function getRank(score: number) {
  let cur = RANK_TIERS[0]; let nxt: typeof RANK_TIERS[number] | null = RANK_TIERS[1];
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (score >= RANK_TIERS[i].min) { cur = RANK_TIERS[i]; nxt = RANK_TIERS[i+1] || null; }
  }
  return { cur, nxt };
}

function gameOver() {
  if (timer) clearTimeout(timer);
  if (advanceT) clearTimeout(advanceT);

  const total = deck.length;
  const caught = state.lives <= 0;

  // v2.3 rank reveal
  const { cur: rank, nxt: nextRank } = getRank(state.score);
  const rIcon = $("rank-icon");
  if (rIcon) {
    rIcon.className = "rank-icon " + (caught ? "rank-caught" : (rank.mod || ""));
    rIcon.innerHTML = caught
      ? '<svg class="caught-svg" viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="ch1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5B7CFA"/><stop offset="1" stop-color="#2540A8"/></linearGradient><linearGradient id="cs1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#FBD3A8"/><stop offset="1" stop-color="#D9A87A"/></linearGradient><radialGradient id="cf1" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="rgba(255,180,180,0.55)"/><stop offset="1" stop-color="rgba(255,80,80,0)"/></radialGradient></defs><circle class="caught-flash" cx="60" cy="60" r="55" fill="url(#cf1)"/><line class="caught-line" x1="60" y1="4" x2="60" y2="46" stroke="#FAC775" stroke-width="2.5" stroke-linecap="round"/><path class="caught-hook" d="M 60 46 Q 60 66 48 66 Q 36 66 38 54" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none"/><path class="caught-barb" d="M 38 54 L 32 58 M 38 54 L 42 60" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/><g class="caught-victim"><ellipse cx="60" cy="62" rx="11" ry="11" fill="url(#cs1)"/><path d="M 48 60 Q 50 50 60 49 Q 70 50 72 60 L 72 64 Q 66 60 60 60 Q 54 60 48 64 Z" fill="url(#ch1)"/><circle cx="56" cy="62" r="1.6" fill="#1a1a1a"/><circle cx="64" cy="62" r="1.6" fill="#1a1a1a"/><path d="M 56 68 Q 60 71 64 68" stroke="#7a4a2a" stroke-width="1.3" fill="none" stroke-linecap="round"/><rect x="50" y="72" width="20" height="24" rx="5" fill="url(#ch1)"/><rect x="53" y="96" width="6" height="14" rx="3" fill="#3A4670"/><rect x="61" y="96" width="6" height="14" rx="3" fill="#3A4670"/><path class="caught-arms" d="M 50 80 L 32 76 M 70 80 L 88 76" stroke="#2540A8" stroke-width="4" stroke-linecap="round" fill="none"/></g><circle class="caught-spark caught-spark-1" cx="22" cy="34" r="2.5" fill="#FAC775"/><circle class="caught-spark caught-spark-2" cx="98" cy="40" r="2.5" fill="#FF6F8A"/><circle class="caught-spark caught-spark-3" cx="100" cy="92" r="2.5" fill="#FAC775"/><circle class="caught-spark caught-spark-4" cx="20" cy="90" r="2.5" fill="#FF6F8A"/></svg>'
      : '<svg class="survive-svg" viewBox="0 0 80 80" aria-hidden="true"><path class="survive-shield" d="M 40 10 L 18 18 L 18 38 Q 18 58 40 70 Q 62 58 62 38 L 62 18 Z"/><path class="survive-check" d="M 28 40 L 37 49 L 54 32"/></svg>';
  }
  const rName = $("rank-name"); if (rName) rName.textContent = caught ? "PHISH BAIT" : rank.name;
  const rTag = $("rank-tag"); if (rTag) rTag.textContent = (caught ? "Caught - " : "") + state.correct + " of " + total + " caught \u00b7 best streak " + state.bestStreak;
  if (nextRank) {
    const span = nextRank.min - rank.min;
    const done = state.score - rank.min;
    const pct = Math.max(0, Math.min(100, Math.round((done / span) * 100)));
    const fill = $("rank-bar-fill"); if (fill) (fill as HTMLElement).style.width = pct + "%";
    const now = $("rank-bar-now"); if (now) now.textContent = caught ? "PHISH BAIT" : rank.name;
    const nxtEl = $("rank-bar-next"); if (nxtEl) nxtEl.textContent = "NEXT: " + nextRank.name;
    const gap = $("rank-bar-gap"); if (gap) gap.textContent = Math.max(0, nextRank.min - state.score).toLocaleString() + " points to next rank";
  } else {
    const fill = $("rank-bar-fill"); if (fill) (fill as HTMLElement).style.width = "100%";
    const nxtEl = $("rank-bar-next"); if (nxtEl) nxtEl.textContent = "MAX RANK";
    const gap = $("rank-bar-gap"); if (gap) gap.textContent = "Top tier reached - defend it.";
  }
  const tl = $("timeline-dots");
  if (tl) {
    tl.innerHTML = state.telemetry.map((t, i) => {
      const cls = t.userSelection === "Timeout" ? "tl-timeout" : (t.isCorrect ? "tl-correct" : "tl-wrong");
      const sym = t.userSelection === "Timeout" ? "T" : (t.isCorrect ? "\u2713" : "\u2717");
      return '<span class="tl-dot ' + cls + '" style="animation-delay:' + (i*60) + 'ms">' + sym + '</span>';
    }).join("");
  }

  $("o-level-played").textContent = currentLevel.name + " \u00b7 " + currentLevel.mult + "\u00d7 points";
  
  const sc = $("o-score");
  sc.textContent = state.score.toLocaleString();
  sc.classList.remove("countup");
  void sc.offsetWidth;
  sc.classList.add("countup");
  
  $("o-correct").textContent = state.correct + "/" + total;
  $("o-acc").textContent = Math.round((state.correct / total) * 100) + "%";
  $("o-streak").textContent = state.bestStreak.toString();
  
  // v2.3: o-awareness replaced by rank reveal above

  const answered = state.telemetry.filter(t => t.userSelection !== "Timeout");
  const hes = answered.length ? Math.round(answered.reduce((s, t) => s + t.responseTimeMilliseconds, 0) / answered.length / currentLevel.ms * 100) : 0;
  $("o-hes").textContent = hes + "%";
  
  const wrongs = state.telemetry.filter(t => !t.isCorrect);
  let vuln = "None - clean run";
  if (wrongs.length) {
    const c: Record<string, number> = {};
    for (const t of wrongs) c[t.cyBOKKnowledgeArea] = (c[t.cyBOKKnowledgeArea] || 0) + 1;
    const sorted = Object.entries(c).sort((a, b) => b[1] - a[1]);
    vuln = sorted.length ? sorted[0][0] : "None - clean run";
  }
  $("o-vuln").textContent = vuln;
  
  const diag = evaluateDiagnosis(state.telemetry, SCENARIOS);
  const wrongCount = state.telemetry.filter(t => !t.isCorrect).length;
  const useRankCoach = wrongCount === 0 || diag.title.toLowerCase().includes("clean");
  $("o-coach-title").textContent = useRankCoach ? rank.coachH : diag.title;
  $("o-coach-body").textContent  = useRankCoach ? rank.coachB : diag.body;
  
  const per: Record<string, {c: number, t: number}> = {};
  for (const t of state.telemetry) {
    if (!per[t.cyBOKKnowledgeArea]) per[t.cyBOKKnowledgeArea] = { c: 0, t: 0 };
    per[t.cyBOKKnowledgeArea].t++;
    if (t.isCorrect) per[t.cyBOKKnowledgeArea].c++;
  }
  
  const rows = Object.entries(per).sort((a, b) => (a[1].c / Math.max(1, a[1].t)) - (b[1].c / Math.max(1, b[1].t))).map(([ka, v]) => {
    const acc = Math.round((v.c / Math.max(1, v.t)) * 100);
    const tone = acc >= 80 ? "ok" : acc >= 50 ? "warn" : "bad";
    return `<tr class="ka-${tone}"><td>${ka}</td><td class="num">${v.c}/${v.t}</td><td class="num">${acc}%</td></tr>`;
  }).join("");
  $("o-ka-body").innerHTML = rows || '<tr><td colspan="3" class="num">No data</td></tr>';

  buildMistakeReview();
  switchTab('mistakes');
  show("screen-over");
  // v2.0: save high score per level + end-of-game sound
  const isNewBest = saveBest(currentLevel.name, state.score);
  if (isNewBest && state.score > 0) {
    setTimeout(() => popupNewBest(state.score), 400);
  }
  sfx(caught ? "gameover" : "victory");
  haptic(caught ? [60, 80, 60] : [10, 30, 10, 30, 80]);
  if (!caught && state.correct >= 5) { setTimeout(() => fireEndConfetti(), 200); }
  // v2.1: achievement check + daily completion + UI refresh
  const newlyUnlocked = checkAchievements();
  setTimeout(() => renderEndScreenAchievements(newlyUnlocked), 600);
  if (isDailyRun) { markDailyDone(state.score); isDailyRun = false; }
  renderAchievementsRow();
  renderDailyButton();
}

function buildMistakeReview() {
  const container = $("panel-mistakes");
  $("o-mistake-count").textContent = state.mistakes.length.toString();
  if (state.mistakes.length === 0) {
    container.innerHTML = `<div class="no-mistakes">
      <div class="no-mistakes-icon"><i class="ti ti-trophy"></i></div>
      <p style="margin:0;font-size:16px;font-weight:600;">Flawless run!</p>
      <p style="margin:4px 0 0;font-size:13px;">You spotted every phish. Your instincts are sharp.</p>
      </div>`;
    return;
  }
  let html = '<p style="text-align:left;font-size:13px;color:var(--muted);margin:0 0 10px;">Here\'s what tripped you up - and why it was a phish.</p>';
  state.mistakes.forEach((m, i) => {
    const s = m.scenario;
    const chosenLabel = m.chosen === '(no answer)' ? 'Ran out of time' : ('You chose: ' + m.chosen);
    html += `<div class="mistake-card" style="animation-delay:${i * 80}ms;">
      <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;">
        <i class="ti ${s.icon}" style="font-size:20px;color:var(--sus);flex:none;margin-top:2px;"></i>
        <div style="flex:1;min-width:0;">
          <p style="margin:0;font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.05em;">${s.type}</p>
          <p class="mistake-msg">"${s.message}"</p>
        </div>
      </div>
      <div class="mistake-row">
        <span class="mistake-tag tag-you-wrong"><i class="ti ti-x" style="font-size:12px;"></i>${chosenLabel}</span>
        <span class="mistake-tag tag-correct"><i class="ti ti-check" style="font-size:12px;"></i>Correct: ${s.answer}</span>
      </div>
      <div class="chips" style="margin:8px 0 4px;">${chipMarkup(s)}</div>
      <div class="mistake-explain"><strong>Why:</strong> ${s.feedback}</div>
      <div class="rule-callout" style="margin-top:8px;">${ruleMarkup(s)}</div>
      <span class="cybok-pill" style="margin-top:8px;">${s.cybok}</span>
    </div>`;
  });
  container.innerHTML = html;
}

function fireEndConfetti() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(overlay);
  
  const corners = [
    {x:0, y:0, dx:1, dy:1}, {x:100, y:0, dx:-1, dy:1},
    {x:0, y:100, dx:1, dy:-1}, {x:100, y:100, dx:-1, dy:-1}
  ];
  
  corners.forEach(corner => {
    for(let i=0; i<25; i++){
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      piece.style.left = corner.x + '%';
      piece.style.top = corner.y + '%';
      
      const shape = Math.random();
      if(shape < 0.33) { piece.style.borderRadius = '50%'; piece.style.width = '9px'; piece.style.height = '9px'; }
      else if(shape < 0.66) { piece.style.width = '7px'; piece.style.height = '14px'; }
      else { piece.style.width = '12px'; piece.style.height = '5px'; }
      
      const dist = 280 + Math.random() * 260;
      const spread = (Math.random() - 0.5) * 180;
      const tx = corner.dx * dist + spread;
      const ty = corner.dy * dist + (Math.random() - 0.5) * 120;
      const tr = (Math.random() * 900 - 450);
      
      piece.style.setProperty('--tx', tx + 'px');
      piece.style.setProperty('--ty', ty + 'px');
      piece.style.setProperty('--tr', tr + 'deg');
      piece.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      piece.style.animationDelay = (Math.random() * 0.4) + 's';
      
      overlay.appendChild(piece);
    }
  });
  
  setTimeout(() => overlay.remove(), 3500);
}

function switchTab(name: string) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  $(`tab-${name}`)?.classList.add('active');
  if (name === 'mistakes') {
    $("panel-mistakes").classList.remove('hidden');
    $("panel-takeaways").classList.add('hidden');
  } else {
    $("panel-mistakes").classList.add('hidden');
    $("panel-takeaways").classList.remove('hidden');
  }
}

// Event Listeners
buildLevels();
show("screen-start"); // Initialize the first screen properly

// v2.3.6: PWA install support
let deferredInstall: any = null;
window.addEventListener("beforeinstallprompt", (e: any) => {
  e.preventDefault();
  deferredInstall = e;
  const btn = document.getElementById("install-btn");
  if (btn) btn.style.display = "inline-flex";
});
document.getElementById("install-btn")?.addEventListener("click", async () => {
  if (deferredInstall) {
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    const btn = document.getElementById("install-btn");
    if (btn) btn.style.display = "none";
  } else {
    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed;inset:0;background:rgba(14,19,48,.94);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;";
    modal.innerHTML = `<div style="background:#fff;border-radius:18px;padding:26px 24px;max-width:420px;text-align:left;"><h3 style="margin:0 0 12px;font-size:20px;">Install Phish Runner</h3><p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>iPhone (Safari):</strong> tap the <i class="ti ti-share" style="vertical-align:-3px;"></i> Share button, then <strong>Add to Home Screen</strong>.</p><p style="margin:0 0 8px;font-size:14px;color:#444;"><strong>Android (Chrome):</strong> tap the <i class="ti ti-dots-vertical" style="vertical-align:-3px;"></i> menu, then <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p><p style="margin:14px 0 0;font-size:13px;color:#666;">It will behave like a native app - fullscreen with its own icon.</p><button id="install-close" style="margin-top:18px;width:100%;padding:14px;background:linear-gradient(135deg,#3B82F6,#EC4899);color:#fff;border:none;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer;">Got it</button></div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => { if (e.target === modal || (e.target as HTMLElement).id === "install-close") modal.remove(); });
  }
});

$("pr-back")?.addEventListener("click", () => { document.body.classList.remove("is-playing"); show("screen-start"); });
$("pr-safe")?.addEventListener("click", () => practiceAnswer("Safe"));
$("pr-sus")?.addEventListener("click", () => practiceAnswer("Suspicious"));
$("pr-start")?.addEventListener("click", () => startGame(pendingLevel));
$("o-replay")?.addEventListener("click", () => startGame(LEVELS.indexOf(currentLevel)));
$("o-menu")?.addEventListener("click", () => show("screen-start"));
$("g-safe")?.addEventListener("click", () => answer("Safe"));
$("g-sus")?.addEventListener("click", () => answer("Suspicious"));
$("g-pause")?.addEventListener("click", () => { if (state.turnStart > 0) togglePause(); });
$("g-resume")?.addEventListener("click", resumeGame);
// v2.4: helper - abandon current run cleanly (used by Quit, Home, ESC)
function quitToMenu(skipConfirm = false) {
  if (!skipConfirm && !state.paused && state.score > 0 && state.lives > 0) {
    if (!confirm("End this run and go back to the main menu? Your progress will be lost.")) return;
  }
  if (timer) clearTimeout(timer);
  if (advanceT) clearTimeout(advanceT);
  state.paused = false;
  state.modalOpen = false;
  $("g-paused").classList.add("hidden");
  $("g-modal").classList.add("hidden");
  show("screen-start");
}

// v2.4: helper - restart current run on the same difficulty (used by Restart button + R key)
function restartRun(skipConfirm = false) {
  if (!skipConfirm && state.score > 0 && state.lives > 0) {
    if (!confirm("Restart this run from message 1? Your current score will be lost.")) return;
  }
  if (timer) clearTimeout(timer);
  if (advanceT) clearTimeout(advanceT);
  state.modalOpen = false;
  $("g-paused").classList.add("hidden");
  $("g-modal").classList.add("hidden");
  startGame(LEVELS.indexOf(currentLevel));
}

// v2.4: helper - end the run abruptly and reveal the end screen with whatever score they have
function endRunNow(skipConfirm = false) {
  if (!skipConfirm) {
    if (!confirm("End this run now and see your results? You won't see the remaining messages.")) return;
  }
  if (timer) clearTimeout(timer);
  if (advanceT) clearTimeout(advanceT);
  state.paused = false;
  state.modalOpen = false;
  $("g-paused").classList.add("hidden");
  $("g-modal").classList.add("hidden");
  gameOver();
}

$("g-quit")?.addEventListener("click", () => quitToMenu(true));
$("g-home")?.addEventListener("click", () => quitToMenu(false));
$("g-restart")?.addEventListener("click", () => restartRun(false));
$("g-pause-restart")?.addEventListener("click", () => restartRun(true));
$("g-end-now")?.addEventListener("click", () => endRunNow(true));
$("m-dismiss")?.addEventListener("click", dismissModal);
// v2.3.2: backdrop click also dismisses; Space/Enter also dismiss; safety timeout for stuck modals
$("g-modal")?.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).id === "g-modal") dismissModal();
});
document.addEventListener("keydown", (e) => {
  if (state.modalOpen && (e.key === " " || e.key === "Enter" || e.key === "Escape")) {
    e.preventDefault(); dismissModal();
  }
});

$("m-show-deep")?.addEventListener("click", () => {
  $("m-chips").classList.add("show");
  $("m-flag-label").classList.add("show");
  $("m-deep").classList.remove("hidden");
  $("m-show-deep").classList.add("hidden");
});
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => switchTab((t as HTMLElement).dataset.tab || ''));
});
document.addEventListener("keydown", (e: KeyboardEvent) => {
  if ($("screen-game").classList.contains("hidden")) return;
  if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    if (state.modalOpen) dismissModal();
    // v2.4.1: only allow pause once the first scenario is on screen
    // (prevents the "Paused + Loading..." stuck state during lane reminder)
    else if (state.turnStart > 0) togglePause();
    return;
  }
  // v2.4: ESC = back to main menu (asks if mid-run)
  if (e.key === "Escape") {
    e.preventDefault();
    if (state.modalOpen) { dismissModal(); return; }
    quitToMenu(false);
    return;
  }
  // v2.4: R = restart current run
  if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    restartRun(false);
    return;
  }
  if (state.paused || state.modalOpen) return;
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") answer("Safe");
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") answer("Suspicious");
});

// =====================================================================
// v2.0 — Mobile-first, juicier, installable
// =====================================================================

// ---- Sound system: synthesised via Web Audio API (no asset files) ----
let audioCtx: AudioContext | null = null;
let soundOn = localStorage.getItem("pr_sound") !== "off";
function getCtx(): AudioContext | null {
  if (!soundOn) return null;
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
    catch (e) { return null; }
  }
  return audioCtx;
}
function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.18, delay = 0) {
  const ctx = getCtx(); if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + duration + 0.02);
}
function sfx(name: "correct" | "wrong" | "streak" | "victory" | "gameover" | "tick" | "pop") {
  if (!soundOn) return;
  switch (name) {
    case "correct":  tone(660, 0.10, "sine", 0.16); tone(990, 0.14, "sine", 0.14, 0.06); break;
    case "wrong":    tone(220, 0.18, "sawtooth", 0.18); tone(160, 0.20, "sawtooth", 0.14, 0.05); break;
    case "streak":   tone(660, 0.08, "triangle", 0.16); tone(880, 0.08, "triangle", 0.16, 0.07);
                     tone(1175, 0.12, "triangle", 0.18, 0.14); break;
    case "victory":  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "sine", 0.18, i * 0.12)); break;
    case "gameover": tone(330, 0.30, "sawtooth", 0.18); tone(220, 0.40, "sawtooth", 0.18, 0.20); break;
    case "tick":     tone(880, 0.04, "square", 0.08); break;
    case "pop":      tone(523, 0.06, "triangle", 0.12); break;
  }
}

// ---- Haptic feedback (mobile only) ----
function haptic(pattern: number[]) {
  if ("vibrate" in navigator) {
    try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }
}

// ---- localStorage best score per level ----
function loadBest(levelName: string): number {
  try {
    const raw = localStorage.getItem("pr_best_" + levelName);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch (e) { return 0; }
}
function saveBest(levelName: string, score: number): boolean {
  try {
    const current = loadBest(levelName);
    if (score > current) {
      localStorage.setItem("pr_best_" + levelName, String(score));
      return true;
    }
    return false;
  } catch (e) { return false; }
}
function popupNewBest(score: number) {
  const el = document.createElement('div');
  el.style.cssText = "position:fixed;top:30%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#FAC775,#D85A30);color:#0E1330;padding:18px 30px;border-radius:14px;font-size:22px;font-weight:700;z-index:9999;box-shadow:0 12px 36px rgba(0,0,0,.4);text-align:center;pointer-events:none;animation:fadeIn .3s ease-out, fadeOut .4s ease-in 2.4s forwards;";
  el.innerHTML = `★ NEW BEST<br><span style="font-size:32px;display:block;margin-top:4px;">${score.toLocaleString()}</span>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ---- Sound toggle button in HUD ----
const muteBtn = $("g-mute");
function updateMuteIcon() {
  if (!muteBtn) return;
  const icon = muteBtn.querySelector("i");
  if (icon) icon.className = "ti " + (soundOn ? "ti-volume" : "ti-volume-off");
}
updateMuteIcon();
muteBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  soundOn = !soundOn;
  localStorage.setItem("pr_sound", soundOn ? "on" : "off");
  updateMuteIcon();
  if (soundOn) sfx("pop");
  haptic([10]);
});

// ---- Mobile swipe gestures on the stage ----
const stage = $("stage");
if (stage) {
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  stage.addEventListener("touchstart", (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });
  stage.addEventListener("touchend", (e: TouchEvent) => {
    if ($("screen-game").classList.contains("hidden")) return;
    if (state.paused || state.modalOpen || state.answered) return;
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 600) {
      answer(dx < 0 ? "Safe" : "Suspicious");
    }
  }, { passive: true });
}

// Initialise audio context on first user gesture (browser autoplay policy)
const unlockAudio = () => { getCtx(); document.removeEventListener("pointerdown", unlockAudio); };
document.addEventListener("pointerdown", unlockAudio, { once: true });

// =====================================================================
// v2.1 — Achievements, Daily Challenge, Share Score
// =====================================================================

// ---- Achievements ----
interface Achievement {
  id: string;
  name: string;
  icon: string;
  desc: string;
  check: () => boolean;
}
const ACHIEVEMENTS: Achievement[] = [
  { id: "first_win", name: "First Win", icon: "ti-flag", desc: "Survive your first run.",
    check: () => state.lives > 0 && state.correct >= 1 },
  { id: "flawless", name: "Flawless", icon: "ti-trophy", desc: "Get 7/7 in a single run.",
    check: () => state.correct === 7 && state.lives > 0 },
  { id: "streak_5", name: "Hot Streak", icon: "ti-flame", desc: "Reach a 5-correct streak.",
    check: () => state.bestStreak >= 5 },
  { id: "sprint_survivor", name: "Sprint Survivor", icon: "ti-bolt", desc: "Survive Cyber Sprint.",
    check: () => currentLevel.name === "Cyber Sprint" && state.lives > 0 },
  { id: "pro", name: "Phishing-aware Pro", icon: "ti-shield-check", desc: "Top awareness rating.",
    check: () => state.correct >= 7 }
];

function loadAchievements(): Set<string> {
  try {
    const raw = localStorage.getItem("pr_achievements");
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) { return new Set(); }
}
function saveAchievements(s: Set<string>) {
  try { localStorage.setItem("pr_achievements", JSON.stringify([...s])); } catch (e) { /* ignore */ }
}
function checkAchievements(): Achievement[] {
  const unlocked = loadAchievements();
  const newly: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!unlocked.has(a.id) && a.check()) {
      unlocked.add(a.id);
      newly.push(a);
    }
  }
  if (newly.length) saveAchievements(unlocked);
  return newly;
}
function renderAchievementsRow() {
  const row = $("achievements-row"), grid = $("ach-grid"), count = $("ach-count");
  if (!row || !grid || !count) return;
  const unlocked = loadAchievements();
  if (unlocked.size === 0) { row.style.display = "none"; return; }
  row.style.display = "block";
  count.textContent = unlocked.size.toString();
  grid.innerHTML = ACHIEVEMENTS.map(a => {
    const got = unlocked.has(a.id);
    return `<div title="${a.name} — ${a.desc}" style="display:flex;flex-direction:column;align-items:center;gap:4px;${got ? "" : "opacity:.45;"}">
      <div style="width:46px;height:46px;border-radius:50%;background:${got ? "linear-gradient(135deg,#FAC775,#D85A30)" : "#E0DED5"};color:${got ? "#0E1330" : "#7a7a7a"};display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:${got ? "0 4px 12px rgba(216,90,48,.3)" : "none"};"><i class="ti ${a.icon}"></i></div>
      <span style="font-size:10px;font-weight:700;color:${got ? "#0E1330" : "#9a9a9a"};letter-spacing:.02em;text-align:center;line-height:1.1;">${a.name.toUpperCase()}</span>
    </div>`;
  }).join("");
}
function renderEndScreenAchievements(newly: Achievement[]) {
  const wrap = $("o-achievements"), list = $("o-ach-list");
  if (!wrap || !list) return;
  if (newly.length === 0) { wrap.style.display = "none"; return; }
  wrap.style.display = "block";
  list.innerHTML = newly.map(a =>
    `<div style="display:flex;align-items:center;gap:8px;background:rgba(250,199,117,.15);border:1px solid #FAC775;border-radius:999px;padding:6px 12px;color:#FAC775;font-size:13px;font-weight:600;"><i class="ti ${a.icon}" aria-hidden="true"></i>${a.name}</div>`
  ).join("");
  sfx("victory");
  haptic([20, 60, 20, 60, 80]);
}

// ---- Daily Challenge: deterministic seed per date ----
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
function dateSeed(): number {
  const s = todayKey();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const r = [...arr];
  let s = seed || 1;
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
function dailyCompletedScore(): number | null {
  try {
    const raw = localStorage.getItem("pr_daily_" + todayKey());
    return raw ? parseInt(raw, 10) || null : null;
  } catch (e) { return null; }
}
function markDailyDone(score: number) {
  try { localStorage.setItem("pr_daily_" + todayKey(), String(score)); } catch (e) { /* ignore */ }
}
let isDailyRun = false;
function startDaily() {
  isDailyRun = true;
  currentLevel = LEVELS[1]; // Regular = fair difficulty
  deck = seededShuffle(SCENARIOS, dateSeed()).slice(0, 7);
  state = createInitialState(currentLevel);
  $("g-score").textContent = "0";
  setLives();
  setStreak(0);
  $("g-paused").classList.add("hidden");
  $("g-modal").classList.add("hidden");
  show("screen-game");
  buildStars();
  showLaneReminder(() => spawn());
}
function renderDailyButton() {
  const btn = $("daily-btn"), statusEl = $("daily-status");
  if (!btn || !statusEl) return;
  btn.style.display = "flex";
  const done = dailyCompletedScore();
  statusEl.textContent = done !== null ? `· DONE · ${done.toLocaleString()}` : `· ${todayKey()}`;
}

// ---- Share Score ----
async function shareScore() {
  const text = `I scored ${state.score.toLocaleString()} on Phish Runner: Safe or Suspicious? (${currentLevel.name}, ${state.correct}/7). Beat me at endurak.github.io/phish-runner/`;
  const shareData = { title: "Phish Runner", text, url: "https://endurak.github.io/phish-runner/" };
  if (navigator.share) {
    try { await navigator.share(shareData); haptic([10]); return; }
    catch (e) { /* user cancelled — fall through to clipboard */ }
  }
  if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); haptic([15]); return; }
    catch (e) { /* ignore */ }
  }
  toast("Share unavailable");
}
function toast(msg: string) {
  const t = document.createElement('div');
  t.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(14,19,48,.95);color:#FFFFFF;padding:12px 20px;border-radius:24px;font-size:14px;font-weight:500;z-index:9999;pointer-events:none;animation:fadeIn .2s ease-out, fadeOut .3s ease-in 1.6s forwards;";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// ---- Wire up new buttons (v2.1 hooks for game-over are inside gameOver() itself) ----
$("daily-btn")?.addEventListener("click", () => { sfx("pop"); haptic([10]); startDaily(); });
$("o-share")?.addEventListener("click", shareScore);

// Initial render on page load
renderAchievementsRow();
renderDailyButton();

// =====================================================================
// v2.2 — Anti-boring start screen
// =====================================================================

// ---- Drifting background floaters ----
function spawnFloaters() {
  let container = document.getElementById("bg-floaters");
  if (!container) {
    container = document.createElement("div");
    container.id = "bg-floaters";
    document.body.insertBefore(container, document.body.firstChild);
  }
  const icons = ["ti-fish-hook", "ti-mail", "ti-alert-triangle", "ti-shield", "ti-link", "ti-bug", "ti-key", "ti-credit-card", "ti-message-circle"];
  const W = window.innerWidth;
  container.innerHTML = "";
  for (let i = 0; i < 14; i++) {
    const el = document.createElement("i");
    const cls = icons[Math.floor(Math.random() * icons.length)];
    el.className = "ti " + cls + " bg-floater";
    el.setAttribute("aria-hidden", "true");
    const left = Math.random() * W;
    const dur = 14 + Math.random() * 14;
    const delay = -Math.random() * dur;
    const drift = (Math.random() * 200 - 100) + "px";
    const size = 22 + Math.random() * 18;
    el.style.left = left + "px";
    el.style.fontSize = size + "px";
    el.style.animationDuration = dur + "s";
    el.style.animationDelay = delay + "s";
    el.style.setProperty("--drift", drift);
    container.appendChild(el);
  }
}
spawnFloaters();
window.addEventListener("resize", () => { spawnFloaters(); });

// ---- Selected level for the big PLAY CTA (default Regular) ----
let selectedLevelIdx = 1; // Regular by default

function renderLevelPills() {
  const wrap = $("level-pills");
  if (!wrap) return;
  wrap.innerHTML = LEVELS.map((L, i) => {
    const active = i === selectedLevelIdx ? "active" : "";
    return `<button class="level-pill ${active}" data-i="${i}" data-accent="${L.accent}"><span class="dot"></span>${L.name}</button>`;
  }).join("");
  wrap.querySelectorAll<HTMLButtonElement>(".level-pill").forEach(b => {
    b.addEventListener("click", () => {
      selectedLevelIdx = parseInt(b.dataset.i || "1", 10);
      sfx("tick");
      haptic([6]);
      renderLevelPills();
      updatePlayCtaLabel();
    });
  });
}
function updatePlayCtaLabel() {
  const lvl = LEVELS[selectedLevelIdx];
  const el = $("play-cta-lvl");
  if (el) el.textContent = `${lvl.name} · ${lvl.lives} lives · ${lvl.mult}× points`;
}
renderLevelPills();
updatePlayCtaLabel();

$("play-cta")?.addEventListener("click", () => {
  sfx("pop");
  haptic([12]);
  enterPractice(selectedLevelIdx);
});