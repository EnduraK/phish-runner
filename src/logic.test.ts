import { expect, test, describe } from 'vitest';
import { calculatePoints } from './logic';

describe('Phish Runner Logic Checks', () => {
  test('The scoring math works perfectly', () => {
    // Check 1: A streak of 1 with a 1x multiplier equals 100 points
    expect(calculatePoints(1, 1)).toBe(100);
    
    // Check 2: A streak of 2 with a 2x multiplier equals 250 points
    expect(calculatePoints(2, 2)).toBe(250);
  });
});