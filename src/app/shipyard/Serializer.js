import { ModuleGroupToName, MountMap, BulkheadNames } from './Constants';
import { Ships, Modifications } from 'coriolis-data/dist';
import Module from './Module';
import Ship from './Ship';
import * as Calc from './Calculations';
import * as Utils from '../utils/UtilityFunctions';
import LZString from 'lz-string';
import { outfitURL } from '../utils/UrlGenerators';
import { SHIP_FD_NAME_TO_CORIOLIS_NAME } from '../utils/CompanionApiUtils';

/**
 * Generates ship-loadout JSON Schema standard object
 * @param  {Object} standard model
 * @return {Object} JSON Schema
 */
function standardToSchema(standard) {
  if (standard.m) {
    let o = {
      class: standard.m.class,
      rating: standard.m.rating,
      enabled: Boolean(standard.enabled),
      priority: standard.priority + 1
    };

    if (standard.m.name) {
      o.name = standard.m.name;
    }

    if (standard.m.mods && Object.keys(standard.m.mods).length > 0) {
      o.modifications = standard.m.mods;
    }

    if (standard.m.blueprint && Object.keys(standard.m.blueprint).length > 0) {
      o.blueprint = standard.m.blueprint;
    }

    return o;
  }
  return null;
}

/**
 * Generates ship-loadout JSON Schema bulkhead object
 * @param  {Object} bulkheads Bulkheads slot
 * @return {Object}           JSON Schema Bulkhead
 */
function bulkheadToSchema(bulkheads) {
  let o = {
    name: BulkheadNames[bulkheads.m.index]
  };

  if (bulkheads.m.mods && Object.keys(bulkheads.m.mods).length > 0) {
    o.modifications = bulkheads.m.mods;
  }

  if (bulkheads.m.blueprint && Object.keys(bulkheads.m.blueprint).length > 0) {
    o.blueprint = bulkheads.m.blueprint;
  }

  return o;
}

/**
 * Generates ship-loadout JSON Schema slot object
 * @param  {Object} slot Slot model
 * @return {Object}      JSON Schema Slot
 */
function slotToSchema(slot) {
  if (slot.m) {
    let o = {
      class: slot.m.class,
      rating: slot.m.rating,
      enabled: Boolean(slot.enabled),
      priority: slot.priority + 1,
      group: ModuleGroupToName[slot.m.grp]
    };

    if (slot.m.name) {
      o.name = slot.m.name;
    }
    if (slot.m.mount) {
      o.mount = MountMap[slot.m.mount];
    }
    if (slot.m.missile) {
      o.missile = slot.m.missile;
    }
    if (slot.m.mods && Object.keys(slot.m.mods).length > 0) {
      o.modifications = slot.m.mods;
    }
    if (slot.m.blueprint && Object.keys(slot.m.blueprint).length > 0) {
      o.blueprint = slot.m.blueprint;
    }

    return o;
  }
  return null;
}

/**
 * Generates an object conforming to the ship-loadout JSON schema from a Ship model
 * @param  {string} buildName The build name
 * @param  {Ship} ship        Ship instance
 * @return {Object}           ship-loadout object
 */
