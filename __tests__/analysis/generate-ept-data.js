/**
 * Generate EPT calculation data to verify correctness
 * This script calculates speed values for Enhanced Performance Thrusters
 * and compares them to expected values
 */

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
};

// Eagle ship data
const eagleBaseSpeed = 240; // stock top speed
const eagleBaseBoost = 350; // stock boost speed
const eagleMinThrust = 75.0; // from ship data (minthrust percentage)

function getMassCurveMultiplier(mass, minMass, optMass, maxMass, minMul, optMul, maxMul) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  return minMul + ynorm * (maxMul - minMul);
}

function calculateSpeed(mass, baseSpeed, thrusters, minthrust, pips) {
  const minMul = thrusters.minmulspeed || thrusters.minmul;
  const optMul = thrusters.optmulspeed || thrusters.optmul;
  const maxMul = thrusters.maxmulspeed || thrusters.maxmul;

  const curNavSpdMul = getMassCurveMultiplier(
    mass,
    thrusters.minmass,
    thrusters.optmass,
    thrusters.maxmass,
    minMul,
    optMul,
    maxMul
  );

  const minthrust_pct = (minthrust || 0) / 100;
  const powerdistEngMul = pips / 4;

  return curNavSpdMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
}

function calculateBoost(mass, baseBoost, thrusters) {
  const minMul = thrusters.minmulspeed || thrusters.minmul;
  const optMul = thrusters.optmulspeed || thrusters.optmul;
  const maxMul = thrusters.maxmulspeed || thrusters.maxmul;

  const curNavSpdMul = getMassCurveMultiplier(
    mass,
    thrusters.minmass,
    thrusters.optmass,
    thrusters.maxmass,
    minMul,
    optMul,
    maxMul
  );

  return curNavSpdMul * baseBoost;
}

// Test cases from the EPT data table
const testCases = [
  { mass: 65,  expectedSpeed: 384, expectedBoost: 560, expectedIncrease: 42 },
  { mass: 68,  expectedSpeed: 372, expectedBoost: 543, expectedIncrease: 39 },
  { mass: 76,  expectedSpeed: 338, expectedBoost: 493, expectedIncrease: 29 },
  { mass: 90,  expectedSpeed: 289, expectedBoost: 422, expectedIncrease: 14 },
  { mass: 98,  expectedSpeed: 268, expectedBoost: 391, expectedIncrease: 8 },
  { mass: 126, expectedSpeed: 229, expectedBoost: 333, expectedIncrease: -3.5 }
];

console.log('Enhanced Performance Thruster (3A) Speed Calculations');
console.log('====================================================\n');
console.log('Eagle Base Speed: ' + eagleBaseSpeed + ' m/s');
console.log('Eagle Base Boost: ' + eagleBaseBoost + ' m/s');
console.log('Eagle Min Thrust: ' + eagleMinThrust + '%\n');

console.log('EPT 3A Thruster Stats:');
console.log('  Min Mass: ' + ept3a.minmass + 't, Opt Mass: ' + ept3a.optmass + 't, Max Mass: ' + ept3a.maxmass + 't');
console.log('  Speed Multipliers: min=' + ept3a.minmulspeed + ', opt=' + ept3a.optmulspeed + ', max=' + ept3a.maxmulspeed);
console.log('  General Multipliers: min=' + ept3a.minmul + ', opt=' + ept3a.optmul + ', max=' + ept3a.maxmul);
console.log('\n');

console.log('Test Results (4 pips to engines):');
console.log('==================================\n');

testCases.forEach(({ mass, expectedSpeed, expectedBoost, expectedIncrease }) => {
  const topSpeed = calculateSpeed(mass, eagleBaseSpeed, ept3a, eagleMinThrust, 4);
  const boostSpeed = calculateBoost(mass, eagleBaseBoost, ept3a);

  const speedDiff = topSpeed - expectedSpeed;
  const boostDiff = boostSpeed - expectedBoost;
  const actualIncrease = ((topSpeed / eagleBaseSpeed - 1) * 100).toFixed(1);

  const speedMatch = Math.abs(speedDiff) < 1 ? '✓' : '✗';
  const boostMatch = Math.abs(boostDiff) < 1 ? '✓' : '✗';

  console.log(`Mass: ${mass}t (${mass < ept3a.optmass ? 'below' : mass === ept3a.optmass ? 'at' : 'above'} optimal ${ept3a.optmass}t)`);
  console.log(`  Top Speed:  ${topSpeed.toFixed(0)} m/s (expected: ${expectedSpeed} m/s, diff: ${speedDiff.toFixed(1)}) ${speedMatch}`);
  console.log(`  Boost:      ${boostSpeed.toFixed(0)} m/s (expected: ${expectedBoost} m/s, diff: ${boostDiff.toFixed(1)}) ${boostMatch}`);
  console.log(`  % Increase: ${actualIncrease}% (expected: ${expectedIncrease}%)`);
  console.log('');
});

// Now test with general multipliers to show the difference
console.log('\n\nComparison: Using GENERAL multipliers instead of SPEED multipliers');
console.log('===================================================================\n');

const eptWithGeneralMuls = {
  ...ept3a,
  minmulspeed: undefined,
  optmulspeed: undefined,
  maxmulspeed: undefined
};

testCases.forEach(({ mass, expectedSpeed, expectedBoost }) => {
  const topSpeed = calculateSpeed(mass, eagleBaseSpeed, eptWithGeneralMuls, eagleMinThrust, 4);
  const boostSpeed = calculateBoost(mass, eagleBaseBoost, eptWithGeneralMuls);

  const speedDiff = topSpeed - expectedSpeed;
  const boostDiff = boostSpeed - expectedBoost;

  console.log(`Mass: ${mass}t`);
  console.log(`  Top Speed:  ${topSpeed.toFixed(0)} m/s (expected: ${expectedSpeed} m/s, diff: ${speedDiff.toFixed(1)})`);
  console.log(`  Boost:      ${boostSpeed.toFixed(0)} m/s (expected: ${expectedBoost} m/s, diff: ${boostDiff.toFixed(1)})`);
  console.log('');
});
