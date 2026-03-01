/**
 * Test what happens if Coriolis doesn't propagate optmass to minmass/maxmass
 * This might explain why Coriolis shows 595/805 instead of 571/774
 */

const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6
};

const dirtyG5 = {
  optmass: -0.125,
  optmul: 0.40
};

const driveDistributors = {
  optmass: 0.1
};

const courierBaseSpeed = 282;
const courierBaseBoost = 382;
const courierMinThrust = 78.571;
const mass = 74;

function getMassCurveMultiplier(mass, minMass, optMass, maxMass, minMul, optMul, maxMul) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  return minMul + ynorm * (maxMul - minMul);
}

console.log('Testing Coriolis Bug Hypothesis');
console.log('================================\n');

// Scenario 1: CORRECT - optmass modification propagates to min/max
const modifiedOptmass1 = eptBase.optmass * (1 + dirtyG5.optmass) * (1 + driveDistributors.optmass);
const modifiedMinmass1 = eptBase.minmass * (1 + dirtyG5.optmass) * (1 + driveDistributors.optmass);
const modifiedMaxmass1 = eptBase.maxmass * (1 + dirtyG5.optmass) * (1 + driveDistributors.optmass);
const modifiedMinmulSpeed1 = eptBase.minmulspeed * (1 + dirtyG5.optmul);
const modifiedOptmulSpeed1 = eptBase.optmulspeed * (1 + dirtyG5.optmul);
const modifiedMaxmulSpeed1 = eptBase.maxmulspeed * (1 + dirtyG5.optmul);

const speedMul1 = getMassCurveMultiplier(mass, modifiedMinmass1, modifiedOptmass1, modifiedMaxmass1,
                                          modifiedMinmulSpeed1, modifiedOptmulSpeed1, modifiedMaxmulSpeed1);

const minthrust_pct = courierMinThrust / 100;
const powerdistEngMul = 1;

const topSpeed1 = speedMul1 * courierBaseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed1 = speedMul1 * courierBaseBoost;

console.log('CORRECT (optmass propagates to min/max):');
console.log(`  Masses: ${modifiedMinmass1.toFixed(2)} / ${modifiedOptmass1.toFixed(2)} / ${modifiedMaxmass1.toFixed(2)}`);
console.log(`  Top speed:  ${topSpeed1.toFixed(0)} m/s`);
console.log(`  Boost:      ${boostSpeed1.toFixed(0)} m/s`);
console.log('');

// Scenario 2: BUG - optmass modification does NOT propagate to min/max
const modifiedOptmass2 = eptBase.optmass * (1 + dirtyG5.optmass) * (1 + driveDistributors.optmass);
const modifiedMinmass2 = eptBase.minmass;  // BUG: Not modified!
const modifiedMaxmass2 = eptBase.maxmass;  // BUG: Not modified!
const modifiedMinmulSpeed2 = eptBase.minmulspeed * (1 + dirtyG5.optmul);
const modifiedOptmulSpeed2 = eptBase.optmulspeed * (1 + dirtyG5.optmul);
const modifiedMaxmulSpeed2 = eptBase.maxmulspeed * (1 + dirtyG5.optmul);

const speedMul2 = getMassCurveMultiplier(mass, modifiedMinmass2, modifiedOptmass2, modifiedMaxmass2,
                                          modifiedMinmulSpeed2, modifiedOptmulSpeed2, modifiedMaxmulSpeed2);

const topSpeed2 = speedMul2 * courierBaseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed2 = speedMul2 * courierBaseBoost;

console.log('BUG (optmass does NOT propagate to min/max):');
console.log(`  Masses: ${modifiedMinmass2.toFixed(2)} / ${modifiedOptmass2.toFixed(2)} / ${modifiedMaxmass2.toFixed(2)}`);
console.log(`  Top speed:  ${topSpeed2.toFixed(0)} m/s`);
console.log(`  Boost:      ${boostSpeed2.toFixed(0)} m/s`);
console.log('');

console.log('Expected values:');
console.log(`  Top speed:  571 m/s`);
console.log(`  Boost:      774 m/s`);
console.log('');

console.log('Coriolis shows:');
console.log(`  Top speed:  595 m/s`);
console.log(`  Boost:      805 m/s`);
console.log('');

console.log('Which matches?');
console.log(`  Correct matches expected: ${Math.abs(topSpeed1 - 571) < 10 ? 'YES ✓' : 'NO ✗'}`);
console.log(`  Bug matches Coriolis:     ${Math.abs(topSpeed2 - 595) < 10 ? 'YES ✓' : 'NO ✗'}`);
