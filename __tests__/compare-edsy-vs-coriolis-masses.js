/**
 * Direct comparison of EDSY vs Coriolis module masses
 * This will help identify any mass calculation discrepancies
 */

const fs = require('fs');

// Read EDSY's eddb.js
const edsyData = fs.readFileSync('/home/alex-williams/Git-Repositories/elite/EDSY/eddb.js', 'utf8');

// Extract Imperial Courier hull mass from EDSY
const courierMatch = edsyData.match(/name:'Imperial Courier'[^}]*hullmass:\s*([\d.]+)/);
const edsyHullMass = courierMatch ? parseFloat(courierMatch[1]) : null;

console.log('IMPERIAL COURIER HULL MASS COMPARISON');
console.log('=' .repeat(60));
console.log(`EDSY hull mass:     ${edsyHullMass}t`);
console.log(`Coriolis hull mass: 35t`);
console.log(`Difference:         ${edsyHullMass ? (edsyHullMass - 35).toFixed(2) : 'N/A'}t`);
console.log('');

// Extract module masses from EDSY
console.log('MODULE MASS COMPARISON');
console.log('=' .repeat(60));

const modules = [
  { name: 'Power Plant 2A', edsy: /pp.*?class:2.*?rating:'A'.*?mass:\s*([\d.]+)/, coriolis: 1.3 },
  { name: 'Thrusters 3A EPT', edsy: /thruster.*?class:3.*?rating:'A'.*?name:'Enhanced Performance'.*?mass:\s*([\d.]+)/, coriolis: 5 },
  { name: 'FSD 3A', edsy: /fsd[^h].*?class:3.*?rating:'A'[^}]*?mass:\s*([\d.]+)/, coriolis: 5 },
  { name: 'Life Support 1D', edsy: /lifesupport.*?class:1.*?rating:'D'.*?mass:\s*([\d.]+)/, coriolis: 0.5 },
  { name: 'Power Dist 2A', edsy: /powerdistributor.*?class:2.*?rating:'A'.*?mass:\s*([\d.]+)/, coriolis: 2.5 },
  { name: 'Sensors 2D', edsy: /sensor[^s].*?class:2.*?rating:'D'.*?mass:\s*([\d.]+)/, coriolis: 1 },
  { name: 'Shield Gen 3A', edsy: /shieldgenerator.*?class:3.*?rating:'A'[^}]*?mass:\s*([\d.]+)/, coriolis: 5 },
];

let totalCoriolisMass = 35; // hull
let totalEdsyMass = edsyHullMass || 35;

modules.forEach(mod => {
  const match = edsyData.match(mod.edsy);
  const edsyMass = match ? parseFloat(match[1]) : null;

  console.log(`${mod.name.padEnd(25)} Coriolis: ${mod.coriolis.toFixed(2)}t  EDSY: ${edsyMass ? edsyMass.toFixed(2) : 'NOT FOUND'}t  Diff: ${edsyMass ? (edsyMass - mod.coriolis).toFixed(3) : 'N/A'}t`);

  totalCoriolisMass += mod.coriolis;
  if (edsyMass) totalEdsyMass += edsyMass;
});

console.log('');
console.log('TOTALS (modules only, no fuel/cargo):');
console.log('-'.repeat(60));
console.log(`Coriolis total: ${totalCoriolisMass.toFixed(2)}t`);
console.log(`EDSY total:     ${totalEdsyMass.toFixed(2)}t`);
console.log(`Difference:     ${(totalEdsyMass - totalCoriolisMass).toFixed(3)}t`);
console.log('');

// Check for reserve fuel in EDSY
const reserveFuelMatch = edsyData.match(/Imperial Courier[^}]*fueltankcap:\s*([\d.]+)/);
const edsyReserveFuel = reserveFuelMatch ? parseFloat(reserveFuelMatch[1]) : null;

console.log('FUEL COMPARISON:');
console.log('-'.repeat(60));
console.log(`Coriolis reserve fuel:     0.41t`);
console.log(`EDSY reserve fuel:         ${edsyReserveFuel ? edsyReserveFuel.toFixed(2) : 'NOT FOUND'}t`);
console.log('');

console.log('MOVEMENT MASS CALCULATION:');
console.log('-'.repeat(60));
console.log(`Coriolis: dryMass (56.6) + fuelCapacity (8) = 64.6t`);
console.log(`  -> Gives speeds: 619 / 840 m/s`);
console.log('');
console.log(`EDSY: appears to use ~65.5t`);
console.log(`  -> Gives speeds: 610 / 828 m/s`);
console.log('');
console.log(`Missing mass: 0.9t`);
console.log(`  Reserve fuel accounts for: 0.41t`);
console.log(`  Still missing: 0.49t`);
