import { ModuleGroupToName, MountMap, BulkheadNames } from './Constants';
import { Ships } from 'coriolis-data/dist';
import Ship from './Ship';
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
        bulkheads: BulkheadNames[ship.bulkheads.m.index],
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
      internal: internal.map(slotToSchema)
    },
    stats: {}
  };

  for (let stat in ship) {
    if (!isNaN(ship[stat])) {
      data.stats[stat] = Math.round(ship[stat] * 100) / 100;
    }
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
    const module = {
      Slot: 'Armour',
      Item: ship.bulkheads.m.symbol || `${shipFdName.toLowerCase()}_armour_grade${ship.bulkheads.m.index + 1}`,
      On: true,
      Priority: ship.bulkheads.priority
    };

    if (ship.bulkheads.m.blueprint && Object.keys(ship.bulkheads.m.blueprint).length > 0) {
      module.Engineering = {
        BlueprintName: ship.bulkheads.m.blueprint.fdname,
        Level: ship.bulkheads.m.blueprint.grade,
        Quality: ship.bulkheads.m.blueprint.quality || 1
      };
      if (ship.bulkheads.m.blueprint.special && ship.bulkheads.m.blueprint.special.id >= 0) {
        module.Engineering.ExperimentalEffect = ship.bulkheads.m.blueprint.special.edname;
      }
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

      if (slot.m.blueprint && Object.keys(slot.m.blueprint).length > 0) {
        module.Engineering = {
          BlueprintName: slot.m.blueprint.fdname,
          Level: slot.m.blueprint.grade,
          Quality: slot.m.blueprint.quality || 1
        };
        if (slot.m.blueprint.special && slot.m.blueprint.special.id >= 0) {
          module.Engineering.ExperimentalEffect = slot.m.blueprint.special.edname;
        }
      }

      modules.push(module);
    }
  });

  // Add hardpoints (capitalized with proper size names)
  let hugeHP = 1, largeHP = 1, mediumHP = 1, smallHP = 1, tinyHP = 1;
  ship.hardpoints.forEach(slot => {
    if (slot.m && slot.m.symbol) {
      let slotName;
      if (slot.maxClass === 0) {
        slotName = `TinyHardpoint${tinyHP++}`;
      } else if (slot.maxClass === 1) {
        slotName = `SmallHardpoint${smallHP++}`;
      } else if (slot.maxClass === 2) {
        slotName = `MediumHardpoint${mediumHP++}`;
      } else if (slot.maxClass === 3) {
        slotName = `LargeHardpoint${largeHP++}`;
      } else {
        slotName = `HugeHardpoint${hugeHP++}`;
      }

      const module = {
        Slot: slotName,
        Item: slot.m.symbol,
        On: Boolean(slot.enabled),
        Priority: slot.priority
      };

      if (slot.m.blueprint && Object.keys(slot.m.blueprint).length > 0) {
        module.Engineering = {
          BlueprintName: slot.m.blueprint.fdname,
          Level: slot.m.blueprint.grade,
          Quality: slot.m.blueprint.quality || 1
        };
        if (slot.m.blueprint.special && slot.m.blueprint.special.id >= 0) {
          module.Engineering.ExperimentalEffect = slot.m.blueprint.special.edname;
        }
      }

      modules.push(module);
    }
  });

  // Add internal compartments (capitalized slot names)
  let slotNum = 1;
  ship.internal.forEach(slot => {
    if (slot.m && slot.m.symbol) {
      const module = {
        Slot: `Slot${String(slotNum).padStart(2, '0')}_Size${slot.maxClass}`,
        Item: slot.m.symbol,
        On: Boolean(slot.enabled),
        Priority: slot.priority
      };

      if (slot.m.blueprint && Object.keys(slot.m.blueprint).length > 0) {
        module.Engineering = {
          BlueprintName: slot.m.blueprint.fdname,
          Level: slot.m.blueprint.grade,
          Quality: slot.m.blueprint.quality || 1
        };
        if (slot.m.blueprint.special && slot.m.blueprint.special.id >= 0) {
          module.Engineering.ExperimentalEffect = slot.m.blueprint.special.edname;
        }
      }

      modules.push(module);
      slotNum++;
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
