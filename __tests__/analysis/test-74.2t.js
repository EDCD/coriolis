/**
 * Test with exact EDSY mass of 74.2t
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

console.log('Testing with EDSY mass of 74.2t');
console.log('=================================\n');

const mass = 74.2; // EDSY's exact mass

const speedMul = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                        modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);

const minthrust_pct = minthrust / 100;
const powerdistEngMul = 1; // 4 pips

const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed = speedMul * baseBoost;

console.log(`Mass: ${mass}t`);
console.log(`Modified masses: ${modMinmass.toFixed(3)} / ${modOptmass.toFixed(3)} / ${modMaxmass.toFixed(3)}`);
console.log(`Speed multiplier: ${speedMul.toFixed(6)}`);
console.log(`Top speed (4 pips): ${topSpeed.toFixed(2)} m/s`);
console.log(`Boost: ${boostSpeed.toFixed(2)} m/s`);
console.log('');
console.log('Coriolis (73.65t): 579 / 784 m/s');
console.log('EDSY (74.2t): 571 / 774 m/s');
console.log('');
console.log(`My calculation (74.2t): ${topSpeed.toFixed(0)} / ${boostSpeed.toFixed(0)} m/s`);
console.log(`Match with EDSY: ${Math.abs(topSpeed - 571) < 1 && Math.abs(boostSpeed - 774) < 1 ? 'YES ✓✓✓' : 'NO'}`);
console.log(`Diff: ${(topSpeed - 571).toFixed(1)} / ${(boostSpeed - 774).toFixed(1)} m/s`);
