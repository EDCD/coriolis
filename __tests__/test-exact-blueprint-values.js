/**
 * Test with exact blueprint values from coriolis-data
 */

const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6
};

// From blueprints.json: Engine_Dirty grade 5
const dirtyG5optmass = -0.125; // -12.5%
const dirtyG5optmul = 0.40; // +40% (max roll)

// From modifierActions.json: special_engine_haulage (Drive Distributors)
const driveDistOptmass = 0.1; // +10%

// Combined modifications
const combinedOptmass = (1 + dirtyG5optmass) * (1 + driveDistOptmass) - 1;
console.log(`Combined optmass mod: ${combinedOptmass.toFixed(6)} (${(combinedOptmass * 100).toFixed(2)}%)`);

// Modified masses (both blueprint and special)
const modOptmass = eptBase.optmass * (1 + combinedOptmass);
const modMinmass = eptBase.minmass * (1 + combinedOptmass);
const modMaxmass = eptBase.maxmass * (1 + combinedOptmass);

// Modified speed multipliers (optmul +40% applies)
const modMinmulSpeed = eptBase.minmulspeed * (1 + dirtyG5optmul);
const modOptmulSpeed = eptBase.optmulspeed * (1 + dirtyG5optmul);
const modMaxmulSpeed = eptBase.maxmulspeed * (1 + dirtyG5optmul);

console.log('\nExact Blueprint Values Test');
console.log('===========================\n');

console.log('Blueprint modifications:');
console.log(`  Dirty G5: optmass ${dirtyG5optmass * 100}%, optmul +${dirtyG5optmul * 100}%`);
console.log(`  Drive Distributors: optmass +${driveDistOptmass * 100}%`);
console.log('');

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

// Test at both masses
console.log('Test at 74.0t (Coriolis):');
const mass1 = 74.0;
const speedMul1 = getMassCurveMultiplier(mass1, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed1 = speedMul1 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed1 = speedMul1 * baseBoost;
console.log(`  Speed multiplier: ${speedMul1.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed1.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed1.toFixed(1)} m/s`);
console.log(`  Coriolis shows: 579 / 784 m/s`);
console.log(`  Match: ${Math.abs(topSpeed1 - 579) < 2 && Math.abs(boostSpeed1 - 784) < 2 ? 'YES ✓' : 'NO ✗'}`);
console.log('');

console.log('Test at 74.2t (EDSY):');
const mass2 = 74.2;
const speedMul2 = getMassCurveMultiplier(mass2, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed2 = speedMul2 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed2 = speedMul2 * baseBoost;
console.log(`  Speed multiplier: ${speedMul2.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed2.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed2.toFixed(1)} m/s`);
console.log(`  EDSY shows: 571 / 774 m/s`);
console.log(`  Match: ${Math.abs(topSpeed2 - 571) < 2 && Math.abs(boostSpeed2 - 774) < 2 ? 'YES ✓' : 'NO ✗'}`);
