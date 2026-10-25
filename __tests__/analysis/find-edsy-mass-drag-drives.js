/**
 * Find what mass gives EDSY's 610/828 for Drag Drives build
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

console.log('Finding mass for EDSY 610 / 828 m/s');
console.log('=====================================\n');

for (let mass = 56; mass <= 75; mass += 0.1) {
  const speedMul = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                            modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
  const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
  const boostSpeed = speedMul * baseBoost;

  if (Math.abs(topSpeed - 610) < 1 && Math.abs(boostSpeed - 828) < 2) {
    console.log(`EDSY MATCH at ${mass.toFixed(1)}t:`);
    console.log(`  Top: ${topSpeed.toFixed(1)} m/s, Boost: ${boostSpeed.toFixed(1)} m/s`);
  }

  if (Math.abs(topSpeed - 619) < 1 && Math.abs(boostSpeed - 840) < 2) {
    console.log(`CORIOLIS MATCH at ${mass.toFixed(1)}t:`);
    console.log(`  Top: ${topSpeed.toFixed(1)} m/s, Boost: ${boostSpeed.toFixed(1)} m/s`);
  }
}

console.log('');
console.log('Key masses:');
console.log('  Dry: 56.6t');
console.log('  Unladen (dry + fuel): 64.6t');
console.log('  Laden (dry + fuel + cargo): 72.6t');
