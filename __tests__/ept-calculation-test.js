/**
 * Test to verify Enhanced Performance Thruster calculations
 * Based on the EPT data table provided:
 *
 * Eagle with 3A EPT:
 * - min mass: 70t, max mass: 200t, optimal mass: 90t
 * - Expected results:
 *   65t:  384 m/s top speed, 560 m/s boost (42% increase over stock)
 *   68t:  372 m/s top speed, 543 m/s boost (39% increase)
 *   76t:  338 m/s top speed, 493 m/s boost (29% increase)
 *   90t:  289 m/s top speed, 422 m/s boost (14% increase)
 *   98t:  268 m/s top speed, 391 m/s boost (8% increase)
 *   126t: 229 m/s top speed, 333 m/s boost (-3.5% decrease)
 */

import { speed, calcSpeed } from '../src/app/shipyard/Calculations';

describe('Enhanced Performance Thruster Calculations', () => {
  // EPT 3A data from thrusters.json
  const ept3a = {
    minmass: 70,
    optmass: 90,
    maxmass: 200,
    minmul: 0.9,
    optmul: 1.15,
    maxmul: 1.367,
    minmulspeed: 0.9,
    optmulspeed: 1.25,
    maxmulspeed: 1.6,
    minmulrotation: 0.9,
    optmulrotation: 1.1,
    maxmulrotation: 1.3,
    minmulacceleration: 0.9,
    optmulacceleration: 1.1,
    maxmulacceleration: 1.2
  };

  // Eagle ship data
  const eagleBaseSpeed = 240; // stock top speed
  const eagleBaseBoost = 350; // stock boost speed
  const eagleMinThrust = 75.0; // from ship data

  test('EPT 3A should use speed multipliers, not general multipliers', () => {
    // At 65t (below optimal), EPT should give massive speed boost
    const mass65t = 65;

    // Calculate the mass curve multiplier using speed multipliers
    const xnorm = Math.min(1, (ept3a.maxmass - mass65t) / (ept3a.maxmass - ept3a.minmass));
    const exponent = Math.log((ept3a.optmulspeed - ept3a.minmulspeed) / (ept3a.maxmulspeed - ept3a.minmulspeed))
                     / Math.log(Math.min(1, (ept3a.maxmass - ept3a.optmass) / (ept3a.maxmass - ept3a.minmass)));
    const ynorm = Math.pow(xnorm, exponent);
    const speedMul = ept3a.minmulspeed + ynorm * (ept3a.maxmulspeed - ept3a.minmulspeed);

    console.log('Mass 65t:');
    console.log('  xnorm:', xnorm);
    console.log('  exponent:', exponent);
    console.log('  ynorm:', ynorm);
    console.log('  speedMul:', speedMul);
    console.log('  Expected speedMul for 384 m/s:', 384 / eagleBaseSpeed); // ~1.6

    // The speed multiplier at 65t should be close to maxmulspeed (1.6)
    expect(speedMul).toBeCloseTo(1.6, 1);
  });

  test('EPT 3A at various masses should match expected speeds', () => {
    const testCases = [
      { mass: 65,  expectedSpeed: 384, expectedBoost: 560 },
      { mass: 68,  expectedSpeed: 372, expectedBoost: 543 },
      { mass: 76,  expectedSpeed: 338, expectedBoost: 493 },
      { mass: 90,  expectedSpeed: 289, expectedBoost: 422 },
      { mass: 98,  expectedSpeed: 268, expectedBoost: 391 },
      { mass: 126, expectedSpeed: 229, expectedBoost: 333 }
    ];

    testCases.forEach(({ mass, expectedSpeed, expectedBoost }) => {
      // Calculate speed with 4 pips to engines (full power)
      const speeds = speed(mass, eagleBaseSpeed, ept3a, null, eagleMinThrust);
      const topSpeed = speeds[4]; // 4 pips to engines

      // Calculate boost speed
      const boostSpeed = calcSpeed(mass, eagleBaseBoost, ept3a, eagleMinThrust, 4, 1.0, true);

      console.log(`\nMass ${mass}t:`);
      console.log(`  Calculated top speed: ${topSpeed.toFixed(0)} m/s (expected: ${expectedSpeed} m/s)`);
      console.log(`  Calculated boost: ${boostSpeed.toFixed(0)} m/s (expected: ${expectedBoost} m/s)`);

      // Allow 2 m/s tolerance for rounding
      expect(topSpeed).toBeCloseTo(expectedSpeed, 0);
      expect(boostSpeed).toBeCloseTo(expectedBoost, 0);
    });
  });
});
