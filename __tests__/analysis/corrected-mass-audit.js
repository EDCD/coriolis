/**
 * Corrected mass audit with accurate module masses from coriolis-data
 */

const modules = [
  { name: 'Hull (Lightweight)', mass: 35, mod: 0 },
  { name: 'Reserve Fuel', mass: 0.41, mod: 0 },  // ADDED
  { name: 'Power Plant 2A', mass: 1.3, mod: 0 },
  { name: 'Thrusters 3A EPT', mass: 5, mod: 0 },  // CORRECTED from 2t
  { name: 'FSD 3A', mass: 5, mod: 0 },
  { name: 'Life Support 1D', mass: 0.5, mod: 0 },
  { name: 'Power Dist 2A', mass: 2.5, mod: 0 },  // CORRECTED from 3.2t
  { name: 'Sensors 2D', mass: 1, mod: 0 },  // CORRECTED from 0.8t
  { name: 'Fuel Tank 3C', mass: 0, mod: 0 },
  { name: 'Shield Gen 3A', mass: 5, mod: 0 },
  { name: 'Cargo Rack 3E', mass: 0, mod: 0 },
  { name: 'Supercruise Assist 1E', mass: 1.3, mod: 0 },
  { name: 'Surface Scanner 1I', mass: 0, mod: 0 },
  { name: 'Chaff Launcher 0I', mass: 1.3, mod: 0 }
];

console.log('Corrected Mass Audit');
console.log('===================\n');

let totalMass = 0;
modules.forEach(m => {
  const modifiedMass = m.mass * (1 + m.mod);
  totalMass += modifiedMass;
  if (m.mass > 0) {
    console.log(`${m.name.padEnd(30)} ${m.mass.toFixed(2)}t`);
  }
});

console.log('-'.repeat(50));
console.log(`${'Total calculated dry mass:'.padEnd(30)} ${totalMass.toFixed(2)}t`);
console.log('');
console.log(`Coriolis reports:          ${(56.6).toFixed(2)}t`);
console.log(`EDSY reports:              ${(56.6).toFixed(2)}t`);
console.log(`Our calculation:           ${totalMass.toFixed(2)}t`);
console.log(`Difference:                ${(totalMass - 56.6).toFixed(2)}t`);
console.log('');

if (Math.abs(totalMass - 56.6) < 0.1) {
  console.log('✓ Mass calculation matches!');
} else {
  console.log('✗ Mass calculation does NOT match');
  console.log(`  Missing/extra: ${(56.6 - totalMass).toFixed(2)}t`);
}
