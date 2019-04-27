export const SI_PREFIXES = {
  'Y': 1e+24, // Yotta
  'Z': 1e+21, // Zetta
  'E': 1e+18, // Peta
  'P': 1e+15, // Peta
  'T': 1e+12, // Tera
  'G': 1e+9,  // Giga
  'M': 1e+6,  // Mega
  'k': 1e+3,  // Kilo
  'h': 1e+2,  // Hekto
  'da': 1e+1, // Deka
  '': 1,
  'd': 1e-1,  // Dezi
  'c': 1e-2,  // Zenti
  'm': 1e-3,  // Milli
  'μ': 1e-6, // mikro not supported due to charset
  'n': 10e-9, // Nano
  'p': 1e-12, // Nano
  'f': 1e-15, // Femto
  'a': 1e-18, // Atto
  'z': 1e-21, // Zepto
  'y': 1e-24  // Yokto
};

export const STATS_FORMATTING = {
  'ammo': { 'format': 'int', },
  'boot': { 'format': 'int', 'unit': 'secs' },
  'brokenregen': { 'format': 'round1', 'unit': 'ps' },
  'burst': { 'format': 'int', 'change': 'additive' },
  'burstrof': { 'format': 'round1', 'unit': 'ps', 'change': 'additive' },
  'causres': { 'format': 'pct' },
  'clip': { 'format': 'int' },
  'damage': { 'format': 'round' },
  'dps': { 'format': 'round', 'units': 'ps', 'synthetic': 'getDps' },
  'dpe': { 'format': 'round', 'units': 'ps', 'synthetic': 'getDpe' },
  'distdraw': { 'format': 'round', 'unit': 'MW' },
  'duration': { 'format': 'round1', 'unit': 's' },
  'eff': { 'format': 'round2' },
  'engcap': { 'format': 'round1', 'unit': 'MJ' },
  'engrate': { 'format': 'round1', 'unit': 'MW' },
  'eps': { 'format': 'round', 'units': 'ps', 'synthetic': 'getEps' },
  'explres': { 'format': 'pct' },
  'facinglimit': { 'format': 'round1', 'unit': 'ang' },
  'falloff': { 'format': 'round', 'unit': 'km', 'storedUnit': 'm' },
  'fallofffromrange': { 'format': 'round', 'unit': 'km', 'storedUnit': 'm', 'synthetic': 'getFalloff' },
  'hps': { 'format': 'round', 'units': 'ps', 'synthetic': 'getHps' },
  'hullboost': { 'format': 'pct1', 'change': 'additive' },
  'hullreinforcement': { 'format': 'int' },
  'integrity': { 'format': 'round1' },
  'jitter': { 'format': 'round', 'unit': 'ang' },
  'kinres': { 'format': 'pct' },
  'mass': { 'format': 'round1', 'unit': 'T' },
  'maxfuel': { 'format': 'round1', 'unit': 'T' },
  'optmass': { 'format': 'int', 'unit': 'T' },
  'optmul': { 'format': 'pct', 'change': 'additive' },
  'pgen': { 'format': 'round1', 'unit': 'MW' },
  'piercing': { 'format': 'int' },
  'power': { 'format': 'round', 'unit': 'MW' },
  'protection': { 'format': 'pct' },
  'range': { 'format': 'f2', 'unit': 'km', 'storedUnit': 'm' },
  'ranget': { 'format': 'f1', 'unit': 's' },
  'regen': { 'format': 'round1', 'unit': 'ps' },
  'reload': { 'format': 'int', 'unit': 's' },
  'rof': { 'format': 'round1', 'unit': 'ps', 'synthetic': 'getRoF', 'higherbetter': true },
  'angle': { 'format': 'round1', 'unit': 'ang' },
  'scanrate': { 'format': 'int' },
  'scantime': { 'format': 'round1', 'unit': 's' },
  'sdps': { 'format': 'round1', 'units': 'ps', 'synthetic': 'getSDps' },
  'shield': { 'format': 'int', 'unit': 'MJ' },
  'shieldaddition': { 'format': 'round1', 'unit': 'MJ' },
  'shieldboost': { 'format': 'pct1', 'change': 'additive' },
  'shieldreinforcement': { 'format': 'round1', 'unit': 'MJ' },
  'shotspeed': { 'format': 'int', 'unit': 'm/s' },
  'spinup': { 'format': 'round1', 'unit': 's' },
  'syscap': { 'format': 'round1', 'unit': 'MJ' },
  'sysrate': { 'format': 'round1', 'unit': 'MW' },
  'thermload': { 'format': 'round1' },
  'thermres': { 'format': 'pct' },
  'wepcap': { 'format': 'round1', 'unit': 'MJ' },
  'weprate': { 'format': 'round1', 'unit': 'MW' },
  'jumpboost': { 'format': 'round1', 'unit': 'LY' },
  'proberadius': { 'format': 'pct1', 'unit': 'pct' },
};
