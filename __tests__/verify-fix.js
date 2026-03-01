/**
 * Verify the fix produces correct speeds for Imperial Courier
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

// Test case 1: Powerline Courier (should be 571/774)
console.log('Test 1: Powerline Courier');
console.log('========================\n');

const mass1 = 74; // 66t dry + 8t fuel
const speedMul1 = getMassCurveMultiplier(mass1, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);

const minthrust_pct = minthrust / 100;
const powerdistEngMul = 1; // 4 pips

const topSpeed1 = speedMul1 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed1 = speedMul1 * baseBoost;

console.log(`Mass: ${mass1}t`);
console.log(`Modified masses: ${modMinmass.toFixed(2)} / ${modOptmass.toFixed(2)} / ${modMaxmass.toFixed(2)}`);
console.log(`Modified speed muls: ${modMinmulSpeed.toFixed(2)} / ${modOptmulSpeed.toFixed(2)} / ${modMaxmulSpeed.toFixed(2)}`);
console.log(`Speed multiplier: ${speedMul1.toFixed(6)}`);
console.log(`Top speed (4 pips): ${topSpeed1.toFixed(1)} m/s`);
console.log(`Boost: ${boostSpeed1.toFixed(1)} m/s`);
console.log('');
console.log('Expected from EDSY: 571 / 774 m/s');
console.log(`Match: ${Math.abs(topSpeed1 - 571) < 2 && Math.abs(boostSpeed1 - 774) < 2 ? 'YES ✓' : 'NO ✗'}`);
console.log(`Diff: ${(topSpeed1 - 571).toFixed(1)} / ${(boostSpeed1 - 774).toFixed(1)} m/s`);
console.log('');

// Test case 2: Other Courier (should be 606/823)
console.log('Test 2: Other Courier');
console.log('=====================\n');

const mass2 = 67; // Estimated based on 606/823 speeds
const speedMul2 = getMassCurveMultiplier(mass2, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);

const topSpeed2 = speedMul2 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed2 = speedMul2 * baseBoost;

console.log(`Mass: ${mass2}t`);
console.log(`Speed multiplier: ${speedMul2.toFixed(6)}`);
console.log(`Top speed (4 pips): ${topSpeed2.toFixed(1)} m/s`);
console.log(`Boost: ${boostSpeed2.toFixed(1)} m/s`);
console.log('');
console.log('Expected from EDSY: 606 / 823 m/s');
console.log(`Match: ${Math.abs(topSpeed2 - 606) < 2 && Math.abs(boostSpeed2 - 823) < 2 ? 'YES ✓' : 'NO ✗'}`);
console.log(`Diff: ${(topSpeed2 - 606).toFixed(1)} / ${(boostSpeed2 - 823).toFixed(1)} m/s`);
