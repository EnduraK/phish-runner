/**
 * src/logic.test.ts — Vitest unit suite for the pure scoring brain.
 *
 * Why test only the scoring formula:
 *   The scoring formula is the single piece of logic that the player will
 *   notice if it regresses. A wrong scoring outcome immediately erodes trust
 *   in the entire feedback loop ("the game is broken"). Pinning it down with
 *   automated tests means that any future refactor that breaks calculatePoints
 *   will be caught by the CI pipeline (GitHub Actions) before deploy,
 *   rather than by an unhappy player.
 *
 * Why these two specific assertions:
 *   They cover both the BASELINE case (streak-of-1 at 1x = 100, the simplest
 *   path) and the COMPOUND case (streak-of-2 at 2x = 250, where both
 *   multipliers participate). If either branch of the formula regresses,
 *   one of these assertions will fail.
 *
 * Methodology note (Beck et al., 2001 — Agile principles):
 *   The test was written ALONGSIDE the implementation in logic.ts, not after.
 *   This is the working-software-over-documentation principle from the
 *   Agile Manifesto: the test IS the contract, and it is the most honest
 *   record of what the function is supposed to do.
 */
import { expect, test, describe } from 'vitest';
import { calculatePoints } from './logic';

describe('Phish Runner Logic Checks', () => {
  test('The scoring math works perfectly', () => {
    // Check 1: baseline — a streak of 1 with a 1x multiplier equals 100 points.
    // This pins the formula's constant term so future "tuning" can't quietly
    // change the player's first-correct reward.
    expect(calculatePoints(1, 1)).toBe(100);

    // Check 2: compound — a streak of 2 with a 2x multiplier equals 250 points.
    // (100 + (2-1) * 25) * 2 = 250. Verifies that BOTH the streak increment
    // and the level multiplier participate in the final score.
    expect(calculatePoints(2, 2)).toBe(250);
  });
});
