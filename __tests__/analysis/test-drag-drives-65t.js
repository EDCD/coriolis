/**
 * Test the 65t build with Drag Drives
 */

const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6
};

// Dirty G5: optmass -12.5%, optmul +40%
const dirtyG5optmass = -0.125;
const dirtyG5optmul = 0.40;

// Drag Drives: optmul +4%
const dragDrivesOptmul = 0.04;

// Combined optmul: base * (1 + 0.40) * (1 + 0.04) = base * 1.40 * 1.04 = base * 1.456
const combinedOptmul = (1 + dirtyG5optmul) * (1 + dragDrivesOptmul) - 1;
console.log(`Combined optmul: +${(combinedOptmul * 100).toFixed(1)}% (should be +45.6%)`);

// EDSY reports +50%, which would be:
const edsyOptmul = 0.50;
console.log(`EDSY reports: +${(edsyOptmul * 100).toFixed(1)}%`);
console.log('');

// Modified masses (only optmass from blueprint)
const modOptmass = eptBase.optmass * (1 + dirtyG5optmass);
const modMinmass = eptBase.minmass * (1 + dirtyG5optmass);
const modMaxmass = eptBase.maxmass * (1 + dirtyG5optmass);

// Modified speed multipliers - using combined optmul
const modMinmulSpeed = eptBase.minmulspeed * (1 + combinedOptmul);
const modOptmulSpeed = eptBase.optmulspeed * (1 + combinedOptmul);
const modMaxmulSpeed = eptBase.maxmulspeed * (1 + combinedOptmul);

function getMassCurveMultiplier(mass, minMass, optMass, maxMass, minMul, optMul, maxMul) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  return minMul + ynorm * (maxMul - minMul);
}

const baseSpeed = 280;
const baseBoost = 380;
const minthrust = 78.571;
const minthrust_pct = minthrust / 100;
const powerdistEngMul = 1; // 4 pips

console.log('Test with Drag Drives (+45.6% optmul)');
console.log('======================================\n');

console.log('Modified thruster stats:');
console.log(`  Masses: ${modMinmass.toFixed(3)} / ${modOptmass.toFixed(3)} / ${modMaxmass.toFixed(3)}`);
console.log(`  Speed muls: ${modMinmulSpeed.toFixed(4)} / ${modOptmulSpeed.toFixed(4)} / ${modMaxmulSpeed.toFixed(4)}`);
console.log('');

// Coriolis reports laden mass 72.6t
const mass1 = 72.6;
const speedMul1 = getMassCurveMultiplier(mass1, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed1 = speedMul1 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed1 = speedMul1 * baseBoost;

console.log(`At 72.6t (Coriolis laden mass):`);
console.log(`  Speed multiplier: ${speedMul1.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed1.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed1.toFixed(1)} m/s`);
console.log(`  Coriolis shows: 619 / 840 m/s`);
console.log(`  Match: ${Math.abs(topSpeed1 - 619) < 2 && Math.abs(boostSpeed1 - 840) < 2 ? 'YES ✓' : 'NO ✗'}`);
console.log('');

// EDSY reports 56.6t dry + 8t fuel = 64.6t  unladen, but speed at full (72.6t)
const mass2 = 64.6;
const speedMul2 = getMassCurveMultiplier(mass2, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed2 = speedMul2 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed2 = speedMul2 * baseBoost;

console.log(`At 64.6t (EDSY unladen mass):`);
console.log(`  Speed multiplier: ${speedMul2.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed2.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed2.toFixed(1)} m/s`);
console.log(`  EDSY shows: 610 / 828 m/s (but this might be at full mass)`);
console.log('');

// Try with EDSY's +50% optmul
const edsyMinmulSpeed = eptBase.minmulspeed * (1 + edsyOptmul);
const edsyOptmulSpeed = eptBase.optmulspeed * (1 + edsyOptmul);
const edsyMaxmulSpeed = eptBase.maxmulspeed * (1 + edsyOptmul);

console.log('Test with EDSY\'s +50% optmul');
console.log('=============================\n');

console.log('Modified thruster stats:');
console.log(`  Masses: ${modMinmass.toFixed(3)} / ${modOptmass.toFixed(3)} / ${modMaxmass.toFixed(3)}`);
console.log(`  Speed muls: ${edsyMinmulSpeed.toFixed(4)} / ${edsyOptmulSpeed.toFixed(4)} / ${edsyMaxmulSpeed.toFixed(4)}`);
console.log('');

const speedMul3 = getMassCurveMultiplier(mass1, modMinmass, modOptmass, modMaxmass,
                                          edsyMinmulSpeed, edsyOptmulSpeed, edsyMaxmulSpeed);
const topSpeed3 = speedMul3 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed3 = speedMul3 * baseBoost;

console.log(`At 72.6t with +50% optmul:`);
console.log(`  Speed multiplier: ${speedMul3.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed3.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed3.toFixed(1)} m/s`);
console.log(`  Coriolis shows: 619 / 840 m/s`);
console.log(`  Match: ${Math.abs(topSpeed3 - 619) < 2 && Math.abs(boostSpeed3 - 840) < 2 ? 'YES ✓' : 'NO ✗'}`);
