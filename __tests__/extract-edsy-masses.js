const fs = require('fs');

const edsyData = fs.readFileSync('/home/alex-williams/Git-Repositories/elite/EDSY/eddb.js', 'utf8');

// Modules for the Drag Drives build
const modules = [
  { name: 'Power Plant 2A', pattern: /41210.*?mass:\s*([\d.]+)/ },
  { name: 'Thrusters 3A EPT', pattern: /42311.*?mass:\s*([\d.]+)/ },
  { name: 'FSD 3A', pattern: /name:'Frame Shift Drive'.*?class:3.*?rating:'A'.*?mass:\s*([\d.]+)/ },
  { name: 'Life Support 1D', pattern: /name:'Life Support'.*?class:1.*?rating:'D'.*?mass:\s*([\d.]+)/ },
  { name: 'Power Dist 2A', pattern: /name:'Power Distributor'.*?class:2.*?rating:'A'.*?mass:\s*([\d.]+)/ },
  { name: 'Sensors 2D', pattern: /name:'Sensors'.*?class:2.*?rating:'D'.*?mass:\s*([\d.]+)/ },
  { name: 'Shield Gen 3A', pattern: /name:'Shield Generator'.*?class:3.*?rating:'A'[^}]*?mass:\s*([\d.]+)/ },
  { name: 'Fuel Tank 3C', pattern: /name:'Fuel Tank'.*?class:3.*?rating:'C'.*?mass:\s*([\d.]+)/ },
  { name: 'Cargo Rack 3E', pattern: /name:'Cargo Rack'.*?class:3.*?rating:'E'.*?mass:\s*([\d.]+)/ },
  { name: 'Supercruise Assist 1E', pattern: /name:'Supercruise Assist'.*?class:1.*?rating:'E'.*?mass:\s*([\d.]+)/ },
  { name: 'Surface Scanner 1I', pattern: /name:'Detailed Surface Scanner'.*?mass:\s*([\d.]+)/ },
  { name: 'Chaff Launcher 0I', pattern: /name:'Chaff Launcher'.*?class:0.*?rating:'I'.*?mass:\s*([\d.]+)/ }
];

console.log('EDSY Module Mass Extraction');
console.log('============================\n');

let totalMass = 35; // Hull
console.log('Hull Mass: 35.00t');
console.log('');

modules.forEach(mod => {
  const match = edsyData.match(mod.pattern);
  const mass = match ? parseFloat(match[1]) : null;

  if (mass !== null) {
    console.log(`${mod.name.padEnd(30)} ${mass.toFixed(2)}t`);
    totalMass += mass;
  } else {
    console.log(`${mod.name.padEnd(30)} NOT FOUND`);
  }
});

console.log('');
console.log(`Total EDSY mass: ${totalMass.toFixed(2)}t`);
console.log('Coriolis reports: 56.60t');
console.log(`Difference: ${(totalMass - 56.6).toFixed(2)}t`);
