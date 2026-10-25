/**
 * Test if optmul should apply to speed multipliers
 */

const ept3aBase = {
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

const dirtyG5optmul = 0.40; // +40%
const dirtyG5optmass = -0.125; // -12.5%
const driveDistOptmass = 0.1; // +10%

// Modified masses (both blueprint and special)
const modOptmass = ept3aBase.optmass * (1 + dirtyG5optmass) * (1 + driveDistOptmass);
const modMinmass = ept3aBase.minmass * (1 + dirtyG5optmass) * (1 + driveDistOptmass);
const modMaxmass = ept3aBase.maxmass * (1 + dirtyG5optmass) * (1 + driveDistOptmass);

function getMassCurveMultiplier(mass, minMass, optMass, maxMass, minMul, optMul, maxMul) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  return minMul + ynorm * (maxMul - minMul);
}

const mass = 73.65;
const baseSpeed = 282;
const minthrust = 78.571;

console.log('Testing if optmul should apply to speed multipliers');
console.log('===================================================\n');

// Scenario 1: optmul DOES apply to speed muls (current Coriolis behavior)
const withOptmul = {
  minmul: ept3aBase.minmulspeed * (1 + dirtyG5optmul),
  optmul: ept3aBase.optmulspeed * (1 + dirtyG5optmul),
  maxmul: ept3aBase.maxmulspeed * (1 + dirtyG5optmul)
};

const speedMul1 = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                         withOptmul.minmul, withOptmul.optmul, withOptmul.maxmul);
const topSpeed1 = speedMul1 * baseSpeed;

console.log('Scenario 1: optmul applies to speed multipliers');
console.log(`  Modified muls: ${withOptmul.minmul.toFixed(2)} / ${withOptmul.optmul.toFixed(2)} / ${withOptmul.maxmul.toFixed(2)}`);
console.log(`  Speed multiplier: ${speedMul1.toFixed(4)}`);
console.log(`  Top speed (4 pips): ${topSpeed1.toFixed(1)} m/s`);
console.log('');

// Scenario 2: optmul does NOT apply to speed muls
const withoutOptmul = {
  minmul: ept3aBase.minmulspeed,
  optmul: ept3aBase.optmulspeed,
  maxmul: ept3aBase.maxmulspeed
};

const speedMul2 = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                         withoutOptmul.minmul, withoutOptmul.optmul, withoutOptmul.maxmul);
const topSpeed2 = speedMul2 * baseSpeed;

console.log('Scenario 2: optmul does NOT apply to speed multipliers');
console.log(`  Base muls: ${withoutOptmul.minmul.toFixed(2)} / ${withoutOptmul.optmul.toFixed(2)} / ${withoutOptmul.maxmul.toFixed(2)}`);
console.log(`  Speed multiplier: ${speedMul2.toFixed(4)}`);
console.log(`  Top speed (4 pips): ${topSpeed2.toFixed(1)} m/s`);
console.log('');

console.log('Expected from EDSY: 571 m/s');
console.log('');
console.log(`Scenario 1 matches: ${Math.abs(topSpeed1 - 571) < 5 ? 'YES ✓' : 'NO ✗'} (diff: ${(topSpeed1 - 571).toFixed(1)} m/s)`);
console.log(`Scenario 2 matches: ${Math.abs(topSpeed2 - 571) < 5 ? 'YES ✓' : 'NO ✗'} (diff: ${(topSpeed2 - 571).toFixed(1)} m/s)`);
