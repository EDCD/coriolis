import React from 'react';
import { Modifications, Modules, Ships } from 'coriolis-data/dist';
import Module from '../shipyard/Module';
import Ship from '../shipyard/Ship';
import { getBlueprint } from '../utils/BlueprintFunctions';
import * as ModuleUtils from '../shipyard/ModuleUtils';

// mapping from fd's ship model names to coriolis'
const SHIP_FD_NAME_TO_CORIOLIS_NAME = {
  'Adder': 'adder',
  'Anaconda': 'anaconda',
  'Asp': 'asp',
  'Asp_Scout': 'asp_scout',
  'BelugaLiner': 'beluga',
  'CobraMkIII': 'cobra_mk_iii',
  'CobraMkIV': 'cobra_mk_iv',
  'Cutter': 'imperial_cutter',
  'DiamondBackXL': 'diamondback_explorer',
  'DiamondBack': 'diamondback',
  'Dolphin': 'dolphin',
  'Eagle': 'eagle',
  'Empire_Courier': 'imperial_courier',
  'Empire_Eagle': 'imperial_eagle',
  'Empire_Trader': 'imperial_clipper',
  'Federation_Corvette': 'federal_corvette',
  'Federation_Dropship': 'federal_dropship',
  'Federation_Dropship_MkII': 'federal_assault_ship',
  'Federation_Gunship': 'federal_gunship',
  'FerDeLance': 'fer_de_lance',
  'Hauler': 'hauler',
  'Independant_Trader': 'keelback',
  'Orca': 'orca',
  'Python': 'python',
  'SideWinder': 'sidewinder',
  'Type6': 'type_6_transporter',
  'Type7': 'type_7_transport',
  'Type9': 'type_9_heavy',
  'Type9_Military': 'type_10_defender',
  'TypeX': 'alliance_chieftain',
  'Viper': 'viper',
  'Viper_MkIV': 'viper_mk_iv',
  'Vulture': 'vulture'
};

// Mapping from hardpoint class to name in companion API
export const HARDPOINT_NUM_TO_CLASS = {
  0: 'Tiny',
  1: 'Small',
  2: 'Medium',
  3: 'Large',
  4: 'Huge'
};


/**
 * Obtain a module given its ED ID
 * @param {Integer} edId the Elite ID of the module
 * @return {Module} the module
 */
function _moduleFromEdId(edId) {
  if (!edId) return null;

  // Check standard modules
  for (const grp in Modules.standard) {
    if (Modules.standard.hasOwnProperty(grp)) {
      for (const i in Modules.standard[grp]) {
        if (Modules.standard[grp][i].edID === edId) {
          // Found it
          return new Module({ template: Modules.standard[grp][i] });
        }
      }
    }
  }

  // Check hardpoint modules
  for (const grp in Modules.hardpoints) {
    if (Modules.hardpoints.hasOwnProperty(grp)) {
      for (const i in Modules.hardpoints[grp]) {
        if (Modules.hardpoints[grp][i].edID === edId) {
          // Found it
          return new Module({ template: Modules.hardpoints[grp][i] });
        }
      }
    }
  }

  // Check internal modules
  for (const grp in Modules.internal) {
    if (Modules.internal.hasOwnProperty(grp)) {
      for (const i in Modules.internal[grp]) {
        if (Modules.internal[grp][i].edID === edId) {
          // Found it
          return new Module({ template: Modules.internal[grp][i] });
        }
      }
    }
  }

  // Not found
  return null;
}

/**
 * Obtain the model of a ship given its ED name
 * @param {string} edName the Elite name of the ship
 * @return {string} the Coriolis model of the ship
 */
function _shipModelFromEDName(edName) {
  return SHIP_FD_NAME_TO_CORIOLIS_NAME[edName];
}

/**
 * Obtain a ship's model from the companion API JSON
 * @param {object} json the companion API JSON
 * @return {string} the Coriolis model of the ship
 */
