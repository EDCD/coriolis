/**
 * Full mass audit comparing EDSY and Coriolis
 */

// All modules with their base masses and modifications
const modules = [
  { name: 'Hull', base: 35, mod: 0, coriolis: 35, edsy: 35 },
  { name: 'Power Plant 3A', base: 2.5, mod: 0, coriolis: null, edsy: null },
  { name: 'Thrusters 3A EPT', base: 2, mod: 0, coriolis: null, edsy: null },
  { name: 'FSD 3A SCO', base: 2, mod: 0.30, coriolis: null, edsy: null },
  { name: 'Life Support 1D', base: 0.5, mod: -0.633, coriolis: 0.18, edsy: 0.183 },
  { name: 'Power Dist 3D', base: 4, mod: 0, coriolis: null, edsy: null },
  { name: 'Sensors 2D', base: 0.8, mod: -0.584, coriolis: 0.35, edsy: 0.333 },
  { name: 'Fuel Tank 3C', base: 0, mod: 0, coriolis: 0, edsy: 0 },
  { name: 'Prismatic 3A', base: 10, mod: -0.50, coriolis: 5.0, edsy: 5.0 },
  { name: 'Fuel Scoop 3A', base: 5, mod: 0, coriolis: null, edsy: null },
  { name: 'FSD Booster 2H', base: 1.3, mod: 0, coriolis: null, edsy: null },
  { name: 'GSRP 2D', base: 2, mod: 0, coriolis: null, edsy: null },
  { name: 'GSRP 2D', base: 2, mod: 0, coriolis: null, edsy: null },
  { name: 'GSRP 1D', base: 0.5, mod: 0, coriolis: null, edsy: null },
  { name: 'GSRP 1D', base: 0.5, mod: 0, coriolis: null, edsy: null },
  { name: 'Supercruise Assist 1E', base: 1.3, mod: 0, coriolis: null, edsy: null },
  { name: 'Heat Sink 0I', base: 1.3, mod: -0.735, coriolis: 0.33, edsy: 0.345 },
  { name: 'Shield Booster 0E', base: 0.5, mod: 0, coriolis: null, edsy: null },
  { name: 'Shield Booster 0E', base: 0.5, mod: 0, coriolis: null, edsy: null },
  { name: 'Shield Booster 0E', base: 0.5, mod: 0, coriolis: null, edsy: null }
];

console.log('Full Mass Audit');
console.log('===============\n');

let totalBase = 0;
let totalExpected = 0;
let totalCoriolis = 0;
let totalEdsy = 0;

modules.forEach(m => {
  const expected = m.base * (1 + m.mod);
  totalBase += m.base;
  totalExpected += expected;

  if (m.coriolis !== null) {
    totalCoriolis += m.coriolis;
  } else {
    totalCoriolis += expected;
  }

  if (m.edsy !== null) {
    totalEdsy += m.edsy;
  } else {
    totalEdsy += expected;
  }
});

console.log(`Total base mass: ${totalBase.toFixed(2)}t`);
console.log(`Total expected (with mods): ${totalExpected.toFixed(2)}t`);
console.log(`Total Coriolis: ${totalCoriolis.toFixed(2)}t`);
console.log(`Total EDSY: ${totalEdsy.toFixed(2)}t`);
console.log('');
console.log(`Difference (Coriolis vs Expected): ${(totalCoriolis - totalExpected).toFixed(3)}t`);
console.log(`Difference (EDSY vs Expected): ${(totalEdsy - totalExpected).toFixed(3)}t`);
console.log(`Difference (Coriolis vs EDSY): ${(totalCoriolis - totalEdsy).toFixed(3)}t`);
console.log('');
console.log('Target from EDSY: 65.74t');
console.log('Target from Coriolis JSON: 65.65t');
