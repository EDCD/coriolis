/**
 * Test Powerline Courier build at 74.06t with reserve fuel
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

// Drive Distributors modifies optmass additively
const modOptmass = eptBase.optmass * (1 + dirtyG5optmass) * (1 + driveDistributorsOptmass);
const modMinmass = eptBase.minmass * (1 + dirtyG5optmass) * (1 + driveDistributorsOptmass);
const modMaxmass = eptBase.maxmass * (1 + dirtyG5optmass) * (1 + driveDistributorsOptmass);

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

console.log('Powerline Courier Mass Calculation');
console.log('==================================\n');

const dryMass = 65.65;
const fuelCap = 8;
const reserveFuel = 0.41;

console.log(`Dry mass: ${dryMass}t`);
console.log(`Fuel capacity: ${fuelCap}t`);
console.log(`Reserve fuel: ${reserveFuel}t`);
console.log('');

const movementMass = dryMass + fuelCap + reserveFuel;
console.log(`Movement mass: ${dryMass} + ${fuelCap} + ${reserveFuel} = ${movementMass.toFixed(2)}t`);
console.log('');

const speedMul = getMassCurveMultiplier(movementMass, modMinmass, modOptmass, modMaxmass,
                                          modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed = speedMul * baseBoost;

console.log('EPT Modifiers:');
console.log(`  Modified masses: ${modMinmass.toFixed(2)} / ${modOptmass.toFixed(2)} / ${modMaxmass.toFixed(2)}`);
console.log(`  Modified speed muls: ${modMinmulSpeed.toFixed(3)} / ${modOptmulSpeed.toFixed(3)} / ${modMaxmulSpeed.toFixed(3)}`);
console.log('');

console.log('Results:');
console.log(`  Coriolis calculates: ${topSpeed.toFixed(1)} / ${boostSpeed.toFixed(1)} m/s`);
console.log(`  Alpha/Beta showing: 616 / 836 m/s`);
console.log(`  EDSY target: 571 / 774 m/s`);
console.log('');

// Test what mass gives 616/836
console.log('Finding what mass gives 616/836:');
for (let mass = 60; mass <= 80; mass += 0.1) {
  const sm = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                      modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
  const ts = sm * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
  const bs = sm * baseBoost;

  if (Math.abs(ts - 616) < 0.5 && Math.abs(bs - 836) < 1) {
    console.log(`  ${mass.toFixed(1)}t gives ${ts.toFixed(1)} / ${bs.toFixed(1)}`);
    break;
  }
}
