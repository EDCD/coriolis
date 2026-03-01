/**
 * Test if adding reserve fuel to movement mass gives correct speeds
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

console.log('Testing with Reserve Fuel Added');
console.log('================================\n');

const dryMass = 56.6;
const fuelCapacity = 8;
const reserveFuel = 0.41;

console.log('Current Coriolis calculation:');
const coriolisMass = dryMass + fuelCapacity;
console.log(`  Mass: ${dryMass} + ${fuelCapacity} = ${coriolisMass}t`);

const speedMul1 = getMassCurveMultiplier(coriolisMass, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed1 = speedMul1 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed1 = speedMul1 * baseBoost;

console.log(`  Speed: ${topSpeed1.toFixed(1)} / ${boostSpeed1.toFixed(1)} m/s`);
console.log(`  Coriolis shows: 619 / 840 m/s`);
console.log('');

console.log('With reserve fuel added:');
const withReserve = dryMass + fuelCapacity + reserveFuel;
console.log(`  Mass: ${dryMass} + ${fuelCapacity} + ${reserveFuel} = ${withReserve.toFixed(2)}t`);

const speedMul2 = getMassCurveMultiplier(withReserve, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed2 = speedMul2 * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed2 = speedMul2 * baseBoost;

console.log(`  Speed: ${topSpeed2.toFixed(1)} / ${boostSpeed2.toFixed(1)} m/s`);
console.log(`  EDSY shows: 610 / 828 m/s`);
console.log(`  Match: ${Math.abs(topSpeed2 - 610) < 2 && Math.abs(boostSpeed2 - 828) < 2 ? 'YES ✓' : 'NO ✗'}`);
console.log('');

console.log('Need to reach 65.5t for EDSY match:');
const needed = 65.5 - withReserve;
console.log(`  Currently at: ${withReserve.toFixed(2)}t`);
console.log(`  Need: 65.5t`);
console.log(`  Missing: ${needed.toFixed(2)}t`);
