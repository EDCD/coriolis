export const formats = {
  decimal: ',',
  thousands: '.',
  grouping: [3],
  currency: ['', ' €'],
  dateTime: '%A, der %e. %B %Y, %X',
  date: '%d.%m.%Y',
  time: '%H:%M:%S',
  periods: ['AM', 'PM'], // unused
  days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  shortMonths: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
};

export const terms = {
  // Phrases
  PHRASE_ALT_ALL: 'Alt + Click to fill all slots',
  PHRASE_BACKUP_DESC: 'Export aller Coriolis-Daten, um sie zu sichern oder um sie zu einem anderen Browser/Gerät zu übertragen.', // Backup of all Coriolis data to save or transfer to another browser/device
  PHRASE_CONFIRMATION: 'Sind Sie sicher?',  // Are You Sure?
  PHRASE_EXPORT_DESC: 'Ein detaillierter JSON-Export Ihrer Konfiguration für die Verwendung in anderen Websites und Tools', // A detailed JSON export of your build for use in other sites and tools
  PHRASE_FASTEST_RANGE: 'aufeinanderfolgende maximale Reichweite/Sprünge',  // Consecutive max range jumps
  PHRASE_IMPORT: 'JSON hier einfügen oder importieren', // Paste JSON or import here
  PHRASE_LADEN: 'Schiffsmasse + Treibstoff + Fracht', // Ship Mass + Fuel + Cargo
  PHRASE_NO_BUILDS: 'Keine Konfigurationen zum Vergleich ausgewählt!',  // No builds added to comparison!
  PHRASE_NO_RETROCH: 'Keine Umrüständerungen',  // No Retrofitting changes
  PHRASE_SELECT_BUILDS: 'Ausstattung zum Vergleich auswählen',  // Select Builds to Compare
  PHRASE_SG_RECHARGE: 'Zeit von 50% bis 100% der Ladung', // Time from 50% to 100% Charge
  PHRASE_SG_RECOVER: 'Erneuerung (zu 50%) nach Zusammenbruch',  // Recovery (to 50%) after collapse
  PHRASE_UNLADEN: 'Schiffsmasse ohne Treibstoff und Fracht',  // Ship Mass excluding Fuel and Cargo
  PHRASE_UPDATE_RDY: 'Update verfügbar! Klicken zum Aktualisieren', // Update Available! Click to Refresh
  PHRASE_ENGAGEMENT_RANGE: 'The distance between your ship and its target',
  PHRASE_SELECT_BLUEPRINT: 'Click to select a blueprint',
  PHRASE_BLUEPRINT_WORST: 'Worst primary values for this blueprint',
  PHRASE_BLUEPRINT_RANDOM: 'Random selection between worst and best primary values for this blueprint',
  PHRASE_BLUEPRINT_BEST: 'Best primary values for this blueprint',
  PHRASE_BLUEPRINT_EXTREME: 'Best beneficial and worst detrimental primary values for this blueprint',
  PHRASE_BLUEPRINT_RESET: 'Remove all modifications and blueprint',
  PHRASE_SELECT_SPECIAL: 'Click to select an experimental effect',
  PHRASE_NO_SPECIAL: 'No experimental effect',
  PHRASE_SHOPPING_LIST: 'Stations that sell this build',
  PHRASE_REFIT_SHOPPING_LIST: 'Stations that sell required modules',
  PHRASE_TOTAL_EFFECTIVE_SHIELD: 'Total amount of damage that can be taken from each damage type, if using all shield cells',
  PHRASE_TIME_TO_LOSE_SHIELDS: 'Shields will hold for',
  PHRASE_TIME_TO_RECOVER_SHIELDS: 'Shields will recover in',
  PHRASE_TIME_TO_RECHARGE_SHIELDS: 'Shields will recharge in',
  PHRASE_SHIELD_SOURCES: 'Breakdown of the supply of shield energy',
  PHRASE_EFFECTIVE_SHIELD: 'Effective shield strength against different damage types',
  PHRASE_ARMOUR_SOURCES: 'Breakdown of the supply of armour',
  PHRASE_EFFECTIVE_ARMOUR: 'Effective armour strength against different damage types',
  PHRASE_DAMAGE_TAKEN: '% of raw damage taken for different damage types',
  PHRASE_TIME_TO_LOSE_ARMOUR: 'Armour will hold for',
  PHRASE_MODULE_PROTECTION_EXTERNAL: 'Protection for hardpoints',
  PHRASE_MODULE_PROTECTION_INTERNAL: 'Protection for all other modules',
  PHRASE_SHIELD_DAMAGE: 'Breakdown of sources for sustained DPS against shields',
  PHRASE_ARMOUR_DAMAGE: 'Breakdown of sources for sustained DPS against armour',

  PHRASE_TIME_TO_REMOVE_SHIELDS: 'Will remove shields in',
  TT_TIME_TO_REMOVE_SHIELDS: 'With sustained fire by all weapons',
  PHRASE_TIME_TO_REMOVE_ARMOUR: 'Will remove armour in',
  TT_TIME_TO_REMOVE_ARMOUR: 'With sustained fire by all weapons',
  PHRASE_TIME_TO_DRAIN_WEP: 'Will drain WEP in',
  TT_TIME_TO_DRAIN_WEP: 'Time to  drain WEP capacitor with all weapons firing',
  TT_TIME_TO_LOSE_SHIELDS: 'Against sustained fire from all opponent\'s weapons',
  TT_TIME_TO_LOSE_ARMOUR: 'Against sustained fire from all opponent\'s weapons',
  TT_MODULE_ARMOUR: 'Armour protecting against module damage',
  TT_MODULE_PROTECTION_EXTERNAL: 'Percentage of damage diverted from hardpoints to module reinforcement packages',
  TT_MODULE_PROTECTION_INTERNAL: 'Percentage of damage diverted from non-hardpoint modules to module reinforcement packages',

  TT_EFFECTIVE_SDPS_SHIELDS: 'Actual sustained DPS whilst WEP capacitor is not empty',
  TT_EFFECTIVENESS_SHIELDS: 'Effectivness compared to hitting a 0-resistance target with 0 pips to SYS at 0m',
  TT_EFFECTIVE_SDPS_ARMOUR: 'Actual sustained DPS whilst WEP capacitor is not empty',
  TT_EFFECTIVENESS_ARMOUR: 'Effectivness compared to hitting a 0-resistance target at 0m',

  PHRASE_EFFECTIVE_SDPS_SHIELDS: 'SDPS against shields',
  PHRASE_EFFECTIVE_SDPS_ARMOUR: 'SDPS against armour',

  TT_SUMMARY_SPEED: 'With full fuel tank and 4 pips to ENG',
  TT_SUMMARY_SPEED_NONFUNCTIONAL: 'Thrusters powered off or over maximum mass',
  TT_SUMMARY_BOOST: 'With full fuel tank and 4 pips to ENG',
  TT_SUMMARY_BOOST_NONFUNCTIONAL: 'Power distributor not able to supply enough power to boost',
  TT_SUMMARY_SHIELDS: 'Raw shield strength, including boosters',
  TT_SUMMARY_SHIELDS_NONFUNCTIONAL: 'No shield generator or shield generator powered off',
  TT_SUMMARY_INTEGRITY: 'Ship integrity, including bulkheads and hull reinforcement packages',
  TT_SUMMARY_HULL_MASS: 'Mass of the hull prior to any modules being installed',
  TT_SUMMARY_UNLADEN_MASS: 'Mass of the hull and modules prior to any fuel or cargo',
  TT_SUMMARY_LADEN_MASS: 'Mass of the hull and modules with full fuel and cargo',
  TT_SUMMARY_DPS: 'Damage per second with all weapons firing',
  TT_SUMMARY_EPS: 'WEP capacitor consumed per second with all weapons firing',
  TT_SUMMARY_TTD: 'Time to drain WEP capacitor with all weapons firing and 4 pips to WEP',
  TT_SUMMARY_MAX_SINGLE_JUMP: 'Farthest possible jump range with no cargo and only enough fuel for the jump itself',
  TT_SUMMARY_UNLADEN_SINGLE_JUMP: 'Farthest possible jump range with no cargo and a full fuel tank',
  TT_SUMMARY_LADEN_SINGLE_JUMP: 'Farthest possible jump range with full cargo and a full fuel tank',
  TT_SUMMARY_UNLADEN_TOTAL_JUMP: 'Farthest possible range with no cargo, a full fuel tank, and jumping as far as possible each time',
  TT_SUMMARY_LADEN_TOTAL_JUMP: 'Farthest possible range with full cargo, a full fuel tank, and jumping as far as possible each time',

  HELP_MODIFICATIONS_MENU: 'Click on a number to enter a new value, or drag along the bar for small changes',

  // Other languages fallback to these  values
  // Only Translate to other languages if the name is different in-game
  am: 'Auto Field-Maintenance Unit',
  bh: 'Bulkheads',
  bl: 'Beam Laser',
  bsg: 'Bi-Weave Shield Generator',
  c: 'Cannon',
  cc: 'Collector Limpet Controller',
  ch: 'Chaff Launcher',
  cr: 'Cargo Rack',
  cs: 'Manifest Scanner',
  dc: 'Docking Computer',
  ec: 'Electronic Countermeasure',
  fc: 'Fragment Cannon',
  fh: 'Fighter Hangar',
  fi: 'FSD Interdictor',
  fs: 'Fuel Scoop',
  fsd: 'Frame Shift Drive',
  ft: 'Fuel Tank',
  fx: 'Fuel Transfer Limpet Controller',
  hb: 'Hatch Breaker Limpet Controller',
  hr: 'Hull Reinforcement Package',
  hs: 'Heat Sink Launcher',
  kw: 'Kill Warrant Scanner',
  ls: 'Life Support',
  mc: 'Multi-cannon',
  ml: 'Mining Laser',
  mr: 'Missile Rack',
  mrp: 'Module Reinforcement Package',
  nl: 'Mine Launcher',
  pa: 'Plasma Accelerator',
  pas: 'Planetary Approach Suite',
  pc: 'Prospector Limpet Controller',
  pce: 'Economy Class Passenger Cabin',
  pci: 'Business Class Passenger Cabin',
  pcm: 'First Class Passenger Cabin',
  pcq: 'Luxury Passenger Cabin',
  pd: 'power distributor',
  pl: 'Pulse Laser',
  po: 'Point Defence',
  pp: 'Power Plant',
  psg: 'Prismatic Shield Generator',
  pv: 'Planetary Vehicle Hangar',
  rf: 'Refinery',
  rg: 'Rail Gun',
  s: 'Sensors',
  sb: 'Shield Booster',
  sc: 'Stellar Scanners',
  scb: 'Shield Cell Bank',
  sg: 'Shield Generator',
  ss: 'Surface Scanners',
  t: 'thrusters',
  tp: 'Torpedo Pylon',
  ul: 'Burst Laser',
  ws: 'Frame Shift Wake Scanner',

  // Items on the outfitting page
  // Notification of restricted slot
  emptyrestricted: 'empty (restricted)',
  'damage dealt to': 'Damage dealt to',
  'damage received from': 'Damage received from',
  'against shields': 'Against shields',
  'against hull': 'Against hull',
  'total effective shield': 'Total effective shield',

  // 'ammo' was overloaded for outfitting page and modul info, so changed to ammunition for outfitting page
  ammunition: 'Ammo',

  // Unit for seconds
  secs: 's',

  rebuildsperbay: 'Rebuilds per bay',

  // Blueprint rolls
  worst: 'Worst',
  average: 'Average',
  random: 'Random',
  best: 'Best',
  extreme: 'Extreme',
  reset: 'Reset',

  // Weapon, offence, defence and movement
  dpe: 'Damage per MJ of energy',
  dps: 'Damage per second',
  sdps: 'Sustained damage per second',
  dpssdps: 'Damage per second (sustained damage per second)',
  eps: 'Energy per second',
  epsseps: 'Energy per second (sustained energy per second)',
  hps: 'Heat per second',
  hpsshps: 'Heat per second (sustained heat per second)',
  'damage by': 'Damage by',
  'damage from': 'Damage from',
  'shield cells': 'Shield cells',
  'recovery': 'Recovery',
  'recharge': 'Recharge',
  'engine pips': 'Engine Pips',
  '4b': '4 pips and boost',
  'speed': 'Speed',
  'pitch': 'Pitch',
  'roll': 'Roll',
  'yaw': 'Yaw',
  'internal protection': 'Internal protection',
  'external protection': 'External protection',
  'engagement range': 'Engagement range',
  'total': 'Total',

  // Modifications
  ammo: 'Ammunition maximum',
  boot: 'Boot time',
  brokenregen: 'Broken regeneration rate',
  burst: 'Burst',
  burstrof: 'Burst rate of fire',
  clip: 'Ammunition clip',
  damage: 'Damage',
  distdraw: 'Distributor draw',
  duration: 'Duration',
  eff: 'Efficiency',
  engcap: 'Engines capacity',
  engrate: 'Engines recharge rate',
  explres: 'Explosive resistance',
  facinglimit: 'Facing limit',
  hullboost: 'Hull boost',
  hullreinforcement: 'Hull reinforcement',
  integrity: 'Integrity',
  jitter: 'Jitter',
  kinres: 'Kinetic resistance',
  maxfuel: 'Maximum fuel per jump',
  mass: 'Mass',
  optmass: 'Optimal mass',
  optmul: 'Optimal multiplier',
  pgen: 'Power generation',
  piercing: 'Piercing',
  power: 'Power draw',
  protection: 'Protection',
  range: 'Range',
  ranget: 'Range', // Range in time (for FSD interdictor)
  regen: 'Regeneration rate',
  reload: 'Reload',
  rof: 'Rate of fire',
  angle: 'Scan angle',
  scanrate: 'Scan rate',
  scantime: 'Scan time',
  shield: 'Shield',
  shieldboost: 'Shield boost',
  shieldreinforcement: 'Shield reinforcement',
  shotspeed: 'Shot speed',
  spinup: 'Spin up time',
  syscap: 'Systems capacity',
  sysrate: 'Systems recharge rate',
  thermload: 'Thermal load',
  thermres: 'Thermal resistance',
  wepcap: 'Weapons capacity',
  weprate: 'Weapons recharge rate',

  // Shield generators use a different terminology
  minmass_sg: 'Minimum hull mass',
  optmass_sg: 'Optimal hull mass',
  maxmass_sg: 'Maximum hull mass',
  minmul_sg: 'Minimum strength',
  optmul_sg: 'Optimal strength',
  maxmul_sg: 'Minimum strength',
  minmass_psg: 'Minimum hull mass',
  optmass_psg: 'Optimal hull mass',
  maxmass_psg: 'Maximum hull mass',
  minmul_psg: 'Minimum strength',
  optmul_psg: 'Optimal strength',
  maxmul_psg: 'Minimum strength',
  minmass_bsg: 'Minimum hull mass',
  optmass_bsg: 'Optimal hull mass',
  maxmass_bsg: 'Maximum hull mass',
  minmul_bsg: 'Minimum strength',
  optmul_bsg: 'Optimal strength',
  maxmul_bsg: 'Minimum strength',

  range_s: 'Typical emission range',

  // Damage types
  absolute: 'Absolute',
  explosive: 'Explosive',
  kinetic: 'Kinetic',
  thermal: 'Thermal',

  // Shield sources
  generator: 'Generator',
  boosters: 'Boosters',
  cells: 'Cells',

  // Armour sources
  bulkheads: 'Bulkheads',
  reinforcement: 'Reinforcement',

  // Help text
  HELP_TEXT: `
<h1>Introduction</h1>
Coriolis is a ship builder for Elite: Dangerous.  This help file provides you with the information you need to use Coriolis.

<h1>Importing Your Ship Into Coriolis</h1>
Often, you will want to start with your existing ship in Coriolis and see how particular changes might affect it, for example upgrading your FSD.  There are a number of tools that can be used to import your ship without you having to create it manually.  This has the added benefit of copying over any engineering modifications that have taken place as well. </p>

<h2>Importing Your Ship From EDDI</h2>
To import your ship from EDDI first ensure that your connection to the Frontier servers&apos; companion API is working.  To do this check the &apos;Companion App&apos; tab where you should see "Your connection to the companion app is operational".  If not then follow the instructions in the companion app tab in EDDI to connect to the Frontier servers.</p>

Once you have a working companion API connection go to the &apos;Shipyard&apos; tab.  At the right-hand side of each ship is an &apos;Export to Coriolis&apos; button that will open your default web browser in Coriolis with the ship&apos;s build. </p>

Note that Internet Explorer and Edge might not import correctly, due to their internal restrictions on URL length.  If you find that this is the case then please change your default browser to Chrome. </p>

Also, the imported information does not provide any data on the power priority or enabled status of your cargo hatch.  Coriolis sets this item to have a power priority of "5" and to be disabled by default.  You can change this after import in the Power Management section. </p>

<h2>Importing Your Ship From EDMC</h2>
To import your ship from EDMC once your connection to the Frontier servers&apos; companion API is working go to &apos;Settings -&gt;Configuration&apos; and set the &apos;Preferred Shipyard&apos; to &apos;Coriolis&apos;.  Once this is set up clicking on your ship in the main window will open your default web browser in Coriolis with the ship&apos;s build.</p>

Note that Internet Explorer and Edge might not import correctly, due to their internal restrictions on URL length.  If you find that this is the case then please change your default browser to Chrome. </p>

<h1>Understanding And Using The Outfitting Panels</h1>
The outfitting page is where you will spend most of your time, and contains the information for your ship.  Information on each of the panels is provided below. </p>

<h2>Key Values</h2>
Along the top of the screen are some of the key values for your build.  This is a handy reference for the values, but more information is provided for the values in the further panels. </p>

Here, along with most places in Coriolis, acronyms will have tooltips explaining what they mean.  Hover over the acronym to obtain more detail, or look in the glossary at the end of this help.</p>

All values are the highest possible, assuming that you an optimal setup for that particular value (maximum pips in ENG for speed, minimum fuel for jump range, etc.).  This means that these values will not be affected by changes to pip settings.  Details of the specific setup for each value are listed in the associated tootip.</p>

<h2>Modules</h2>
The next set of panels laid out horizontally across the screen contain the modules you have put in your build.  From left to right these are the core modules, the internal modules, the hardpoints and the utility mounts.  These represent the available slots in your ship and cannot be altered.  Each slot has a class, or size, and in general any module up to a given size can fit in a given slot (exceptions being bulkheads, life support and sensors in core modules and restricted internal slots, which can only take a subset of module depending on their restrictions). </p>

To add a module to a slot left-click on the slot and select the required module.  Only the modules capable of fitting in the selected slot will be shown. </p>

To remove a module from a slot right-click on the module. </p>

To move a module from one slot to another drag it.  If you instead want to copy the module drag it whilst holding down the &apos;Alt&apos; key. </p>

Clicking on the headings for each set of modules gives you the ability to either select an overall role for your ship (when clicking the core internal header) or a specific module with which you want to fill all applicable slots (when clicking the other headers). </p>

<h2>Ship Controls</h2>
The ship controls allow you to set your pips, boost, and amount of fuel and cargo that your build carries.  The changes made here will effect the information supplied in the subsequent panels, giving you a clearer view of what effect different changing these items will have. </p>

Ship control settings are saved as part of a build. </p>

<h2>Opponent</h2>
The opponet selection allows you to choose your opponent.  The opponent can be either a stock build of a ship or one of your own saved builds.  You can also set the engagement range between you and your opponent.  Your selection here will effect the information supplied in the subsequent panels, specifically the Offence and Defence panels. </p>

Opponent settings are saved as part of a build. </p>

<h2>Power and Costs Sub-panels</h2>
<h3>Power</h3>
The power management panel provides information about power usage and priorities.  It allows you to enable and disable individual modules, as well as set power priorities for each module.  Disabled modules will not be included in the build&apos;s statistics, with the exception of Shield Cell Banks as they are usually disabled when not in use and only enabled when required. </p>

<h3>Costs</h3>
The costs panel provides information about the costs for each of your modules, and the total cost and insurance for your build.  By default Coriolis uses the standard costs, however discounts for your ship, modules and insurance can be altered in the &apos;Settings&apos; at the top-right of the page.</p>

The retrofit costs provides information about the costs of changing the base build for your ship, or your saved build, to the current build.</p>

The reload costs provides information about the costs of reloading your current build.</p>

<h2>Profiles</h2>
Profiles provide graphs that show the general performance of modules in your build

<h3>Engine Profile</h3>
The engine profile panel provides information about the capabilities of your current thrusters.  The graph shows you how the maximum speed alters with the overall mass of your build. The vertical dashed line on the graph shows your current mass.  Your engine profile can be altered by obtaining different thrusters or engineering your existing thrusters, and you can increase your maximum speed by adding pips to the ENG capacitor as well as reducing the amount of fuel and cargo you are carrying as well as reducing the overall weight of the build.  You can also temporarily increase your speed by hitting the boost button. </p>

<h3>FSD Profile</h3>
The FSD profile panel provides information about the capabilities of your current frame shift drive.  The graph shows you how the maximum jump range alters with the overall mass of your build.  The vertical dashed line on the graph shows your current maximum single jump range. Your FSD profile can be altered by obtaining a different FSD or engineering your existing FSD, and you can increase your maximum jump range by reducing the amount of fuel and cargo you are carrying as well as reducing the overall weight of the build, </p>

<h3>Movement Profile</h3>
The movement profile panel provides information about the capabilities of your current thrusters with your current overall mass and ENG pips settings.  The diagram shows your ability to move and rotate in the different axes:

<dl>
<dt>Speed</dt><dd>The fastest the ship can move, in metres per second</dd>
<dt>Pitch</dt><dd>The fastest the ship can raise or lower its nose, in degrees per second</dd>
<dt>Roll</dt><dd>The fastest the ship can roll its body, in degrees per second</dd>
<dt>Yaw</dt><dd>The fastest the ship can turn its nose left or right, in degrees per second</dd>
</dl>

Your movement profile can be altered by obtaining different thrusters or engineering your existing thrusters, and you can increase your movement values by adding pips to the ENG capacitor as well as reducing the amount of fuel and cargo you are carrying as well as reducing the overall weight of the build.  You can also temporarily increase your movement profile by hitting the boost button. </p>

<h3>Damage Profile</h3>
The damage profile provides two graphs showing how the the build&apos;s damage to the opponent&apos;s shields and hull change with engagement range. The vertical dashed line on the graph shows your current engagement range.  This combines information about the build&apos;s weapons with the opponent&apos;s shields and hull to provide an accurate picture of sustained damage that can be inflicted on the opponent. </p>

<h2>Offence</h2>
<h3>Summary</h3>
The offence summary provides per-weapon information about sustained damage per second inflicted to shields and hull, along with a measure of effectiveness of that weapon.  The effectiveness value has a tooltip that provides a breakdown of the effectiveness, and can include reductions or increases due to range, resistance, and either power distributor (for shields) or hardness (for hull).  The final effectiveness value is calculated by multiplying these percentages together. </p>

<h3>Offence Metrics</h3>
The offence metrics panel provides information about your offence. </p>

Time to drain is a measure of how quickly your WEP capacitor will drain when firing all weapons.  It is affected by the number of pips you have in your WEP capacitor, with more pips resulting in a higher WEP recharge rate and hence a longer time to drain. </p>

The next value is the time it will take you to remove your opponent&apos;s shields.  This assumes that you have 100% time on target and that your engagement range stays constant.  Note that if your time to remove shields is longer than your time to drain this assumes that you continue firing throughout, inflicting lower damage due to the reduced energy in your WEP capacitor. </p>

The next value is the time it will take you to remove your opponent&apos;s armour.  This follows the same logic as the time to remove shields. </p>

<h3>Shield Damage Sources</h3>
The shield damage sources provides information about the sources of damage to your opponent by damage type.  For each applicable type of damage (absolute explosive, kinetic, thermal) a sustained damage per second value is provided. </p>

<h3>Hull Damage Sources</h3>
The hull damage sources provides information about the sources of damage to your opponent by damage type.  For each applicable type of damage (absolute explosive, kinetic, thermal) a sustained damage per second value is provided. </p>

<h2>Defence</h2>
<h3>Shield Metrics</h3>
The shield metrics provides information about your shield defence. </p>

Raw shield strength is the sum of the shield from your generator, boosters and shield cell banks. A tooltip provides a breakdown of these values. </p>

The time the shields will hold for is the time it will take your opponent&apos; to remove your shields.  This assumes that they have 100% time on target and that the engagement range stays constant. It also assumes that you fire all of your shield cell banks prior to your shields being lost. </p>

The time the shields will recover in is the time it will take your shields to go from collapsed (0%) to recovered (50%). This is affected by the number of pips you have in your SYS capacitor.  </p>

The time the shields will recharge in is the time it will take your shields to go from recovered (50%) to full (100%). This is affected by the number of pips you have in your SYS capacitor.  </p>

</h3>Shield Sources</h3>
This chart provides information about the sources of your shields.  For each applicable source of shields (generator, boosters, shield cell banks) a value is provided. </p>

</h3>Damage Taken</h3>
This graph shows how the initial damage from the weapons of each type are reduced before their damage is applied to the shields.  For each type of damage (absolute, explosive, kinetic, thermal) a percentage of the initial damage is provided.  A tooltip provides a breakdown of these values. </p>

</h3>Effective Shield</h3>
This graph shows the effective shield for each damage type, found by dividing the raw shield value by the damage taken for that type. </p>

<h3>Amour Metrics</h3>
The armour metrics provides information about your armour defence. </p>

Raw armour strength is the sum of the armour from your bulkheads and hull reinforcement packages. A tooltip provides a breakdown of these values. </p>

The time the armour will hold for is the time it will take your opponent&apos; to take your armour to 0.  This assumes that they have 100% time on target, the engagement range stays constant, and that all damage is dealt to the armour rather than modules. </p>

Raw module armour is the sum of the protection from your module reinforcement packages. </p>

Protection for hardpoints is the amount of protection that your module reinforcement packages provide to hardpoints.  This percentage of damage to the hardpoints will be diverted to the module reinforcement packages. </p>

Protection for all other modules is the amount of protection that your module reinforcement packages provide to everything other than hardpoints.  This percentage of damage to the modules will be diverted to the module reinforcement packages. </p>

</h3>Armour Sources</h3>
This chart provides information about the sources of your armour.  For each applicable source of shields (bulkheads, hull reinforcement packages) a value is provided. </p>

</h3>Damage Taken</h3>
This graph shows how the initial damage from the weapons of each type are reduced before their damage is applied to the armour.  For each type of damage (absolute, explosive, kinetic, thermal) a percentage of the initial damage is provided.  A tooltip provides a breakdown of these values. </p>

</h3>Effective Armour</h3>
This graph shows the effective armour for each damage type, found by dividing the raw armour value by the damage taken for that type. </p>

<h1>Keyboard Shortcuts</h1>
<dl>
<dt>Ctrl-b</dt><dd>toggle boost</dd>
<dt>Ctrl-e</dt><dd>open export dialogue (outfitting page only)</dd>
<dt>Ctrl-h</dt><dd>open help dialogue</dd>
<dt>Ctrl-i</dt><dd>open import dialogue</dd>
<dt>Ctrl-o</dt><dd>open shortlink dialogue</dd>
<dt>Ctrl-left-arrow</dt><dd>increase SYS capacitor</dd>
<dt>Ctrl-up-arrow</dt><dd>increase ENG capacitor</dd>
<dt>Ctrl-right-arrow</dt><dd>increase WEP capacitor</dd>
<dt>Ctrl-down-arrow</dt><dd>reset power distributor</dd>
<dt>Esc</dt><dd>close any open dialogue</dd>
</dl>
<h1>Glossary</h1>
<dl>
<dt>Absolute damage</dt><dd>A type of damage, without any protection.  Absolute damage is always dealt at 100% regardless of if the damage is to shields, hull or modules, and irrespective of resistances</dd>
<dt>DPS</dt><dd>Damage per second; the amount of damage that a weapon or a ship can deal per second to a target under optimum conditions</dd>
<dt>EPS</dt><dd>Energy per second; the amount of energy that a weapon or a ship drains from the weapons capacitor per second when firing</dd>
<dt>HPS</dt><dd>Heat per second; the amount of heat that a weapon or a ship generates per second when firing</dd>
<dt>Effectivness</dt><dd>A comparison of the maximum DPS of a given weapon to the actual DPS of the given weapon in a specific situation.  DPS can be reduced by range to the target, the target&apos;s hull and shield resistances, and the target&apos;s hardness</dd>
<dt>Explosive damage</dt><dd>A type of damage, protected against by explosive resistance</dd>
<dt>Hardness</dt><dd>The inherent resistance to damage of a ship&apos;s hull.  Hardness is defined on a per-ship basis and there is currently nothing that can be done to change it.  Hardness of a ship&apos;s hull is compared to the piercing of weapons: if piercing is higher than hardness the weapon does 100% damage, otherwise it does a fraction of its damage calculated as piercing/hardness</dd>
<dt>Falloff</dt><dd>The distance at which a weapons starts to do less damage than its stated DPS</dd>
<dt>Kinetic damage</dt><dd>A type of damage, protected against by kinetic resistance</dd>
<dt>SDPS</dt><dd>Sustained damage per second; the amount of damage that a weapon or a ship can deal per second to a target, taking in to account ammunition reload</dd>
<dt>SEPS</dt><dd>Sustained energy per second; the amount of energy that a weapon or a ship drains from the weapons capacitor per second when firing, taking in to account ammunition reload</dd>
<dt>SHPS</dt><dd>Sustained heat per second; the amount of heat that a weapon or a ship generates per second when firing, taking in to account ammunition reload</dd>
<dt>Thermal damage</dt><dd>A type of damage, protected against by thermal resistance</dd>
</dl>

  `,
};
