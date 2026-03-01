/**
 * Test with EDSY's actual reported modification values
 */

const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6
};

// EDSY reports: Optimal Mass -3.7%, Optimal Multiplier +46.0%
const edsyOptmass = -0.037; // -3.7%
const edsyOptmul = 0.46; // +46%

// Modified masses
const modOptmass = eptBase.optmass * (1 + edsyOptmass);
const modMinmass = eptBase.minmass * (1 + edsyOptmass);
const modMaxmass = eptBase.maxmass * (1 + edsyOptmass);

// Modified speed multipliers
const modMinmulSpeed = eptBase.minmulspeed * (1 + edsyOptmul);
const modOptmulSpeed = eptBase.optmulspeed * (1 + edsyOptmul);
const modMaxmulSpeed = eptBase.maxmulspeed * (1 + edsyOptmul);

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

console.log('Testing with EDSY\'s Actual Reported Values');
console.log('==========================================\n');

console.log('EDSY reports:');
console.log(`  Optimal Mass: -3.7%`);
console.log(`  Optimal Multiplier: +46.0%`);
console.log('');

console.log('Modified thruster stats:');
console.log(`  Masses: ${modMinmass.toFixed(3)} / ${modOptmass.toFixed(3)} / ${modMaxmass.toFixed(3)}`);
console.log(`  Speed muls: ${modMinmulSpeed.toFixed(4)} / ${modOptmulSpeed.toFixed(4)} / ${modMaxmulSpeed.toFixed(4)}`);
console.log('');

const mass = 74.2;
const speedMul = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                        modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed = speedMul * baseBoost;

console.log(`At 74.2t:`);
console.log(`  Speed multiplier: ${speedMul.toFixed(6)}`);
console.log(`  Top speed: ${topSpeed.toFixed(1)} m/s`);
console.log(`  Boost: ${boostSpeed.toFixed(1)} m/s`);
console.log('');

console.log('EDSY shows: 571 / 774 m/s');
console.log(`Match: ${Math.abs(topSpeed - 571) < 2 && Math.abs(boostSpeed - 774) < 2 ? 'YES ✓✓✓' : 'NO ✗'}`);
console.log(`Difference: ${(topSpeed - 571).toFixed(1)} / ${(boostSpeed - 774).toFixed(1)} m/s`);
