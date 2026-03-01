/**
 * Test with corrected understanding: EDSY DOES apply optmul to speed multipliers
 * Let's try to match the expected 571/774 values
 */

// Base EPT 3A stats
const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmulspeed: 90,  // Note: in EDSY these are stored as percentages (90 instead of 0.9)
  optmulspeed: 125,
  maxmulspeed: 160,
  minmul: 90,
  optmul: 115,
  maxmul: 137
};

// Dirty Tuning G5 modifications (using typical roll values)
const dirtyG5 = {
  optmass: -0.125,  // -12.5%
  optmul: 0.40       // +40% (best roll)
};

// Drive Distributors
const driveDistributors = {
  optmass: 0.1      // +10%
};

// Imperial Courier
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

console.log('EPT 3A + Dirty G5 + Drive Distributors - Corrected Calculation');
console.log('===============================================================\n');

// Apply modifications
const modifiedOptmass = eptBase.optmass * (1 + dirtyG5.optmass) * (1 + driveDistributors.optmass);
const modifiedMinmass = eptBase.minmass * (1 + dirtyG5.optmass) * (1 + driveDistributors.optmass);
const modifiedMaxmass = eptBase.maxmass * (1 + dirtyG5.optmass) * (1 + driveDistributors.optmass);

// ALL multipliers get modified by optmul (including speed multipliers!)
const modifiedMinmulSpeed = eptBase.minmulspeed * (1 + dirtyG5.optmul);
const modifiedOptmulSpeed = eptBase.optmulspeed * (1 + dirtyG5.optmul);
const modifiedMaxmulSpeed = eptBase.maxmulspeed * (1 + dirtyG5.optmul);

console.log('Modified thruster stats:');
console.log(`  Optmass: ${eptBase.optmass}t * (1 - 0.125) * (1 + 0.1) = ${modifiedOptmass.toFixed(2)}t`);
console.log(`  Minmass: ${modifiedMinmass.toFixed(2)}t`);
console.log(`  Maxmass: ${modifiedMaxmass.toFixed(2)}t`);
console.log(`  Speed muls: ${modifiedMinmulSpeed.toFixed(0)} / ${modifiedOptmulSpeed.toFixed(0)} / ${modifiedMaxmulSpeed.toFixed(0)}`);
console.log('');

// Calculate mass curve multiplier (returns percentage)
const speedMul = getMassCurveMultiplier(mass, modifiedMinmass, modifiedOptmass, modifiedMaxmass,
                                        modifiedMinmulSpeed, modifiedOptmulSpeed, modifiedMaxmulSpeed);

console.log(`Speed multiplier at ${mass}t: ${speedMul.toFixed(2)}% = ${(speedMul / 100).toFixed(6)}`);
console.log('');

// EDSY formula with percentage multiplier
const minthrust_pct = courierMinThrust / 100;
const powerdistEngMul = 1; // 4 pips

const topSpeed = (speedMul / 100) * courierBaseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed = (speedMul / 100) * courierBaseBoost;

console.log('Calculated speeds:');
console.log(`  Top speed (4 pips):  ${topSpeed.toFixed(0)} m/s`);
console.log(`  Boost:               ${boostSpeed.toFixed(0)} m/s`);
console.log('');

console.log('Expected (from EDSY):');
console.log(`  Top speed: 571 m/s`);
console.log(`  Boost:     774 m/s`);
console.log('');

console.log('Difference:');
console.log(`  Top speed:  ${(topSpeed - 571).toFixed(0)} m/s ${Math.abs(topSpeed - 571) < 5 ? '✓ CLOSE!' : '✗'}`);
console.log(`  Boost:      ${(boostSpeed - 774).toFixed(0)} m/s ${Math.abs(boostSpeed - 774) < 5 ? '✓ CLOSE!' : '✗'}`);
