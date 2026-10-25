/**
 * Find what mass gives EDSY's 606/823 for Drag Drives build
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
const dragDrivesOptmul = 0.04;
const combinedOptmul = (1 + dirtyG5optmul) * (1 + dragDrivesOptmul) - 1;

const modOptmass = eptBase.optmass * (1 + dirtyG5optmass);
const modMinmass = eptBase.minmass * (1 + dirtyG5optmass);
const modMaxmass = eptBase.maxmass * (1 + dirtyG5optmass);

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

console.log('Finding mass for EDSY 606 / 823 m/s');
console.log('=====================================\n');

let foundMass = null;

for (let mass = 60; mass <= 70; mass += 0.01) {
  const speedMul = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                            modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
  const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
  const boostSpeed = speedMul * baseBoost;

  if (Math.abs(topSpeed - 606) < 0.5 && Math.abs(boostSpeed - 823) < 1) {
    console.log(`EDSY MATCH at ${mass.toFixed(2)}t:`);
    console.log(`  Top: ${topSpeed.toFixed(1)} m/s, Boost: ${boostSpeed.toFixed(1)} m/s`);
    if (!foundMass) foundMass = mass;
  }

  if (Math.abs(topSpeed - 619) < 0.5 && Math.abs(boostSpeed - 840) < 1) {
    console.log(`CORIOLIS MATCH at ${mass.toFixed(2)}t:`);
    console.log(`  Top: ${topSpeed.toFixed(1)} m/s, Boost: ${boostSpeed.toFixed(1)} m/s`);
  }
}

console.log('');
console.log('Analysis:');
console.log('=========');
console.log('  Dry mass: 56.6t');
console.log('  Fuel capacity: 8t');
console.log('  Reserve fuel: 0.41t');
console.log('');
console.log(`  Coriolis uses: 56.6 + 8 = 64.6t -> gives 619/840`);
console.log(`  EDSY uses: ~${foundMass ? foundMass.toFixed(2) : '?'}t -> gives 606/823`);
console.log('');

if (foundMass) {
  const diff = foundMass - 56.6;
  console.log(`  Mass added to dry: ${diff.toFixed(2)}t`);
  console.log('');

  // Check theories
  const withReserve = 56.6 + 8 + 0.41;
  console.log('  Theory 1: dry + fuel + reserve');
  console.log(`    56.6 + 8 + 0.41 = ${withReserve.toFixed(2)}t`);
  console.log(`    Difference: ${(foundMass - withReserve).toFixed(2)}t`);
  console.log('');

  console.log('  Theory 2: dry + fuel only');
  console.log(`    56.6 + 8 = 64.60t`);
  console.log(`    Difference: ${(foundMass - 64.6).toFixed(2)}t`);
}
