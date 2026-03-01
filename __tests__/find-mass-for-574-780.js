/**
 * Find what mass gives 574/780 speeds
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
const driveDistOptmass = 0.1;

const combinedOptmass = (1 + dirtyG5optmass) * (1 + driveDistOptmass) - 1;
const modOptmass = eptBase.optmass * (1 + combinedOptmass);
const modMinmass = eptBase.minmass * (1 + combinedOptmass);
const modMaxmass = eptBase.maxmass * (1 + combinedOptmass);

const modMinmulSpeed = eptBase.minmulspeed * (1 + dirtyG5optmul);
const modOptmulSpeed = eptBase.optmulspeed * (1 + dirtyG5optmul);
const modMaxmulSpeed = eptBase.maxmulspeed * (1 + dirtyG5optmul);

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

console.log('Finding mass that gives 574 / 780 m/s');
console.log('=======================================\n');

// Binary search for the mass
let targetTop = 574;
let targetBoost = 780;

for (let mass = 65; mass <= 80; mass += 0.1) {
  const speedMul = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                            modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
  const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
  const boostSpeed = speedMul * baseBoost;

  if (Math.abs(topSpeed - targetTop) < 1 && Math.abs(boostSpeed - targetBoost) < 1) {
    console.log(`MATCH FOUND at ${mass.toFixed(1)}t:`);
    console.log(`  Speed multiplier: ${speedMul.toFixed(6)}`);
    console.log(`  Top speed: ${topSpeed.toFixed(1)} m/s`);
    console.log(`  Boost: ${boostSpeed.toFixed(1)} m/s`);
    console.log('');
  }
}

// Check specific masses
console.log('Specific mass checks:');
console.log('');

const testMasses = [66, 67, 68, 69, 70, 71, 72, 73, 74, 75];
testMasses.forEach(mass => {
  const speedMul = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                            modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
  const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
  const boostSpeed = speedMul * baseBoost;
  console.log(`${mass}t: ${topSpeed.toFixed(1)} / ${boostSpeed.toFixed(1)} m/s (speedMul: ${speedMul.toFixed(4)})`);
});
