/**
 * Compare speeds at 74.0t vs 74.2t to see if mass rounding explains the discrepancy
 */

const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6
};

const dirtyG5optmass = -0.125; // -12.5%
const dirtyG5optmul = 0.40; // +40%
const driveDistOptmass = 0.1; // +10%

// Modified masses (both blueprint and special)
const modOptmass = eptBase.optmass * (1 + dirtyG5optmass) * (1 + driveDistOptmass);
const modMinmass = eptBase.minmass * (1 + dirtyG5optmass) * (1 + driveDistOptmass);
const modMaxmass = eptBase.maxmass * (1 + dirtyG5optmass) * (1 + driveDistOptmass);

// Modified speed multipliers (optmul applies)
const modMinmulSpeed = eptBase.minmulspeed * (1 + dirtyG5optmul);
const modOptmulSpeed = eptBase.optmulspeed * (1 + dirtyG5optmul);
const modMaxmulSpeed = eptBase.maxmulspeed * (1 + dirtyG5optmul);

function getMassCurveMultiplier(mass, minMass, optMass, maxMass, minMul, optMul, maxMul) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  return minMul + ynorm * (maxMul - minMul);
}

const baseSpeed = 282;
const baseBoost = 382;
const minthrust = 78.571;
const minthrust_pct = minthrust / 100;
const powerdistEngMul = 1; // 4 pips

console.log('Comparing 74.0t vs 74.2t');
console.log('=========================\n');

// Test 1: 74.0t (Coriolis rounded)
const mass1 = 74.0;
const speedMul1 = getMassCurveMultiplier(mass1, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed1 = speedMul1 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed1 = speedMul1 * baseBoost;

console.log(`At 74.0t (Coriolis):`);
console.log(`  Speed multiplier: ${speedMul1.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed1.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed1.toFixed(1)} m/s`);
console.log('');

// Test 2: 74.2t (EDSY)
const mass2 = 74.2;
const speedMul2 = getMassCurveMultiplier(mass2, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed2 = speedMul2 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed2 = speedMul2 * baseBoost;

console.log(`At 74.2t (EDSY):`);
console.log(`  Speed multiplier: ${speedMul2.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed2.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed2.toFixed(1)} m/s`);
console.log('');

console.log('Expected values:');
console.log('  Coriolis: 579 / 784 m/s');
console.log('  EDSY: 571 / 774 m/s');
console.log('');

console.log('Analysis:');
console.log(`  74.0t calculation matches Coriolis: ${Math.abs(topSpeed1 - 579) < 1 && Math.abs(boostSpeed1 - 784) < 1 ? 'YES ✓' : 'NO ✗'}`);
console.log(`  74.2t calculation matches EDSY: ${Math.abs(topSpeed2 - 571) < 1 && Math.abs(boostSpeed2 - 774) < 1 ? 'YES ✓' : 'NO ✗'}`);
console.log('');
console.log(`  Difference from 0.2t mass change: ${(topSpeed1 - topSpeed2).toFixed(1)} / ${(boostSpeed1 - boostSpeed2).toFixed(1)} m/s`);
console.log(`  Actual difference (Coriolis vs EDSY): ${(579 - 571).toFixed(1)} / ${(784 - 774).toFixed(1)} m/s`);
