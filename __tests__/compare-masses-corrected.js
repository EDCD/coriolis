/**
 * Accurate comparison of EDSY vs Coriolis module masses
 * Using data extracted directly from eddb.js and coriolis-data
 */

console.log('Module Mass Comparison: EDSY vs Coriolis');
console.log('==========================================\n');

const modules = [
  { name: 'Hull (Imperial Courier)', edsy: 35.00, coriolis: 35.00 },
  { name: 'Power Plant 2A', edsy: 1.30, coriolis: 1.30 },
  { name: 'Thrusters 3A EPT', edsy: 5.00, coriolis: 5.00 },
  { name: 'FSD 3A', edsy: 5.00, coriolis: 5.00 },
  { name: 'Life Support 1D', edsy: 0.50, coriolis: 0.50 },
  { name: 'Power Dist 2A', edsy: 2.50, coriolis: 2.50 },
  { name: 'Sensors 2D', edsy: 1.00, coriolis: 1.00 },
  { name: 'Fuel Tank 3C', edsy: 0.00, coriolis: 0.00 },
  { name: 'Shield Gen 3A', edsy: 5.00, coriolis: 5.00 },
  { name: 'Cargo Rack 3E', edsy: 0.00, coriolis: 0.00 },
  { name: 'Supercruise Assist 1E', edsy: 0.00, coriolis: 0.00 },
  { name: 'Surface Scanner 1I', edsy: 0.00, coriolis: 0.00 },
  { name: 'Chaff Launcher 0I', edsy: 1.30, coriolis: 1.30 }
];

let edsyTotal = 0;
let coriolisTotal = 0;

modules.forEach(m => {
  const diff = m.edsy - m.coriolis;
  if (m.edsy > 0 || m.coriolis > 0) {
    const status = diff === 0 ? '✓' : '✗';
    console.log(`${status} ${m.name.padEnd(30)} EDSY: ${m.edsy.toFixed(2)}t  Coriolis: ${m.coriolis.toFixed(2)}t  Diff: ${diff.toFixed(3)}t`);
  }
  edsyTotal += m.edsy;
  coriolisTotal += m.coriolis;
});

console.log('');
console.log('='.repeat(80));
console.log(`EDSY Total:      ${edsyTotal.toFixed(2)}t`);
console.log(`Coriolis Total:  ${coriolisTotal.toFixed(2)}t`);
console.log(`Difference:      ${(edsyTotal - coriolisTotal).toFixed(3)}t`);
console.log('');

if (Math.abs(edsyTotal - coriolisTotal) < 0.01) {
  console.log('✓ MODULE MASSES MATCH PERFECTLY!');
  console.log('');
  console.log('The 0.9t discrepancy must come from something else...');
  console.log('');
  console.log('Investigating reserve fuel:');
  console.log('  Imperial Courier reserve fuel: 0.41t');
  console.log('');
  console.log('Movement mass calculation:');
  console.log('  Coriolis: dryMass (56.6) + fuelCapacity (8) = 64.6t');
  console.log('  EDSY equivalent: 65.5t (for 610/828 speeds)');
  console.log('  Difference: 0.9t');
  console.log('');
  console.log('If we add reserve fuel (0.41t) to Coriolis calculation:');
  console.log('  56.6 + 8 + 0.41 = 65.01t');
  console.log('');
  console.log('Testing with 65.01t:');

  // Speed calculation
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

  const mass = 65.01;
  const baseSpeed = 280;
  const baseBoost = 380;
  const minthrust = 78.571;
  const minthrust_pct = minthrust / 100;
  const powerdistEngMul = 1; // 4 pips

  const speedMul = getMassCurveMultiplier(mass, modMinmass, modOptmass, modMaxmass,
                                            modMinmulSpeed, modOptmulSpeed, modMaxmulSpeed);
  const topSpeed = speedMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
  const boostSpeed = speedMul * baseBoost;

  console.log(`  Calculated speed: ${topSpeed.toFixed(1)} / ${boostSpeed.toFixed(1)} m/s`);
  console.log(`  EDSY shows: 610 / 828 m/s`);
  console.log(`  Match: ${Math.abs(topSpeed - 610) < 2 && Math.abs(boostSpeed - 828) < 2 ? 'YES ✓' : 'NO ✗'}`);

  if (Math.abs(topSpeed - 610) < 2 && Math.abs(boostSpeed - 828) < 2) {
    console.log('');
    console.log('========================================');
    console.log('SOLUTION FOUND!');
    console.log('========================================');
    console.log('');
    console.log('Coriolis needs to include RESERVE FUEL in movement mass calculation!');
    console.log('');
    console.log('Current: movementMass = dryMass + fuelCapacity');
    console.log('Should be: movementMass = dryMass + fuelCapacity + reserveFuelCapacity');
  } else {
    console.log('');
    console.log('Still need to find the remaining mass...');
  }
} else {
  console.log('✗ MASSES DO NOT MATCH');
  console.log(`  Need to investigate ${Math.abs(edsyTotal - coriolisTotal).toFixed(3)}t difference`);
}
