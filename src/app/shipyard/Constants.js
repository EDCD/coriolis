
export const SizeMap = ['', 'small', 'medium', 'large', 'capital'];

export const StandardArray = [
  'pp', // Power Plant
  't',  // Thrusters
  'fsd', // Frame Shift Drive
  'ls', // Life Support
  'pd', // Power Distributor
  's',  // Sensors
  'ft', // Fuel Tank
  'gpp', // Guardian Hybrid Power Plant
  'gpd' // Guardian Hybrid Power Distributor
];

// Map to lookup group labels/names for component grp, used for JSON Serialization
export const ModuleGroupToName = {
  // Standard
  pp: 'Power Plant',
  gpp: 'Guardian Hybrid Power Plant',
  gpd: 'Guardian Hybrid Power Distributor',
  t: 'Thrusters',
  fsd: 'Frame Shift Drive',
  ls: 'Life Support',
  pd: 'Power Distributor',
  s: 'Sensors',
  ft: 'Fuel Tank',
  pas: 'Planetary Approach Suite',

  // Internal
  fs: 'Fuel Scoop',
  sc: 'Scanner',
  am: 'Auto Field-Maintenance Unit',
  bsg: 'Bi-Weave Shield Generator',
  cr: 'Cargo Rack',
  fh: 'Fighter Hangar',
  fi: 'Frame Shift Drive Interdictor',
  hb: 'Hatch Breaker Limpet Controller',
  hr: 'Hull Reinforcement Package',
  mrp: 'Module Reinforcement Package',
  rf: 'Refinery',
  scb: 'Shield Cell Bank',
  sg: 'Shield Generator',
  pv: 'Planetary Vehicle Hangar',
  psg: 'Prismatic Shield Generator',
  dc: 'Docking Computer',
  fx: 'Fuel Transfer Limpet Controller',
  pc: 'Prospector Limpet Controller',
  pce: 'Economy Class Passenger Cabin',
  pci: 'Business Class Passenger Cabin',
  pcm: 'First Class Passenger Cabin',
  pcq: 'Luxury Passenger Cabin',
  cc: 'Collector Limpet Controller',
  ss: 'Surface Scanner',

  // Hard Points
  bl: 'Beam Laser',
  ul: 'Burst Laser',
  c: 'Cannon',
  ch: 'Chaff Launcher',
  cs: 'Cargo Scanner',
  cm: 'Countermeasure',
  ec: 'Electronic Countermeasure',
  fc: 'Fragment Cannon',
  rfl: 'Remote Release Flak Launcher',
  hs: 'Heat Sink Launcher',
  ws: 'Frame Shift Wake Scanner',
  kw: 'Kill Warrant Scanner',
  nl: 'Mine Launcher',
  ml: 'Mining Laser',
  mr: 'Missile Rack',
  axmr: 'AX Missile Rack',
  pa: 'Plasma Accelerator',
  po: 'Point Defence',
  mc: 'Multi-cannon',
  axmc: 'AX Multi-cannon',
  pl: 'Pulse Laser',
  rg: 'Rail Gun',
  sb: 'Shield Booster',
  tp: 'Torpedo Pylon',
  sfn: 'Shutdown Field Neutraliser',
  xs: 'Xeno Scanner',
  gpc: 'Guardian Plasma Charger',
  ggc: 'Guardian Gauss Cannon',
};

let GrpNameToCodeMap = {};

for (let grp in ModuleGroupToName) {
  GrpNameToCodeMap[ModuleGroupToName[grp].toLowerCase()] = grp;
}

export const ModuleNameToGroup = GrpNameToCodeMap;

export const MountMap = {
  'F': 'Fixed',
  'G': 'Gimballed',
  'T': 'Turret',
  'Fixed': 'F',
  'Gimballed': 'G',
  'Turret': 'T'
};

export const BulkheadNames = [
  'Lightweight Alloy',
  'Reinforced Alloy',
  'Military Grade Composite',
  'Mirrored Surface Composite',
  'Reactive Surface Composite'
];

/**
 * Array of all Ship properties (facets) organized into groups
 * used for ship comparisons.
 *
 * @type {Array}
 */
export const ShipFacets = [
  {                   // 0
    title: 'agility',
    props: ['topPitch', 'topRoll', 'topYaw'],
    lbls: ['pitch', 'roll', 'yaw'],
    fmt: 'f1',
    i: 0
  },
  {                   // 1
    title: 'speed',
    props: ['topSpeed', 'topBoost'],
    lbls: ['thrusters', 'boost'],
    unit: 'm/s',
    fmt: 'int',
    i: 1
  },
  {                   // 2
    title: 'armour',
    props: ['armour'],
    fmt: 'int',
    i: 2
  },
  {                   // 3
    title: 'shields',
    props: ['shield'],
    unit: 'MJ',
    fmt: 'int',
    i: 3
  },
  {                   // 4
    title: 'jump range',
    props: ['unladenRange', 'fullTankRange', 'ladenRange'],
    lbls: ['max', 'full tank', 'laden'],
    unit: 'LY',
    fmt: 'round',
    i: 4
  },
  {                   // 5
    title: 'mass',
    props: ['unladenMass', 'ladenMass'],
    lbls: ['unladen', 'laden'],
    unit: 'T',
    fmt: 'round',
    i: 5
  },
  {                   // 6
    title: 'cargo',
    props: ['cargoCapacity'],
    unit: 'T',
    fmt: 'int',
    i: 6
  },
  {                   // 7
    title: 'fuel',
    props: ['fuelCapacity'],
    unit: 'T',
    fmt: 'int',
    i: 7
  },
  {                   // 8
    title: 'power',
    props: ['powerRetracted', 'powerDeployed', 'powerAvailable'],
    lbls: ['retracted', 'deployed', 'available'],
    unit: 'MW',
    fmt: 'f2',
    i: 8
  },
  {                   // 9
    title: 'cost',
    props: ['totalCost'],
    unit: 'CR',
    fmt: 'int',
    i: 9
  },
  {                   // 10
    title: 'fastest range',
    props: ['unladenFastestRange', 'ladenFastestRange'],
    lbls: ['unladen', 'laden'],
    unit: 'LY',
    fmt: 'round',
    i: 10
  },
  {                   // 11
    title: 'DPS',
    props: ['totalDps', 'totalExplDps', 'totalKinDps', 'totalThermDps'],
    lbls: ['total', 'explosive', 'kinetic', 'thermal'],
    fmt: 'round',
    i: 11
  },
  {                   // 14
    title: 'Sustained DPS',
    props: ['totalSDps', 'totalExplSDps', 'totalKinSDps', 'totalThermSDps'],
    lbls: ['total', 'explosive', 'kinetic', 'thermal'],
    fmt: 'round',
    i: 14
  },
  {                   // 12
    title: 'EPS',
    props: ['totalEps'],
    lbls: ['EPS'],
    fmt: 'round',
    i: 12
  },
  {                   // 13
    title: 'HPS',
    props: ['totalHps'],
    lbls: ['HPS'],
    fmt: 'round',
    i: 13
  }
];

/**
 * Set of all insurance levels
 */
export const Insurance = {
  'standard': 0.05,
  'alpha': 0.025,
  'beta': 0.0375
};

/**
 * Set of all available / theoretical discounts
 */
export const Discounts = {
  '0%': 1,
  '2.5%': 0.975,
  '5%': 0.95,
  '10%': 0.90,
  '12.5%': 0.875,
  '15%': 0.85,
  '20%': 0.80,
  '25%': 0.75
};
