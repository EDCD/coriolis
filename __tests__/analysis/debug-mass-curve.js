/**
 * Debug the mass curve calculation to understand the discrepancy
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
  const result = minMul + ynorm * (maxMul - minMul);

  console.log('Mass curve calculation:');
  console.log(`  mass=${mass}, minMass=${minMass.toFixed(3)}, optMass=${optMass.toFixed(3)}, maxMass=${maxMass.toFixed(3)}`);
  console.log(`  minMul=${minMul.toFixed(4)}, optMul=${optMul.toFixed(4)}, maxMul=${maxMul.toFixed(4)}`);
  console.log(`  xnorm = (${maxMass.toFixed(3)} - ${mass}) / (${maxMass.toFixed(3)} - ${minMass.toFixed(3)}) = ${xnorm.toFixed(6)}`);
  console.log(`  exponent = ln((${optMul.toFixed(4)} - ${minMul.toFixed(4)}) / (${maxMul.toFixed(4)} - ${minMul.toFixed(4)})) / ln((${maxMass.toFixed(3)} - ${optMass.toFixed(3)}) / (${maxMass.toFixed(3)} - ${minMass.toFixed(3)})) = ${exponent.toFixed(6)}`);
  console.log(`  ynorm = ${xnorm.toFixed(6)}^${exponent.toFixed(6)} = ${ynorm.toFixed(6)}`);
  console.log(`  result = ${minMul.toFixed(4)} + ${ynorm.toFixed(6)} * (${maxMul.toFixed(4)} - ${minMul.toFixed(4)}) = ${result.toFixed(6)}`);

  return result;
}

const baseSpeed = 282;
const baseBoost = 382;
const minthrust = 78.571;

// Exact mass from Coriolis export
const mass = 73.65;

console.log('Powerline Courier - Exact Mass from Coriolis');
console.log('==============================================\n');

const speedMul = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                        modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);

console.log('');

const minthrust_pct = minthrust / 100;
const powerdistEngMul = 1; // 4 pips

const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
const boostSpeed = speedMul * baseBoost;

console.log(`Top speed formula: ${speedMul.toFixed(6)} * ${baseSpeed} * (${powerdistEngMul} + ${minthrust_pct.toFixed(6)} * (1 - ${powerdistEngMul}))`);
console.log(`                 = ${speedMul.toFixed(6)} * ${baseSpeed} * ${(powerdistEngMul + minthrust_pct * (1 - powerdistEngMul)).toFixed(6)}`);
console.log(`                 = ${topSpeed.toFixed(2)} m/s`);
console.log('');
console.log(`Boost formula: ${speedMul.toFixed(6)} * ${baseBoost} = ${boostSpeed.toFixed(2)} m/s`);
console.log('');
console.log('Coriolis shows: 579 / 784 m/s');
console.log('EDSY shows: 571 / 774 m/s');
console.log('');
console.log(`My calculation: ${topSpeed.toFixed(0)} / ${boostSpeed.toFixed(0)} m/s`);
console.log(`Diff from EDSY: ${(topSpeed - 571).toFixed(1)} / ${(boostSpeed - 774).toFixed(1)} m/s`);
console.log(`Diff from Coriolis: ${(topSpeed - 579).toFixed(1)} / ${(boostSpeed - 784).toFixed(1)} m/s`);