export function toDetailedBuild(buildName, ship) {
  let standard = ship.standard,
      hardpoints = ship.hardpoints,
      internal = ship.internal,
      code = ship.toString();

  let data = {
    $schema: 'https://coriolis.io/schemas/ship-loadout/4.json#',
    name: buildName,
    ship: ship.name,
    references: [{
      name: 'Coriolis.io',
      url: 'https://coriolis.io' + outfitURL(ship.id, code, buildName),
      code,
      shipId: ship.id
    }],
    components: {
      standard: {
        bulkheads: bulkheadToSchema(ship.bulkheads),
        cargoHatch: { enabled: Boolean(ship.cargoHatch.enabled), priority: ship.cargoHatch.priority + 1 },
        powerPlant: standardToSchema(standard[0]),
        thrusters: standardToSchema(standard[1]),
        frameShiftDrive: standardToSchema(standard[2]),
        lifeSupport: standardToSchema(standard[3]),
        powerDistributor: standardToSchema(standard[4]),
        sensors: standardToSchema(standard[5]),
        fuelTank: standardToSchema(standard[6])
      },
      hardpoints: hardpoints.filter(slot => slot.maxClass > 0).map(slotToSchema),
      utility: hardpoints.filter(slot => slot.maxClass === 0).map(slotToSchema),
      internal: internal.filter(slot => !(slot.m && slot.m.grp === 'pas')).map(slotToSchema)
    },
    stats: {}
  };

  for (let stat in ship) {
    if (!isNaN(ship[stat])) {
      data.stats[stat] = Math.round(ship[stat] * 100) / 100;
    }
  }

  // Override jump range stats with the same calculations the UI uses
  // (ShipSummaryTable.jsx computes these inline rather than using the
  // stored ship properties, so the stored values can differ)
  const fsd = ship.standard[2].m;
  if (fsd) {
    const fsdMaxFuel = fsd instanceof Module ? fsd.getMaxFuelPerJump() : fsd.maxfuel;
    data.stats.unladenRange = Math.round(Calc.jumpRange(ship.unladenMass, fsd, ship.fuelCapacity, ship) * 100) / 100;
    data.stats.fullTankRange = Math.round(Calc.jumpRange(ship.unladenMass, fsd, ship.fuelCapacity, ship) * 100) / 100;
    data.stats.ladenRange = Math.round(Calc.jumpRange(ship.unladenMass + ship.cargoCapacity, fsd, ship.fuelCapacity, ship) * 100) / 100;
    data.stats.maxRange = Math.round(Calc.jumpRange(ship.unladenMass - ship.fuelCapacity + fsdMaxFuel, fsd, fsdMaxFuel, ship) * 100) / 100;
    data.stats.unladenFastestRange = Math.round(Calc.totalJumpRange(ship.unladenMass, fsd, ship.fuelCapacity, ship) * 100) / 100;
    data.stats.ladenFastestRange = Math.round(Calc.totalJumpRange(ship.unladenMass + ship.cargoCapacity, fsd, ship.fuelCapacity, ship) * 100) / 100;
  }

  return data;
};

/**
 * Instantiates a ship from a ship-loadout  object
 * @param  {Object} detailedBuild ship-loadout object
 * @return {Ship} Ship instance
 */
export function fromDetailedBuild(detailedBuild) {
  let shipId = Object.keys(Ships).find((shipId) => Ships[shipId].properties.name.toLowerCase() == detailedBuild.ship.toLowerCase());
  if (!shipId) {
    throw 'No such ship: ' + detailedBuild.ship;
  }

  let shipData = Ships[shipId];
  let ship = new Ship(shipId, shipData.properties, shipData.slots);

  if (!detailedBuild.references[0] || !detailedBuild.references[0].code) {
    throw 'Missing reference code';
  }

  ship.buildFrom(detailedBuild.references[0].code);

  return ship;
}

/**
 * Generates an array of ship-loadout JSON Schema object for export
 * @param  {Array} builds   Array of ship builds
 * @return {Array}         Array of of ship-loadout objects
 */
export function toDetailedExport(builds) {
  let data = [];

  for (let shipId in builds) {
    for (let buildName in builds[shipId]) {
      let code = builds[shipId][buildName];
      let shipData = Ships[shipId];
      let ship = new Ship(shipId, shipData.properties, shipData.slots);
      ship.buildFrom(code);
      data.push(toDetailedBuild(buildName, ship, code));
    }
  }
  return data;
};

/**
 * Serializes a comparion and all of the ships to zipped
 * Base 64 encoded JSON.
 * @param  {string} name        Comparison name
 * @param  {array} builds       Array of ship builds
 * @param  {array} facets       Selected facets
 * @param  {string} predicate   sort predicate
 * @param  {boolean} desc       sort order
 * @return {string}             Zipped Base 64 encoded JSON
 */
export function fromComparison(name, builds, facets, predicate, desc) {
  return LZString.compressToBase64(JSON.stringify({
    n: name,
    b: builds.map((b) => { return { s: b.id, n: b.buildName, c: b.toString() }; }),
    f: facets,
    p: predicate,
    d: desc ? 1 : 0
  }));
};

/**
 * Parses the comarison data string back to an object.
 * @param  {string} code Zipped Base 64 encoded JSON comparison data
 * @return {Object} Comparison data object
 */
export function toComparison(code) {
  return JSON.parse(LZString.decompressFromBase64(Utils.fromUrlSafe(code)));
};

/**
 * Build a reverse mapping from Coriolis internal attribute names to FD label names.
 * Some internal names map to multiple FD labels (e.g. 'optmass' → FSDOptimalMass,
 * EngineOptimalMass, ShieldGenOptimalMass). We pick the first match since the
 * Modifiers array only needs one label per attribute.
 */
