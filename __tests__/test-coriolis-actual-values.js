/**
 * Test with Coriolis's actual displayed values
 */

const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmul: 0.9,      // Base acceleration multiplier
  optmul: 1.15,     // Base acceleration multiplier
  maxmul: 1.367,    // Base acceleration multiplier
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6
};

// Coriolis displays:
// optmass: 87t (actual final value)
// optmul: 161% = 1.61 (actual final value for ACCELERATION, not speed!)

// Calculate the modification factor
const displayedOptmass = 87;
const optmassMod = (displayedOptmass / eptBase.optmass) - 1; // (87/90) - 1 = -0.0333

const displayedOptmul = 1.61; // 161%
const optmulMod = (displayedOptmul / eptBase.optmul) - 1; // (1.61/1.15) - 1 = 0.4

console.log('Analyzing Coriolis Displayed Values');
console.log('====================================\n');

console.log('Coriolis UI shows:');
console.log('  optmass: 87t');
console.log('  optmul: 161%');
console.log('');

console.log('Base EPT stats:');
console.log(`  optmass: ${eptBase.optmass}t`);
console.log(`  optmul (acceleration): ${eptBase.optmul} (115%)`);
console.log(`  optmulspeed: ${eptBase.optmulspeed} (125%)`);
console.log('');

console.log('Calculated modification factors:');
console.log(`  optmass mod: (87 / 90) - 1 = ${optmassMod.toFixed(6)} (${(optmassMod * 100).toFixed(2)}%)`);
console.log(`  optmul mod: (1.61 / 1.15) - 1 = ${optmulMod.toFixed(6)} (${(optmulMod * 100).toFixed(2)}%)`);
console.log('');

// Apply to all mass values
const modOptmass = eptBase.optmass * (1 + optmassMod);
const modMinmass = eptBase.minmass * (1 + optmassMod);
const modMaxmass = eptBase.maxmass * (1 + optmassMod);

// Apply to SPEED multipliers (not acceleration!)
const modMinmulSpeed = eptBase.minmulspeed * (1 + optmulMod);
const modOptmulSpeed = eptBase.optmulspeed * (1 + optmulMod);
const modMaxmulSpeed = eptBase.maxmulspeed * (1 + optmulMod);

console.log('Modified thruster stats:');
console.log(`  Masses: ${modMinmass.toFixed(3)} / ${modOptmass.toFixed(3)} / ${modMaxmass.toFixed(3)}`);
console.log(`  Speed muls: ${modMinmulSpeed.toFixed(4)} / ${modOptmulSpeed.toFixed(4)} / ${modMaxmulSpeed.toFixed(4)}`);
console.log('');

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

// Test with Coriolis mass (74t)
const mass1 = 74.0;
const speedMul1 = getMassCurveMultiplier(mass1, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed1 = speedMul1 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed1 = speedMul1 * baseBoost;

console.log(`At 74.0t (Coriolis mass):`);
console.log(`  Speed multiplier: ${speedMul1.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed1.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed1.toFixed(1)} m/s`);
console.log('');

console.log('Coriolis shows: 579 / 784 m/s');
console.log(`Match: ${Math.abs(topSpeed1 - 579) < 2 && Math.abs(boostSpeed1 - 784) < 2 ? 'YES ✓✓✓' : 'NO ✗'}`);
console.log(`Difference: ${(topSpeed1 - 579).toFixed(1)} / ${(boostSpeed1 - 784).toFixed(1)} m/s`);
