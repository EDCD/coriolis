/**
 * Recalculate masses with corrected FSD mass
 */

// All modules with their base masses and modifications
const modules = [
  { name: 'Hull', base: 35, mod: 0 },
  { name: 'Power Plant 3A', base: 2.5, mod: 0 },
  { name: 'Thrusters 3A EPT', base: 2, mod: 0 },
  { name: 'FSD 3A SCO', base: 5, mod: 0.30 },  // CORRECTED from 2t to 5t base
  { name: 'Life Support 1D', base: 0.5, mod: -0.633 },
  { name: 'Power Dist 3D', base: 4, mod: 0 },
  { name: 'Sensors 2D', base: 0.8, mod: -0.584 },
  { name: 'Fuel Tank 3C', base: 0, mod: 0 },
  { name: 'Prismatic 3A', base: 10, mod: -0.50 },
  { name: 'Fuel Scoop 3A', base: 5, mod: 0 },
  { name: 'FSD Booster 2H', base: 1.3, mod: 0 },
  { name: 'GSRP 2D', base: 2, mod: 0 },
  { name: 'GSRP 2D', base: 2, mod: 0 },
  { name: 'GSRP 1D', base: 0.5, mod: 0 },
  { name: 'GSRP 1D', base: 0.5, mod: 0 },
  { name: 'Supercruise Assist 1E', base: 1.3, mod: 0 },
  { name: 'Heat Sink 0I', base: 1.3, mod: -0.735 },
  { name: 'Shield Booster 0E', base: 0.5, mod: 0 },
  { name: 'Shield Booster 0E', base: 0.5, mod: 0 },
  { name: 'Shield Booster 0E', base: 0.5, mod: 0 }
];

console.log('Recalculated Mass with Corrected FSD');
console.log('=====================================\n');

let totalDryMass = 0;

modules.forEach(m => {
  const modifiedMass = m.base * (1 + m.mod);
  totalDryMass += modifiedMass;
  if (m.mod !== 0) {
    console.log(`${m.name}: ${m.base}t * (1 + ${m.mod}) = ${modifiedMass.toFixed(3)}t`);
  }
});

const fuel = 8;
const totalLadenMass = totalDryMass + fuel;

console.log('');
console.log(`Total dry mass: ${totalDryMass.toFixed(2)}t`);
console.log(`Fuel: ${fuel}t`);
console.log(`Total laden mass: ${totalLadenMass.toFixed(2)}t`);
console.log('');
console.log('EDSY reports:');
console.log('  Dry: 65.74t');
console.log('  Laden: 73.74t');
console.log('');
console.log('Coriolis should now show:');
console.log(`  Dry: ${totalDryMass.toFixed(2)}t (diff: ${(totalDryMass - 65.74).toFixed(2)}t)`);
console.log(`  Laden: ${totalLadenMass.toFixed(2)}t (diff: ${(totalLadenMass - 73.74).toFixed(2)}t)`);