const _internalToFdLabel = {};
for (const [fdLabel, actions] of Object.entries(Modifications.modifierActions)) {
  // Skip special effects — they start with 'special_' or 'trade_'
  if (fdLabel.startsWith('special_') || fdLabel.startsWith('trade_')) continue;
  for (const internalName of Object.keys(actions)) {
    if (!_internalToFdLabel[internalName]) {
      _internalToFdLabel[internalName] = fdLabel;
    }
  }
}

/**
 * Build the Modifiers array for a module's engineering, using the actual
 * modified values that Coriolis has computed (matching what the UI shows).
 *
 * @param  {Object} m  The module (with .mods, base values, etc.)
 * @return {Array}     Array of {Label, Value, OriginalValue, LessIsGood} objects, or null
 */
function _buildModifiers(m) {
  if (!m || !m.mods || Object.keys(m.mods).length === 0) return null;

  const modifiers = [];
  for (const [attrName, modValue] of Object.entries(m.mods)) {
    const modification = Modifications.modifications[attrName];
    if (!modification) continue;
    // Skip hidden/object modifications (like damagedist)
    if (modification.hidden || modification.type === 'object') continue;

    const fdLabel = _internalToFdLabel[attrName];
    if (!fdLabel) continue;

    const baseValue = m[attrName];
    if (baseValue === undefined || baseValue === null) continue;

    // Get the modified value using the Module's getter if available
    let modifiedValue;
    if (m instanceof Module) {
      modifiedValue = m.get(attrName, true);
    } else {
      // Fallback: compute from the stored mod
      if (modification.type === 'percentage') {
        modifiedValue = baseValue * (1 + modValue / 10000);
      } else if (modification.type === 'numeric') {
        if (modification.method === 'additive') {
          modifiedValue = baseValue + modValue / 100;
        } else {
          modifiedValue = modValue / 100;
        }
      } else {
        modifiedValue = baseValue;
      }
    }

    if (modifiedValue === null || isNaN(modifiedValue)) continue;

    modifiers.push({
      Label: fdLabel.replace('OutfittingFieldType_', ''),
      Value: Math.round(modifiedValue * 1000000) / 1000000,
      OriginalValue: Math.round(baseValue * 1000000) / 1000000,
      LessIsGood: modification.higherbetter === false ? 1 : 0
    });
  }

  return modifiers.length > 0 ? modifiers : null;
}

/**
 * Build the Engineering object for a module's SLEF export, including
 * Modifiers (actual computed values) and PreEngineeredBlueprints for
 * modules with multiple pre-engineered blueprints.
 *
 * @param  {Object} m  The module
 * @return {Object|null} Engineering object or null if no engineering
 */
function _buildEngineering(m) {
  if (!m || !m.blueprint || Object.keys(m.blueprint).length === 0) return null;

  const eng = {
    BlueprintName: m.blueprint.fdname,
    Level: m.blueprint.grade,
    Quality: m.blueprint.quality || 1
  };

  if (m.blueprint.special && m.blueprint.special.id >= 0) {
    eng.ExperimentalEffect = m.blueprint.special.edname;
  }

  const modifiers = _buildModifiers(m);
  if (modifiers) {
    eng.Modifiers = modifiers;
  }

  return eng;
}

/**
 * Generates an object conforming to the SLEF (Ship Loadout Export Format) from a Ship model
 * SLEF spec: https://inara.cz/elite/inara-impexp-slef/
 * @param  {string} buildName The build name
 * @param  {Ship} ship        Ship instance
 * @return {Array}            SLEF format array with single loadout object
 */