export function shipModelFromJson(json) {
  return _shipModelFromEDName(json.name || json.Ship);
}

/**
 * Build a ship from the companion API JSON
 * @param {object} json the companion API JSON
 * @return {Ship} the built ship
 */
export function shipFromJson(json) {
  // Start off building a basic ship
  const shipModel = shipModelFromJson(json);
  if (!shipModel) {
    throw 'No such ship found: "' + json.name + '"';
  }
  const shipTemplate = Ships[shipModel];

  let ship = new Ship(shipModel, shipTemplate.properties, shipTemplate.slots);
  ship.buildWith(null);

  // Set the cargo hatch
  if (json.modules.CargoHatch) {
    ship.cargoHatch.enabled = json.modules.CargoHatch.module.on == true;
    ship.cargoHatch.priority = json.modules.CargoHatch.module.priority;
  } else {
    // We don't have any information on it so guess it's priority 5 and disabled
    ship.cargoHatch.enabled = false;
    ship.cargoHatch.priority = 4;
  }

  let rootModule;

  // Add the bulkheads
  const armourJson = json.modules.Armour.module;
  if (armourJson.name.endsWith('_Armour_Grade1')) {
    ship.useBulkhead(0, true);
  } else if (armourJson.name.endsWith('_Armour_Grade2')) {
    ship.useBulkhead(1, true);
  } else if (armourJson.name.endsWith('_Armour_Grade3')) {
    ship.useBulkhead(2, true);
  } else if (armourJson.name.endsWith('_Armour_Mirrored')) {
    ship.useBulkhead(3, true);
  } else if (armourJson.name.endsWith('_Armour_Reactive')) {
    ship.useBulkhead(4, true);
  } else {
    throw 'Unknown bulkheads "' + armourJson.name + '"';
  }
  ship.bulkheads.enabled = true;
  rootModule = json.modules.Armour;
  if (rootModule.WorkInProgress_modifications) _addModifications(ship.bulkheads.m, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);

  // Add the standard modules
  // Power plant
  const powerplantJson = json.modules.PowerPlant.module;
  const powerplant = _moduleFromEdId(powerplantJson.id);
  rootModule = json.modules.PowerPlant;
  if (rootModule.WorkInProgress_modifications) _addModifications(powerplant, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
  ship.use(ship.standard[0], powerplant, true);
  ship.standard[0].enabled = powerplantJson.on === true;
  ship.standard[0].priority = powerplantJson.priority;

  // Thrusters
  const thrustersJson = json.modules.MainEngines.module;
  const thrusters = _moduleFromEdId(thrustersJson.id);
  rootModule = json.modules.MainEngines;
  if (rootModule.WorkInProgress_modifications) _addModifications(thrusters, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
  ship.use(ship.standard[1], thrusters, true);
  ship.standard[1].enabled = thrustersJson.on === true;
  ship.standard[1].priority = thrustersJson.priority;

  // FSD
  const frameshiftdriveJson = json.modules.FrameShiftDrive.module;
  const frameshiftdrive = _moduleFromEdId(frameshiftdriveJson.id);
  rootModule = json.modules.FrameShiftDrive;
  if (rootModule.WorkInProgress_modifications) _addModifications(frameshiftdrive, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
  ship.use(ship.standard[2], frameshiftdrive, true);
  ship.standard[2].enabled = frameshiftdriveJson.on === true;
  ship.standard[2].priority = frameshiftdriveJson.priority;

  // Life support
  const lifesupportJson = json.modules.LifeSupport.module;
  const lifesupport = _moduleFromEdId(lifesupportJson.id);
  rootModule = json.modules.LifeSupport;
  if (rootModule.WorkInProgress_modifications) _addModifications(lifesupport, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
  ship.use(ship.standard[3], lifesupport, true);
  ship.standard[3].enabled = lifesupportJson.on === true;
  ship.standard[3].priority = lifesupportJson.priority;

  // Power distributor
  const powerdistributorJson = json.modules.PowerDistributor.module;
  const powerdistributor = _moduleFromEdId(powerdistributorJson.id);
  rootModule = json.modules.PowerDistributor;
  if (rootModule.WorkInProgress_modifications) _addModifications(powerdistributor, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
  ship.use(ship.standard[4], powerdistributor, true);
  ship.standard[4].enabled = powerdistributorJson.on === true;
  ship.standard[4].priority = powerdistributorJson.priority;

  // Sensors
  const sensorsJson = json.modules.Radar.module;
  const sensors = _moduleFromEdId(sensorsJson.id);
  rootModule = json.modules.Radar;
  if (rootModule.WorkInProgress_modifications) _addModifications(sensors, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
  ship.use(ship.standard[5], sensors, true);
  ship.standard[5].enabled = sensorsJson.on === true;
  ship.standard[5].priority = sensorsJson.priority;

  // Fuel tank
  const fueltankJson = json.modules.FuelTank.module;
  const fueltank = _moduleFromEdId(fueltankJson.id);
  ship.use(ship.standard[6], fueltank, true);
  ship.standard[6].enabled = true;
  ship.standard[6].priority = 0;

  // Add hardpoints
  let hardpointClassNum = -1;
  let hardpointSlotNum = -1;
  let hardpointArrayNum = 0;
  for (let i in shipTemplate.slots.hardpoints) {
    if (shipTemplate.slots.hardpoints[i] === hardpointClassNum) {
      // Another slot of the same class
      hardpointSlotNum++;
    } else {
      // The first slot of a new class
      hardpointClassNum = shipTemplate.slots.hardpoints[i];
      hardpointSlotNum = 1;
    }

    // Now that we know what we're looking for, find it
    const hardpointName = HARDPOINT_NUM_TO_CLASS[hardpointClassNum] + 'Hardpoint' + hardpointSlotNum;
    const hardpointSlot = json.modules[hardpointName];
    if (!hardpointSlot) {
      // This can happen with old imports that don't contain new hardpoints
    } else if (!hardpointSlot.module) {
      // No module
    } else {
      const hardpointJson = hardpointSlot.module;
      const hardpoint = _moduleFromEdId(hardpointJson.id);
      rootModule = hardpointSlot;
      if (rootModule.WorkInProgress_modifications) _addModifications(hardpoint, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel, rootModule.specialModifications);
      ship.use(ship.hardpoints[hardpointArrayNum], hardpoint, true);
      ship.hardpoints[hardpointArrayNum].enabled = hardpointJson.on === true;
      ship.hardpoints[hardpointArrayNum].priority = hardpointJson.priority;
    }
    hardpointArrayNum++;
  }

  // Add internal compartments
  let internalSlotNum = 1;
  let militarySlotNum = 1;
  for (let i in shipTemplate.slots.internal) {
    const isMilitary = isNaN(shipTemplate.slots.internal[i]) ? shipTemplate.slots.internal[i].name == 'Military' : false;

    // The internal slot might be a standard or a military slot.  Military slots have a different naming system
    let internalSlot = null;
    if (isMilitary) {
      const internalName = 'Military0' + militarySlotNum;
      internalSlot = json.modules[internalName];
      militarySlotNum++;
    } else {
      // Slot numbers are not contiguous so handle skips.
      while (internalSlot === null && internalSlotNum < 99) {
        // Slot sizes have no relationship to the actual size, either, so check all possibilities
        for (let slotsize = 0; slotsize < 9; slotsize++) {
          const internalName = 'Slot' + (internalSlotNum <= 9 ? '0' : '') + internalSlotNum + '_Size' + slotsize;
          if (json.modules[internalName]) {
            internalSlot = json.modules[internalName];
            break;
          }
        }
        internalSlotNum++;
      }
    }

    if (!internalSlot) {
      // This can happen with old imports that don't contain new slots
    } else if (!internalSlot.module) {
      // No module
    } else {
      const internalJson = internalSlot.module;
      const internal = _moduleFromEdId(internalJson.id);
      rootModule = internalSlot;
      if (rootModule.WorkInProgress_modifications) _addModifications(internal, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
      ship.use(ship.internal[i], internal, true);
      ship.internal[i].enabled = internalJson.on === true;
      ship.internal[i].priority = internalJson.priority;
    }
  }

  // Now update the ship's codes before returning it
  return ship.updatePowerPrioritesString().updatePowerEnabledString().updateModificationsString();
}

/**
 * Add the modifications for a module
 * @param {Module} module the module
 * @param {Object} modifiers the modifiers
 * @param {Object} blueprint the blueprint of the modification
 * @param {Object} grade the grade of the modification
 * @param {Object} specialModifications special modification
 */
function _addModifications(module, modifiers, blueprint, grade, specialModifications) {
  if (!modifiers) return;
  let special;
  if (specialModifications) {
    special = Modifications.specials[Object.keys(specialModifications)[0]]
  }
  for (const i in modifiers) {
    // Some special modifications
    if (modifiers[i].name === 'mod_weapon_clip_size_override') {
      // This is a numeric addition to the clip size, but we need to work it out in terms of being a percentage so
      // that it works the same as other modifications
      const origClip = module.clip || 1;
      module.setModValue('clip', ((modifiers[i].value  - origClip) / origClip) * 10000);
    } else if (modifiers[i].name === 'mod_weapon_burst_size') {
      // This is an absolute number that acts as an override
      module.setModValue('burst', modifiers[i].value * 100);
    } else if (modifiers[i].name === 'mod_weapon_burst_rof') {
      // This is an absolute number that acts as an override
      module.setModValue('burstrof', modifiers[i].value * 100);
    } else if (modifiers[i].name === 'mod_weapon_falloffrange_from_range') {
      // Obtain the falloff value directly from the range
      module.setModValue('fallofffromrange', 1);
    } else if (modifiers[i].name && modifiers[i].name.startsWith('special_')) {
      // We don't add special effects directly, but keep a note of them so they can be added when fetching values
      special = Modifications.specials[modifiers[i].name];
    } else {
      // Look up the modifiers to find what we need to do
      const modifierActions = Modifications.modifierActions[i];
      let value;
      if (i === 'OutfittingFieldType_DefenceModifierShieldMultiplier') {
        value = modifiers[i].value - 1;
     } else if (i === 'OutfittingFieldType_DefenceModifierHealthMultiplier' && blueprint.startsWith('Armour_')) {
        value = (modifiers[i].value - module.hullboost) / module.hullboost;
      } else if (i === 'OutfittingFieldType_DefenceModifierHealthMultiplier') {
        value = modifiers[i].value / module.hullboost;
      } else if (i === 'OutfittingFieldType_RateOfFire') {
        value = (1 / Math.abs(modifiers[i].value));
      } else {
        value = modifiers[i].value - 1;
      }
      // Carry out the required changes
      for (const action in modifierActions) {
        if (isNaN(modifierActions[action])) {
          module.setModValue(action, modifierActions[action]);
        } else {
          const actionValue = modifierActions[action] * value;
          let mod = module.getModValue(action) / 10000;
          if (!mod) {
            mod = 0;
          }
          module.setModValue(action, ((1 + mod) * (1 + actionValue) - 1) * 10000);
        }
      }
    }
  }

  // Add the blueprint definition, grade and special
  if (blueprint) {
    module.blueprint = getBlueprint(blueprint, module);
    if (grade) {
      module.blueprint.grade = Number(grade);
    }
    if (special) {
      module.blueprint.special = special;
    }
  }

  // Need to fix up a few items

  // Shield boosters are treated internally as straight modifiers, so rather than (for example)
  // being a 4% boost they are a 104% multiplier.  Unfortunately this means that our % modification
  // is incorrect so we fix it
  if (module.grp === 'sb' && module.getModValue('shieldboost')) {
    const alteredBoost = (1 + module.shieldboost) * (module.getModValue('shieldboost') / 10000);
    module.setModValue('shieldboost', alteredBoost * 10000 / module.shieldboost);
  }

  // Shield booster resistance is actually a damage modifier, so needs to be inverted.
  if (module.grp === 'sb') {
    if (module.getModValue('explres')) {
      module.setModValue('explres', ((module.getModValue('explres') / 10000) * -1) * 10000);
    }
    if (module.getModValue('kinres')) {
      module.setModValue('kinres', ((module.getModValue('kinres') / 10000) * -1) * 10000);
    }
    if (module.getModValue('thermres')) {
      module.setModValue('thermres', ((module.getModValue('thermres') / 10000) * -1) * 10000);
    }
  }

  // Shield generator resistance is actually a damage modifier, so needs to be inverted.
  // In addition, the modification is based off the inherent resistance of the module
  if (ModuleUtils.isShieldGenerator(module.grp)) {
    if (module.getModValue('explres')) {
      module.setModValue('explres', ((1 - (1 - module.explres) * (1 + module.getModValue('explres') / 10000)) - module.explres) * 10000);
    }
    if (module.getModValue('kinres')) {
      module.setModValue('kinres', ((1 - (1 - module.kinres) * (1 + module.getModValue('kinres') / 10000)) - module.kinres) * 10000);
    }
    if (module.getModValue('thermres')) {
      module.setModValue('thermres', ((1 - (1 - module.thermres) * (1 + module.getModValue('thermres') / 10000)) - module.thermres) * 10000);
    }
  }

  // Hull reinforcement package resistance is actually a damage modifier, so needs to be inverted.
  // In addition, the modification is based off the inherent resistance of the module
  if (module.grp === 'hr') {
    if (module.getModValue('explres')) {
      module.setModValue('explres', ((1 - (1 - module.explres) * (1 + module.getModValue('explres') / 10000)) - module.explres) * 10000);
    }
    if (module.getModValue('kinres')) {
      module.setModValue('kinres', ((1 - (1 - module.kinres) * (1 + module.getModValue('kinres') / 10000)) - module.kinres) * 10000);
    }
    if (module.getModValue('thermres')) {
      module.setModValue('thermres', ((1 - (1 - module.thermres) * (1 + module.getModValue('thermres') / 10000)) - module.thermres) * 10000);
    }
  }

  // Bulkhead resistance is actually a damage modifier, so needs to be inverted.
  // In addition, the modification is based off the inherent resistance of the module
  if (module.grp == 'bh') {
    if (module.getModValue('explres')) {
      module.setModValue('explres', ((1 - (1 - module.explres) * (1 + module.getModValue('explres') / 10000)) - module.explres) * 10000);
    }
    if (module.getModValue('kinres')) {
      module.setModValue('kinres', ((1 - (1 - module.kinres) * (1 + module.getModValue('kinres') / 10000)) - module.kinres) * 10000);
    }
    if (module.getModValue('thermres')) {
      module.setModValue('thermres', ((1 - (1 - module.thermres) * (1 + module.getModValue('thermres') / 10000)) - module.thermres) * 10000);
    }
  }

  // Bulkhead boost is based off the inherent boost of the module
  if (module.grp == 'bh') {
    const alteredBoost = (1 + module.hullboost) * (1 + module.getModValue('hullboost') / 10000) - 1;
    module.setModValue('hullboost', (alteredBoost / module.hullboost - 1) * 1000);
  }

  // Jitter is an absolute number, so we need to divide it by 100
  if (module.getModValue('jitter')) {
    module.setModValue('jitter', module.getModValue('jitter') / 100);
  }

  // Clip size is rounded up so that the result is a whole number
  if (module.getModValue('clip')) {
    const individual = 1 / (module.clip || 1);
    module.setModValue('clip', Math.ceil((module.getModValue('clip') / 10000) / individual) * individual * 10000);
  }
}
