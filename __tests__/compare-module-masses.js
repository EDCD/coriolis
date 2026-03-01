/**
 * Compare module masses between expected (from EDSY) and Coriolis
 */

// Base module masses (unmodified)
const baseMasses = {
  heatSink: 1.3,      // 0I Heat Sink Launcher
  lifeSupport: 0.5,   // 1D Life Support
  sensors: 0.8,       // 2D Sensors
  prismatic: 10.0     // 3A Prismatic Shield
};

// EDSY modification percentages
const edsyMods = {
  heatSink: -0.735,     // -73.5%
  lifeSupport: -0.633,  // -63.3%
  sensors: -0.584,      // -58.4%
  prismatic: -0.500     // -50.0%
};

// Coriolis reported masses
const coriolisMasses = {
  heatSink: 0.33,
  lifeSupport: 0.18,
  sensors: 0.35,
  prismatic: 5.0
};

console.log('Module Mass Comparison');
console.log('======================\n');

function calculateExpected(baseMass, modPercent) {
  return baseMass * (1 + modPercent);
}

let totalDiff = 0;

for (const module in baseMasses) {
  const expected = calculateExpected(baseMasses[module], edsyMods[module]);
  const coriolis = coriolisMasses[module];
  const diff = coriolis - expected;

  console.log(`${module}:`);
  console.log(`  Base: ${baseMasses[module].toFixed(2)}t`);
  console.log(`  Modification: ${(edsyMods[module] * 100).toFixed(1)}%`);
  console.log(`  Expected: ${baseMasses[module].toFixed(2)} * (1 + ${edsyMods[module]}) = ${expected.toFixed(3)}t`);
  console.log(`  Coriolis: ${coriolis.toFixed(2)}t`);
  console.log(`  Difference: ${diff >= 0 ? '+' : ''}${diff.toFixed(3)}t ${Math.abs(diff) < 0.001 ? '✓' : '✗'}`);
  console.log('');

  totalDiff += diff;
}

console.log(`Total mass difference: ${totalDiff >= 0 ? '+' : ''}${totalDiff.toFixed(3)}t`);
console.log('');
console.log('This should explain the 0.09t difference between:');
console.log('  EDSY dry mass: 65.74t');
console.log('  Coriolis dry mass: 65.65t');