export function toSLEF(buildName, ship) {
  const modules = [];

  // Create reverse mapping: Coriolis ship ID -> FD name
  const shipModelToFdName = {};
  for (const [fdName, coriolisName] of Object.entries(SHIP_FD_NAME_TO_CORIOLIS_NAME)) {
    shipModelToFdName[coriolisName] = fdName;
  }
  const shipFdName = shipModelToFdName[ship.id] || ship.id;

  // Add bulkheads/armour
  if (ship.bulkheads && ship.bulkheads.m) {
    // Prefer the symbol (fdname) from ship data if available.
    // Otherwise construct from index using the standard FD naming convention.
    let bulkheadItem;
    if (ship.bulkheads.m.symbol) {
      bulkheadItem = ship.bulkheads.m.symbol;
    } else {
      const gradeSuffixes = ['grade1', 'grade2', 'grade3', 'mirrored', 'reactive'];
      const suffix = gradeSuffixes[ship.bulkheads.m.index] || `grade${ship.bulkheads.m.index + 1}`;
      bulkheadItem = `${shipFdName.toLowerCase()}_armour_${suffix}`;
    }
    const module = {
      Slot: 'Armour',
      Item: bulkheadItem,
      On: true,
      Priority: ship.bulkheads.priority
    };

    const bhEng = _buildEngineering(ship.bulkheads.m);
    if (bhEng) {
      module.Engineering = bhEng;
    }

    modules.push(module);
  }

  // Add cargo hatch
  modules.push({
    Slot: 'CargoHatch',
    Item: 'modularcargobaydoor',
    On: Boolean(ship.cargoHatch.enabled),
    Priority: ship.cargoHatch.priority
  });

  // Add standard modules (capitalized slot names per SLEF spec)
  const standardSlots = ['PowerPlant', 'MainEngines', 'FrameShiftDrive', 'LifeSupport', 'PowerDistributor', 'Radar', 'FuelTank'];
  ship.standard.forEach((slot, index) => {
    if (slot.m && slot.m.symbol) {
      const module = {
        Slot: standardSlots[index],
        Item: slot.m.symbol,
        On: Boolean(slot.enabled),
        Priority: slot.priority
      };

      const eng = _buildEngineering(slot.m);
      if (eng) {
        module.Engineering = eng;
      }

      modules.push(module);
    }
  });

  // Add hardpoints (with proper size names and named slot prefixes)
  const hpClassCounters = {};
  const HP_SIZE_NAMES = {0: 'Tiny', 1: 'Small', 2: 'Medium', 3: 'Large', 4: 'Huge'};
  ship.hardpoints.forEach(slot => {
    const classNum = slot.maxClass;
    hpClassCounters[classNum] = (hpClassCounters[classNum] || 0) + 1;
    const slotNum = hpClassCounters[classNum];

    if (slot.m && slot.m.symbol) {
      const namePrefix = slot.name || '';
      const slotName = `${HP_SIZE_NAMES[classNum]}${namePrefix}Hardpoint${slotNum}`;

      const module = {
        Slot: slotName,
        Item: slot.m.symbol,
        On: Boolean(slot.enabled),
        Priority: slot.priority
      };

      const eng = _buildEngineering(slot.m);
      if (eng) {
        module.Engineering = eng;
      }

      modules.push(module);
    }
  });

  // Add internal compartments (with proper FD slot names)
  const NAMED_INTERNAL_PREFIXES = {
    'Military': 'Military',
    'Limpets': 'LimpetController',
    'Fighter': 'FighterBay',
    'Cargo': 'Cargo',
    'MkIIPassenger': 'Passenger'
  };
  let slotNum = 1;
  const namedSlotCounters = {};
  ship.internal.forEach(slot => {
    if (slot.m && slot.m.grp === 'pas') return; // Exclude Planetary Approach Suite for compatibility
    if (slot.name === 'PlanetaryApproachSuite') return;

    // Determine the FD-style slot name
    let fdSlotName;
    const namedPrefix = slot.name && NAMED_INTERNAL_PREFIXES[slot.name];
    if (namedPrefix) {
      namedSlotCounters[slot.name] = (namedSlotCounters[slot.name] || 0) + 1;
      fdSlotName = `${namedPrefix}${String(namedSlotCounters[slot.name]).padStart(2, '0')}`;
    } else {
      fdSlotName = `Slot${String(slotNum).padStart(2, '0')}_Size${slot.maxClass}`;
      slotNum++;
    }

    if (slot.m && slot.m.symbol) {
      const module = {
        Slot: fdSlotName,
        Item: slot.m.symbol,
        On: Boolean(slot.enabled),
        Priority: slot.priority
      };

      const eng = _buildEngineering(slot.m);
      if (eng) {
        module.Engineering = eng;
      }

      modules.push(module);
    }
  });

  return [{
    header: {
      appName: 'Coriolis',
      appVersion: '4.0',
      appURL: 'https://coriolis.io' + outfitURL(ship.id, ship.toString(), buildName)
    },
    data: {
      Ship: shipFdName,
      Modules: modules
    }
  }];
};
