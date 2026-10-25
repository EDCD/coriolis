/**
 * Investigate the missing 0.49t
 */

console.log('Mass Investigation');
console.log('==================\n');

const dryMass = 56.6;
const fuelCapacity = 8.0;
const reserveFuel = 0.41;
const cargoCapacity = 8;

console.log('Known values:');
console.log(`  Dry mass: ${dryMass}t`);
console.log(`  Fuel capacity: ${fuelCapacity}t`);
console.log(`  Reserve fuel: ${reserveFuel}t`);
console.log(`  Cargo capacity: ${cargoCapacity}t`);
console.log('');

console.log('EDSY reported masses:');
console.log(`  Empty: 56.60t = dry mass ✓`);
console.log(`  Full: 72.60t = dry + fuel + cargo = ${dryMass + fuelCapacity + cargoCapacity}t ✓`);
console.log('');

console.log('EDSY speed calculations suggest:');
console.log(`  Movement mass: 65.5t (produces 610/828 m/s)`);
console.log(`  Difference from dry: ${65.5 - dryMass}t`);
console.log('');

console.log('Trying different theories:');
console.log('');

// Theory 1: Reserve fuel only
console.log('1. Reserve fuel only:');
const theory1 = dryMass + fuelCapacity + reserveFuel;
console.log(`   ${dryMass} + ${fuelCapacity} + ${reserveFuel} = ${theory1.toFixed(2)}t`);
console.log(`   Short by: ${(65.5 - theory1).toFixed(2)}t`);
console.log('');

// Theory 2: Reserve fuel + 10% main fuel (refuel/repair screen default)
console.log('2. Reserve fuel + 10% starting fuel:');
const theory2 = dryMass + (fuelCapacity * 0.1) + fuelCapacity + reserveFuel;
console.log(`   ${dryMass} + ${fuelCapacity * 0.1} + ${fuelCapacity} + ${reserveFuel} = ${theory2.toFixed(2)}t`);
console.log(`   Excess by: ${(theory2 - 65.5).toFixed(2)}t`);
console.log('');

// Theory 3: Reserve fuel counts as part of fuel capacity
console.log('3. Reserve fuel + fuel capacity (if they overlap):');
const theory3 = dryMass + Math.max(fuelCapacity, fuelCapacity + reserveFuel);
console.log(`   ${dryMass} + max(${fuelCapacity}, ${fuelCapacity + reserveFuel}) = ${theory3.toFixed(2)}t`);
console.log(`   Short by: ${(65.5 - theory3).toFixed(2)}t`);
console.log('');

// Theory 4: Fuel capacity includes reserve
console.log('4. Fuel capacity already includes reserve:');
const theory4 = dryMass + fuelCapacity;
console.log(`   ${dryMass} + ${fuelCapacity} = ${theory4.toFixed(2)}t (this is what Coriolis uses)`);
console.log(`   Short by: ${(65.5 - theory4).toFixed(2)}t`);
console.log('');

// Theory 5: Round reserve fuel up
console.log('5. Reserve fuel rounded up:');
const theory5 = dryMass + fuelCapacity + Math.ceil(reserveFuel * 10) / 10;
console.log(`   ${dryMass} + ${fuelCapacity} + ${Math.ceil(reserveFuel * 10) / 10} = ${theory5.toFixed(2)}t`);
console.log(`   Short by: ${(65.5 - theory5).toFixed(2)}t`);
console.log('');

// Theory 6: Check other ships
console.log('6. Let me check if 0.9t is a consistent pattern...');
console.log(`   Fuel tank size 8t -> reserve 0.41t`);
console.log(`   Missing mass: 0.9t - 0.41t = 0.49t`);
console.log(`   Ratio: 0.49t / 8t = ${(0.49 / 8 * 100).toFixed(1)}% of fuel capacity`);
console.log('');

// Theory 7: Starting fuel percentage
console.log('7. Check if a percentage of fuel is included:');
const pct = (65.5 - dryMass - reserveFuel) / fuelCapacity;
console.log(`   (65.5 - ${dryMass} - ${reserveFuel}) / ${fuelCapacity} = ${(pct * 100).toFixed(1)}%`);
console.log(`   So mass = dry + (fuel * ${(pct * 100).toFixed(1)}%) + reserve`);
console.log(`   ${dryMass} + (${fuelCapacity} * ${pct.toFixed(4)}) + ${reserveFuel} = ${(dryMass + fuelCapacity * pct + reserveFuel).toFixed(2)}t`);
console.log('');

console.log('Most likely explanation:');
console.log('  EDSY includes both fuel capacity AND reserve fuel');
console.log(`  But there's still 0.49t unaccounted for...`);
console.log('');
console.log('Need to:');
console.log('  1. Check EDSY source code for movement mass calculation');
console.log('  2. Test with other ships to see if pattern holds');
console.log('  3. Check if cargo racks or other modules add unlisted mass');
