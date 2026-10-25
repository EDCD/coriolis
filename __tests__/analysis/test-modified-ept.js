/**
 * Test EPT 3A with Dirty Tuning G5 + Drive Distributors
 * on Imperial Courier at 74t
 */

// Base EPT 3A stats
const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6,
  minmul: 0.9,
  optmul: 1.15,
  maxmul: 1.367
};

// Dirty Tuning G5 modifications
const dirtyG5 = {
  optmass: -0.125,  // -12.5%
  optmul: 0.4       // +40% (range 0.33 to 0.4)
};

// Drive Distributors
const driveDistributors = {
  optmass: 0.1      // +10%
};

// Imperial Courier
const courierBaseSpeed = 282;
const courierBaseBoost = 382;
const courierMinThrust = 78.571;
const mass = 74;

function getMassCurveMultiplier(mass, minMass, optMass, maxMass, minMul, optMul, maxMul) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  return minMul + ynorm * (maxMul - minMul);
}

console.log('EPT 3A + Dirty G5 + Drive Distributors on Imperial Courier @ 74t');
console.log('==================================================================\n');

// Calculate modified thruster stats

// CORIOLIS WAY (WRONG): Applies optmul modification to speed multipliers
const corolisOptmul = eptBase.optmul * (1 + dirtyG5.optmul); // 1.15 * 1.4 = 1.61
const corolisMinmulSpeed = eptBase.minmulspeed * (1 + dirtyG5.optmul); // 0.9 * 1.4 = 1.26
const corolisOptmulSpeed = eptBase.optmulspeed * (1 + dirtyG5.optmul); // 1.25 * 1.4 = 1.75
const corolisMaxmulSpeed = eptBase.maxmulspeed * (1 + dirtyG5.optmul); // 1.6 * 1.4 = 2.24

// Modified optmass: 90 * (1 - 0.125) * (1 + 0.1) = 90 * 0.875 * 1.1 = 86.625
const modifiedOptmass = eptBase.optmass * (1 + dirtyG5.optmass) * (1 + driveDistributors.optmass);

console.log('CORIOLIS (WRONG) - Applies optmul to speed multipliers:');
console.log(`  Speed muls: ${corolisMinmulSpeed.toFixed(2)} / ${corolisOptmulSpeed.toFixed(2)} / ${corolisMaxmulSpeed.toFixed(2)}`);
console.log(`  Modified optmass: ${modifiedOptmass.toFixed(2)}t`);

const coriolisMul = getMassCurveMultiplier(mass, eptBase.minmass, modifiedOptmass, eptBase.maxmass,
                                            corolisMinmulSpeed, corolisOptmulSpeed, corolisMaxmulSpeed);

const minthrust_pct = courierMinThrust / 100;
const powerdistEngMul = 1; // 4 pips

const corolisSpeed = coriolisMul * courierBaseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const corolisBoost = coriolisMul * courierBaseBoost;

console.log(`  Speed multiplier: ${coriolisMul.toFixed(6)}`);
console.log(`  Top speed: ${corolisSpeed.toFixed(0)} m/s`);
console.log(`  Boost: ${corolisBoost.toFixed(0)} m/s`);
console.log('');

// EDSY WAY (CORRECT): Does NOT apply optmul modification to speed multipliers
console.log('EDSY (CORRECT) - Does NOT apply optmul to speed multipliers:');
console.log(`  Speed muls: ${eptBase.minmulspeed.toFixed(2)} / ${eptBase.optmulspeed.toFixed(2)} / ${eptBase.maxmulspeed.toFixed(2)}`);
console.log(`  Modified optmass: ${modifiedOptmass.toFixed(2)}t`);

const edsyMul = getMassCurveMultiplier(mass, eptBase.minmass, modifiedOptmass, eptBase.maxmass,
                                       eptBase.minmulspeed, eptBase.optmulspeed, eptBase.maxmulspeed);

const edsySpeed = edsyMul * courierBaseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const edsyBoost = edsyMul * courierBaseBoost;

console.log(`  Speed multiplier: ${edsyMul.toFixed(6)}`);
console.log(`  Top speed: ${edsySpeed.toFixed(0)} m/s`);
console.log(`  Boost: ${edsyBoost.toFixed(0)} m/s`);
console.log('');

console.log('EXPECTED (from EDSY):');
console.log(`  Top speed: 571 m/s`);
console.log(`  Boost: 774 m/s`);
console.log('');

console.log('Difference from expected:');
console.log(`  Coriolis: ${(corolisSpeed - 571).toFixed(0)} / ${(corolisBoost - 774).toFixed(0)}`);
console.log(`  EDSY calc: ${(edsySpeed - 571).toFixed(0)} / ${(edsyBoost - 774).toFixed(0)}`);
