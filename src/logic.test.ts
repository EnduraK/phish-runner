import { expect, test, describe } from 'vitest';
import { calculatePoints, processAnswer, createInitialState } from './logic';
import { SCENARIOS, LEVELS } from './data';

describe('Phish Runner Logic Layer Validation', () => {
  test('calculatePoints computes correct streak scalars', () => {
    expect(calculatePoints(1, 1)).toBe(100);
    expect(calculatePoints(2, 2)).toBe(250); // (100 + 25) * 2 = 250
    expect(calculatePoints(3, 5)).toBe(750); // (100 + 50) * 5 = 750
  });

  test('processAnswer logs telemetry, adds score, and updates streak on accurate input', () => {
    const s = SCENARIOS[0];
    const startState = createInitialState(LEVELS[0]);
    
    const { newState, pointsAwarded } = processAnswer(startState, 'Suspicious', s, 1, 1500);
    
    expect(newState.score).toBe(100);
    expect(pointsAwarded).toBe(100);
    expect(newState.streak).toBe(1);
    expect(newState.telemetry[0].responseTimeMilliseconds).toBe(1500);
  });
});