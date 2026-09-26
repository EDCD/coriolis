import { stackArmourResistances, stackDamageResistance } from '../src/app/shipyard/Calculations';

/**
 * Tests for the in-game armour resistance stacking algorithm.
 *
 * Reference: Frontier's documented resistance formula
 *   https://forums.frontier.co.uk/threads/kinetic-resistance-calculation.266235/post-4230114
 * cross-checked against the ED Odyssey Materials Helper (EDOMH) implementation,
 * which is trusted to match the in-game armour resistance values.
 *
 * These vectors were derived from a reported Imperial Corsair build whose
 * in-game armour panel showed kinetic 24.0%, explosive 32.2%, thermal 71.4%.
 * The bulkhead is Mirrored Surface Composite + Thermal Resistant G5 +
 * Reflective Plating; the hull reinforcement packages carry Deep Plating.
 * Inputs below are the per-module *modified* resistances (decimals) as computed
 * by the module layer, which is what stackArmourResistances consumes.
 */
describe('Armour resistance stacking', function() {

  // Small helper: assert a resistance is within tolerance (defaults to 0.5pp).
  function expectClose(actual, expectedPct, tolPct = 0.5) {
    expect(Math.abs(actual * 100 - expectedPct)).toBeLessThanOrEqual(tolPct);
  }

  describe('stackDamageResistance (single step)', function() {
    it('stacks two sub-threshold resistances multiplicatively', function() {
      // Both below 30% => no diminishing returns, plain multiplicative stack.
      // 1 - (1-0.1)(1-0.1) = 0.19
      expect(stackDamageResistance(0.1, 0.1)).toBeCloseTo(0.19, 6);
    });

    it('applies diminishing returns above the 30% threshold', function() {
      // Two 20% resistances stack to 0.36 raw; past 30% it gets penalised.
      const r = stackDamageResistance(0.2, 0.2);
      expect(r).toBeLessThan(0.36);
      expect(r).toBeGreaterThan(0.3);
    });

    it('never exceeds the 65% upper bound for a single stack step', function() {
      expect(stackDamageResistance(0.6, 0.6)).toBeLessThanOrEqual(0.65 + 1e-9);
    });
  });

  describe('stackArmourResistances (full combine)', function() {
    // Reported Corsair build, per-type modified resistances.
    const bulkheadKin = -0.96;
    const bulkheadExp = -0.68;
    const bulkheadThm = 0.724;
    const hrpKin = [-0.0939, 0.1547, 0.1547, 0.4002];
    const hrpExp = [0.4033, 0.1547, 0.1547, -0.0996];
    const hrpThm = [-0.0939, 0.1547, 0.1547, -0.0996];

    it('passes the bulkhead resistance through unchanged when no HRPs are fitted', function() {
      // EDOMH testcase: bare Mirrored + Thermal Resistant G5 + Reflective Plating
      // => kinetic -96%, explosive -68%, thermal 72.4%.
      expectClose(stackArmourResistances(bulkheadKin, []), -96.0);
      expectClose(stackArmourResistances(bulkheadExp, []), -68.0);
      expectClose(stackArmourResistances(bulkheadThm, []), 72.4);
    });

    it('matches the in-game kinetic resistance for the reported build', function() {
      // Coriolis previously reported 8.1% here; the game shows 24.0%.
      expectClose(stackArmourResistances(bulkheadKin, hrpKin), 24.0, 1.0);
    });

    it('matches the in-game explosive resistance for the reported build', function() {
      expectClose(stackArmourResistances(bulkheadExp, hrpExp), 32.2, 1.0);
    });

    it('matches the in-game thermal resistance for the reported build', function() {
      expectClose(stackArmourResistances(bulkheadThm, hrpThm), 71.4, 1.0);
    });

    it('is independent of the order HRPs are supplied in', function() {
      const forward = stackArmourResistances(bulkheadKin, hrpKin);
      const reversed = stackArmourResistances(bulkheadKin, [...hrpKin].reverse());
      expect(forward).toBeCloseTo(reversed, 9);
    });

    it('hard-caps the effective resistance at 75%', function() {
      // Six strong kinetic-resistant modules would exceed 75% without the cap.
      const strong = [0.40, 0.40, 0.40, 0.40, 0.40, 0.40];
      expect(stackArmourResistances(0.30, strong)).toBeLessThanOrEqual(0.75 + 1e-9);
    });

    it('gives a single >30% module a larger effective contribution than a 30% one', function() {
      // The over-30% "double bonus" means a 40% module should beat a 30% module.
      const with40 = stackArmourResistances(0, [0.40]);
      const with30 = stackArmourResistances(0, [0.30]);
      expect(with40).toBeGreaterThan(with30);
    });
  });
});
