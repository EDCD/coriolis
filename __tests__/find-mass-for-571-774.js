/**
 * Find what mass gives EDSY's 571/774 for Drive Distributors build
 */

const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6
};

const dirtyG5optmass = -0.125;
const dirtyG5optmul = 0.40;
const driveDistributorsOptmass = 0.10;
const combinedOptmul = 1 + dirtyG5optmul; // Only Dirty G5, no experimental

const modOptmass = eptBase.optmass * (1 + dirtyG5optmass) * (1 + driveDistributorsOptmass);
const modMinmass = eptBase.minmass * (1 + dirtyG5optmass) * (1 + driveDistributorsOptmass);
const modMaxmass = eptBase.maxmass * (1 + dirtyG5optmass) * (1 + driveDistributorsOptmass);

const modMinmulSpeed = eptBase.minmulspeed * combinedOptmul;
const modOptmulSpeed = eptBase.optmulspeed * combinedOptmul;
const modMaxmulSpeed = eptBase.maxmulspeed * combinedOptmul;

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

console.log('Finding mass for EDSY 571 / 774 m/s (Drive Distributors)');
console.log('========================================================\n');

let foundMass = null;

for (let mass = 70; mass <= 80; mass += 0.01) {
  const speedMul = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                            modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
  const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
  const boostSpeed = speedMul * baseBoost;

  if (Math.abs(topSpeed - 571) < 0.5 && Math.abs(boostSpeed - 774) < 1) {
    console.log(`EDSY MATCH at ${mass.toFixed(2)}t:`);
    console.log(`  Top: ${topSpeed.toFixed(1)} m/s, Boost: ${boostSpeed.toFixed(1)} m/s`);
    if (!foundMass) foundMass = mass;
  }
}

console.log('');

// Also check what Coriolis is currently showing (564/765)
console.log('Finding mass for Coriolis 564 / 765 m/s:');
for (let mass = 70; mass <= 80; mass += 0.01) {
  const speedMul = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                            modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
  const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
  const boostSpeed = speedMul * baseBoost;

  if (Math.abs(topSpeed - 564) < 0.5 && Math.abs(boostSpeed - 765) < 1) {
    console.log(`CORIOLIS MATCH at ${mass.toFixed(2)}t:`);
    console.log(`  Top: ${topSpeed.toFixed(1)} m/s, Boost: ${boostSpeed.toFixed(1)} m/s`);
    break;
  }
}

console.log('');
console.log('Analysis:');
console.log('=========');
console.log('  Dry mass: 69.2t (from build)');
console.log('  Fuel capacity: 8t');
console.log('  Reserve fuel: 0.41t');
console.log('');

if (foundMass) {
  const coriolisMass = 69.2 + 8 + (0.41 * 3.41);
  console.log(`  Coriolis calculates: 69.2 + 8 + (0.41 * 3.41) = ${coriolisMass.toFixed(2)}t`);
  console.log(`  EDSY uses: ~${foundMass.toFixed(2)}t`);
  console.log(`  Difference: ${(foundMass - coriolisMass).toFixed(2)}t`);
  console.log('');

  const neededScaling = (foundMass - 69.2 - 8) / 0.41;
  console.log(`  Needed scaling factor: (${foundMass.toFixed(2)} - 69.2 - 8) / 0.41 = ${neededScaling.toFixed(2)}`);
}
