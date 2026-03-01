/**
 * Comprehensive mass audit for the Drag Drives build
 * Comparing Coriolis JSON vs EDSY TEXT export
 */

// Coriolis JSON reports:
const coriolisMasses = {
  dryMass: 56.6,
  unladenMass: 64.6,  // dry + fuel
  ladenMass: 72.6,     // dry + fuel + cargo
  fuel: 8,
  cargo: 8
};

// EDSY TEXT reports:
const edsyMasses = {
  empty: 56.60,  // "empty" = dry mass
  full: 72.60,   // "full" = laden mass
  fuel: 8,
  cargo: 8
};

console.log('Mass Audit: Drag Drives Build');
console.log('=============================\n');

console.log('Reported Masses:');
console.log('  Coriolis dry:     ', coriolisMasses.dryMass, 't');
console.log('  EDSY empty:       ', edsyMasses.empty, 't');
console.log('  Difference:       ', (coriolisMasses.dryMass - edsyMasses.empty).toFixed(2), 't');
console.log('');

console.log('  Coriolis unladen: ', coriolisMasses.unladenMass, 't');
console.log('  EDSY (calc):      ', (edsyMasses.empty + edsyMasses.fuel).toFixed(2), 't');
console.log('  Difference:       ', (coriolisMasses.unladenMass - (edsyMasses.empty + edsyMasses.fuel)).toFixed(2), 't');
console.log('');

console.log('  Coriolis laden:   ', coriolisMasses.ladenMass, 't');
console.log('  EDSY full:        ', edsyMasses.full, 't');
console.log('  Difference:       ', (coriolisMasses.ladenMass - edsyMasses.full).toFixed(2), 't');
console.log('');

// Now let's manually calculate what the dry mass SHOULD be
// Based on the Coriolis JSON export

const modules = [
  { name: 'Hull (Lightweight)', mass: 35, mod: 0 },
  { name: 'Power Plant 2A', mass: 1.3, mod: 0 },  // Overcharged G1
  { name: 'Thrusters 3A EPT', mass: 2, mod: 0 },  // Dirty G5 + Drag Drives
  { name: 'FSD 3A', mass: 5, mod: 0 },
  { name: 'Life Support 1D', mass: 0.5, mod: 0 },
  { name: 'Power Dist 2A', mass: 3.2, mod: 0 },  // Charge Enhanced G3
  { name: 'Sensors 2D', mass: 0.8, mod: 0 },
  { name: 'Fuel Tank 3C', mass: 0, mod: 0 },
  { name: 'Shield Gen 3A', mass: 5, mod: 0 },  // Reinforced G1
  { name: 'Cargo Rack 3E', mass: 0, mod: 0 },
  { name: 'Supercruise Assist 1E', mass: 1.3, mod: 0 },
  { name: 'Surface Scanner 1I', mass: 0, mod: 0 },
  { name: 'Chaff Launcher 0I', mass: 1.3, mod: 0 }
];

console.log('Manual Module Mass Calculation:');
console.log('================================\n');

let totalMass = 0;
modules.forEach(m => {
  const modifiedMass = m.mass * (1 + m.mod);
  totalMass += modifiedMass;
  console.log(`${m.name.padEnd(30)} ${m.mass.toFixed(1)}t`);
});

console.log('');
console.log(`Total calculated dry mass: ${totalMass.toFixed(2)}t`);
console.log(`Coriolis reports:          ${coriolisMasses.dryMass.toFixed(2)}t`);
console.log(`EDSY reports:              ${edsyMasses.empty.toFixed(2)}t`);
console.log(`Discrepancy:               ${(totalMass - edsyMasses.empty).toFixed(2)}t`);
console.log('');

// Speed calculations show Coriolis is using 64.6t but should be using 65.5t
// That's a difference of 0.9t
console.log('Speed Calculation Analysis:');
console.log('===========================\n');
console.log('Our tests show:');
console.log('  Coriolis 619/840 corresponds to 64.6t');
console.log('  EDSY 610/828 corresponds to 65.5t');
console.log('  Mass difference: 0.9t');
console.log('');
console.log('Coriolis unladen mass: 64.6t (dry 56.6 + fuel 8)');
console.log('EDSY effective mass: 65.5t');
console.log('Difference: 0.9t');
console.log('');
console.log('This 0.9t discrepancy needs to be explained.');
console.log('Possible causes:');
console.log('  1. Different module base masses');
console.log('  2. Missing/extra modules');
console.log('  3. Different modification effects on mass');
console.log('  4. Reserve fuel tank inclusion');
