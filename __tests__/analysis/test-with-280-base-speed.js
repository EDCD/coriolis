/**
 * Test with corrected base speed of 280 (from EDSY)
 */

const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6
};

// Dirty G5 + Drive Distributors
const dirtyG5optmass = -0.125;
const dirtyG5optmul = 0.40;
const driveDistOptmass = 0.1;

const combinedOptmass = (1 + dirtyG5optmass) * (1 + driveDistOptmass) - 1;
const modOptmass = eptBase.optmass * (1 + combinedOptmass);
const modMinmass = eptBase.minmass * (1 + combinedOptmass);
const modMaxmass = eptBase.maxmass * (1 + combinedOptmass);

const modMinmulSpeed = eptBase.minmulspeed * (1 + dirtyG5optmul);
const modOptmulSpeed = eptBase.optmulspeed * (1 + dirtyG5optmul);
const modMaxmulSpeed = eptBase.maxmulspeed * (1 + dirtyG5optmul);

function getMassCurveMultiplier(mass, minMass, optMass, maxMass, minMul, optMul, maxMul) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  return minMul + ynorm * (maxMul - minMul);
}

const baseSpeed = 280;  // Updated from 282 to 280
const baseBoost = 380;  // Updated from 382 to 380
const minthrust = 78.571;
const minthrust_pct = minthrust / 100;
const powerdistEngMul = 1; // 4 pips

console.log('Test with Updated Base Speed (280/380)');
console.log('=======================================\n');

console.log('Modified thruster stats:');
console.log(`  Masses: ${modMinmass.toFixed(3)} / ${modOptmass.toFixed(3)} / ${modMaxmass.toFixed(3)}`);
console.log(`  Speed muls: ${modMinmulSpeed.toFixed(4)} / ${modOptmulSpeed.toFixed(4)} / ${modMaxmulSpeed.toFixed(4)}`);
console.log('');

// Test at 74.0t
const mass1 = 74.0;
const speedMul1 = getMassCurveMultiplier(mass1, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed1 = speedMul1 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed1 = speedMul1 * baseBoost;

console.log(`At 74.0t:`);
console.log(`  Speed multiplier: ${speedMul1.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed1.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed1.toFixed(1)} m/s`);
console.log('');

// Test at 74.2t
const mass2 = 74.2;
const speedMul2 = getMassCurveMultiplier(mass2, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed2 = speedMul2 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed2 = speedMul2 * baseBoost;

console.log(`At 74.2t:`);
console.log(`  Speed multiplier: ${speedMul2.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed2.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed2.toFixed(1)} m/s`);
console.log('');

console.log('Expected:');
console.log('  EDSY: 571 / 774 m/s at 74.2t');
console.log(`  Match: ${Math.abs(topSpeed2 - 571) < 2 && Math.abs(boostSpeed2 - 774) < 2 ? 'YES ✓✓✓' : 'NO ✗'}`);
