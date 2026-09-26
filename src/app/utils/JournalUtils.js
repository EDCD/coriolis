import Ship from '../shipyard/Ship';
import { HARDPOINT_NUM_TO_CLASS, shipModelFromJson } from './CompanionApiUtils';
import { Ships } from 'coriolis-data/dist';
import Module from '../shipyard/Module';
import { Modules } from 'coriolis-data/dist';
import { Modifications } from 'coriolis-data/dist';
import { getBlueprint, setQualityCB } from './BlueprintFunctions';
import * as ModuleUtils from '../shipyard/ModuleUtils';

/**
 * Check if an imported module is valid
 * @param {Object} module the module to check
 * @param {Object} moduleType the type of module to check
 * @return {boolean} true if the module is valid
 */
function _isValidImportedModule(module, moduleType) {
  // First of all, has the _moduleFromFdName function returned 'null'?
  if (!module){
    return false
  }
  else {
    return true
  }
}

/**
 * Obtain a module given its FD Name
 * @param {string} fdname the FD Name of the module
 * @return {Module} the module
 */
function _moduleFromFdName(fdname) {
  if (!fdname) return null;
  fdname = fdname.toLowerCase();
  // Check standard modules
  for (const grp in Modules.standard) {
    if (Modules.standard.hasOwnProperty(grp)) {
      for (const i in Modules.standard[grp]) {
        if (Modules.standard[grp][i].symbol && Modules.standard[grp][i].symbol.toLowerCase() === fdname) {
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
        if (Modules.hardpoints[grp][i].symbol && Modules.hardpoints[grp][i].symbol.toLowerCase() === fdname) {
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
        if (Modules.internal[grp][i].symbol && Modules.internal[grp][i].symbol.toLowerCase() === fdname) {
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
 * Find the pre-engineered Expanded Capacity Cargo Rack for a given class
 * @param {Number} clss The class of the cargo rack (5 or 6)
 * @return {Module} The pre-engineered module, or null
 */
function _findPreEngineeredCargoRack(clss) {
  if (!Modules.internal.cr) return null;
  for (const mod of Modules.internal.cr) {
    if (mod.class === clss && mod.preEngineered &&
        mod.preEngineered.blueprints &&
        mod.preEngineered.blueprints.indexOf('CargoRack_IncreasedCapacity') !== -1) {
      return new Module({ template: mod });
    }
  }
  return null;
}

/**
 * Build a ship from the journal Loadout event JSON
 * @param {object} json the Loadout event JSON
 * @return {Ship} the built ship
 */
export function shipFromLoadoutJSON(json) {
// Start off building a basic ship
  const shipModel = shipModelFromJson(json);
  if (!shipModel) {
    throw 'No such ship found: "' + json.Ship + '"';
  }
  const shipTemplate = Ships[shipModel];

  let ship = new Ship(shipModel, shipTemplate.properties, shipTemplate.slots);
  ship.buildWith(null);
  // Initial Ship building, don't do engineering yet.
  let modsToAdd = [];

  for (const module of json.Modules) {
    switch (module.Slot.toLowerCase()) {
      // Cargo Hatch.
      case 'cargohatch':
        ship.cargoHatch.enabled = module.On;
        ship.cargoHatch.priority = module.Priority;
        break;
      // Add the bulkheads
      case 'armour': {
        const itemLower = module.Item.toLowerCase();
        // Ships like the Caspian Explorer have 6 bulkheads: a '_grade1_default'
        // for Lightweight Alloy and '_grade1' for the Mk II Ablative variant.
        // Standard ships have 5 bulkheads where '_grade1' is Lightweight Alloy.
        const bulkheadOffset = shipTemplate.bulkheads.length > 5 ? 1 : 0;
        if (itemLower.endsWith('_armour_grade1_default')) {
          ship.useBulkhead(0, true);
        } else if (itemLower.endsWith('_armour_grade1')) {
          ship.useBulkhead(0 + bulkheadOffset, true);
        } else if (itemLower.endsWith('_armour_grade2')) {
          ship.useBulkhead(1 + bulkheadOffset, true);
        } else if (itemLower.endsWith('_armour_grade3')) {
          ship.useBulkhead(2 + bulkheadOffset, true);
        } else if (itemLower.endsWith('_armour_mirrored')) {
          ship.useBulkhead(3 + bulkheadOffset, true);
        } else if (itemLower.endsWith('_armour_reactive')) {
          ship.useBulkhead(4 + bulkheadOffset, true);
        } else {
          throw 'Unknown bulkheads "' + module.Item + '"';
        }
        ship.bulkheads.enabled = true;
        if (module.Engineering) _addModifications(ship.bulkheads.m, module.Engineering.Modifiers, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      }
      case 'powerplant':
        let powerplant = _moduleFromFdName(module.Item);
        // Check the powerplant returned is valid
        if (!_isValidImportedModule(powerplant, 'powerplant'))
        {
          powerplant = _moduleFromFdName('Int_Missing_Powerplant');
          module.Engineering = null;
        }
        ship.use(ship.standard[0], powerplant, true);
        ship.standard[0].enabled = module.On;
        ship.standard[0].priority = module.Priority;
        if (module.Engineering) _addModifications(powerplant, module.Engineering.Modifiers, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'mainengines':
        let thrusters = _moduleFromFdName(module.Item);
        // Check the thrusters returned is valid
        if (!_isValidImportedModule(thrusters, 'thrusters'))
        {
          thrusters = _moduleFromFdName('Int_Missing_Engine');
          module.Engineering = null;
        }
        ship.use(ship.standard[1], thrusters, true);
        ship.standard[1].enabled = module.On;
        ship.standard[1].priority = module.Priority;
        if (module.Engineering) _addModifications(thrusters, module.Engineering.Modifiers, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'frameshiftdrive':
        let frameshiftdrive = _moduleFromFdName(module.Item);
        // Check the frameshiftdrive returned is valid
        if (!_isValidImportedModule(frameshiftdrive, 'frameshiftdrive'))
        {
          frameshiftdrive = _moduleFromFdName('Int_Missing_Hyperdrive');
          module.Engineering = null;
        }
        ship.use(ship.standard[2], frameshiftdrive, true);
        ship.standard[2].enabled = module.On;
        ship.standard[2].priority = module.Priority;
        if (module.Engineering)  _addModifications(frameshiftdrive, module.Engineering.Modifiers, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'lifesupport':
        let lifesupport = _moduleFromFdName(module.Item);
        // Check the lifesupport returned is valid
        if (!_isValidImportedModule(lifesupport, 'lifesupport'))
        {
          lifesupport = _moduleFromFdName('Int_Missing_LifeSupport');
          module.Engineering = null;
        }
        ship.use(ship.standard[3], lifesupport, true);
        ship.standard[3].enabled = module.On === true;
        ship.standard[3].priority = module.Priority;
        if (module.Engineering) _addModifications(lifesupport, module.Engineering.Modifiers, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'powerdistributor':
        let powerdistributor = _moduleFromFdName(module.Item);
        // Check the powerdistributor returned is valid
        if (!_isValidImportedModule(powerdistributor, 'powerdistributor'))
        {
          powerdistributor = _moduleFromFdName('Int_Missing_PowerDistributor');
          module.Engineering = null;
        }
        ship.use(ship.standard[4], powerdistributor, true);
        ship.standard[4].enabled = module.On;
        ship.standard[4].priority = module.Priority;
        if (module.Engineering) _addModifications(powerdistributor, module.Engineering.Modifiers, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'radar':
        let sensors = _moduleFromFdName(module.Item);
        // Check the sensors returned is valid
        if (!_isValidImportedModule(sensors, 'sensors'))
        {
          sensors = _moduleFromFdName('Int_Missing_Sensors');
          module.Engineering = null;
        }
        ship.use(ship.standard[5], sensors, true);
        ship.standard[5].enabled = module.On;
        ship.standard[5].priority = module.Priority;
        if (module.Engineering) _addModifications(sensors, module.Engineering.Modifiers, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'fueltank':
        let fueltank = _moduleFromFdName(module.Item);
        // Check the fueltank returned is valid
        if (!_isValidImportedModule(fueltank, 'fueltank'))
        {
          fueltank = _moduleFromFdName('Int_Missing_FuelTank');
        }
        ship.use(ship.standard[6], fueltank, true);
        ship.standard[6].enabled = true;
        ship.standard[6].priority = 0;
        break;
      default:
    }
    if (module.Slot.toLowerCase().search(/hardpoint/) !== -1) {
      // Add hardpoints
      let hardpoint;
      let hardpointArrayNum = 0;
      const classSlotCounters = {};
      for (let i in shipTemplate.slots.hardpoints) {
        const slotDef = shipTemplate.slots.hardpoints[i];
        const hardpointClassNum = typeof slotDef === 'object' ? slotDef.class : slotDef;
        const slotNamePrefix = typeof slotDef === 'object' && slotDef.name ? slotDef.name : '';
        classSlotCounters[hardpointClassNum] = (classSlotCounters[hardpointClassNum] || 0) + 1;
        let hardpointSlotNum = classSlotCounters[hardpointClassNum];

        // If the ship is the T8, skip SmallHardpoint3
        if (shipModel === 'type_8_transport' && hardpointClassNum === 1 && hardpointSlotNum === 3) {
          classSlotCounters[hardpointClassNum]++;
          hardpointSlotNum = classSlotCounters[hardpointClassNum];
        }

        // Construct the slot name (e.g. "LargeMiningHardpoint1" or "MediumHardpoint3")
        const hardpointName = HARDPOINT_NUM_TO_CLASS[hardpointClassNum] + slotNamePrefix + 'Hardpoint' + hardpointSlotNum;
        const hardpointSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === hardpointName.toLowerCase());
        if (!hardpointSlot) {
          // This can happen with old imports that don't contain new hardpoints
        } else {
          hardpoint = _moduleFromFdName(hardpointSlot.Item);
          // Check the hardpoint module returned is valid
          if (!_isValidImportedModule(hardpoint, 'hardpoint')){
            // Check if it's a Utility or Hardpoint
            if (hardpointSlot.Slot.toLowerCase().search(/tiny/))
            {
              // Use the missing_hardpoint module 'Missing Hardpoint' which will inform the user that the module is missing
              hardpoint = _moduleFromFdName('Hpt_Missing_Hardpoint');
            }
            else {
              // Use the missing_hardpoint module 'Missing Utility' which will inform the user that the module is missing
              hardpoint = _moduleFromFdName('Hpt_Missing_Utility');
            }
            ship.use(ship.hardpoints[hardpointArrayNum], hardpoint, true);
            ship.hardpoints[hardpointArrayNum].enabled = hardpointSlot.On;
            ship.hardpoints[hardpointArrayNum].priority = hardpointSlot.Priority;
          } else {
            ship.use(ship.hardpoints[hardpointArrayNum], hardpoint, true);
            ship.hardpoints[hardpointArrayNum].enabled = hardpointSlot.On;
            ship.hardpoints[hardpointArrayNum].priority = hardpointSlot.Priority;
            modsToAdd.push({ coriolisMod: hardpoint, json: hardpointSlot });
          }
        }
        hardpointArrayNum++;
      }
    }
  }

  let internalSlotNum = 1;
  // If the ship is a T9, we have to start the internalSlotNum at 0
  if (shipModel === 'type_9_heavy') {
    internalSlotNum = 0;
  }
  let militarySlotNum = 1;
  let cargoSlotNum = 1;
  let limpetSlotNum = 1;
  let fighterSlotNum = 1;
  let passengerSlotNum = 1;
  for (let i in shipTemplate.slots.internal) {
    if (!shipTemplate.slots.internal.hasOwnProperty(i)) {
      continue;
    }
    const slotObj = shipTemplate.slots.internal[i];
    const isNamedSlot = isNaN(slotObj);
    const slotName = isNamedSlot ? slotObj.name : null;
    const isMilitary = slotName === 'Military';
    const isPlanetary = slotName === 'PlanetaryApproachSuite';
    const isCargo = slotName === 'Cargo';
    const isLimpets = slotName === 'Limpets';
    const isFighter = slotName === 'Fighter';
    const isPassenger = slotName === 'MkIIPassenger';

    // Named slots have their own naming conventions separate from the standard SlotNN_SizeN pattern
    let internalSlot = null;
    if (isMilitary) {
        const internalName = 'Military0' + militarySlotNum;
        internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
        militarySlotNum++;
    } else if (isPlanetary) {
        const internalName = 'PlanetaryApproachSuite';
        internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
    } else if (isCargo) {
        const internalName = 'Cargo0' + cargoSlotNum;
        internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
        cargoSlotNum++;
    } else if (isLimpets) {
        const internalName = 'LimpetController0' + limpetSlotNum;
        internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
        limpetSlotNum++;
    } else if (isFighter) {
        const internalName = 'FighterBay0' + fighterSlotNum;
        internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
        fighterSlotNum++;
    } else if (isPassenger) {
        const internalName = 'Passenger0' + passengerSlotNum;
        internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
        passengerSlotNum++;
    } else {
        // Some ships skip internal slot indexes because military/restricted slots occupy those numbers in the journal
        // Anaconda skips 12 and 13, Dropship skips 7 and 8, T9 skips 9 and 10, T10 skips 9 and 10, Vulture skips 4
        if ((internalSlotNum === 11 && shipModel === 'anaconda') ||
            (internalSlotNum === 7 && shipModel === 'federal_dropship') ||
            (internalSlotNum === 9 && shipModel === 'type_9_heavy') ||
            (internalSlotNum === 9 && shipModel === 'type_10_defender')) {
          internalSlotNum += 2;
        } else if (internalSlotNum === 4 && shipModel === 'vulture') {
          internalSlotNum++;
        }

        let internalName = 'Slot';
        if (internalSlotNum < 10) {
          internalName += '0' + internalSlotNum + '_Size' + shipTemplate.slots.internal[i];
        } else {
          internalName += internalSlotNum + '_Size' + shipTemplate.slots.internal[i];
        }
        internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
        internalSlotNum++;
    }

    if (!internalSlot) {
      // This can happen with old imports that don't contain new slots
      // Default PAS slot to Advanced Planetary Approach Suite (Odyssey)
      if (isPlanetary) {
        let apas = _moduleFromFdName('int_planetapproachsuite_advanced');
        if (apas) {
          ship.use(ship.internal[i], apas, true);
        }
      }
    } else {
      const internalJson = internalSlot;
      let internal = _moduleFromFdName(internalJson.Item);

      // Check if this is a cargo rack with the Expanded Capacity pre-engineering
      // If so, swap to the pre-engineered module and skip applying engineering manually
      if (internal && internalJson.Engineering &&
          internalJson.Engineering.BlueprintName.toLowerCase() === 'cargorack_increasedcapacity') {
        const preEngRack = _findPreEngineeredCargoRack(internal.class);
        if (preEngRack) {
          internal = preEngRack;
          // Clear engineering - the pre-engineered module's use() handler applies it automatically
          internalJson.Engineering = null;
        }
      }

      // Check the internal module returned is valid
      if (!_isValidImportedModule(internal, 'internal'))
      {
        internal = _moduleFromFdName('Int_Missing_Module');
        ship.use(ship.internal[i], internal, true);
        ship.internal[i].enabled = internalJson.On === true;
        ship.internal[i].priority = internalJson.Priority;
        //throw 'Unknown internal module: "' + module.Item + '"';
      }
      else {
        ship.use(ship.internal[i], internal, true);
        ship.internal[i].enabled = internalJson.On === true;
        ship.internal[i].priority = internalJson.Priority;
        modsToAdd.push({ coriolisMod: internal, json: internalSlot });
      }
    }
  }

  for (const i of modsToAdd) {
    if (i.json.Engineering) {
      _addModifications(i.coriolisMod, i.json.Engineering.Modifiers, i.json.Engineering.Quality, i.json.Engineering.BlueprintName, i.json.Engineering.Level, i.json.Engineering.ExperimentalEffect);
    }
  }
  // We don't have any information on it so guess it's priority 5 and disabled
  if (!ship.cargoHatch) {
    ship.cargoHatch.enabled = false;
    ship.cargoHatch.priority = 4;
  }

  // Now update the ship's codes before returning it
  return ship.updatePowerPrioritesString().updatePowerEnabledString().updateModificationsString();
}

/**
 * Add the modifications for a module
 * @param {Module} module the module
 * @param {Object} modifiers the modifiers
 * @param {float} quality quality of the modifiers 0 to 1
 * @param {Object} blueprint the blueprint of the modification
 * @param {Object} grade the grade of the modification
 * @param {Object} specialModifications special modification
 */
function _addModifications(module, modifiers, quality, blueprint, grade, specialModifications) {
  if (!modifiers && !quality) return;
  let special;
  if (specialModifications) {
    if (specialModifications == 'special_plasma_slug') {
      if (module.symbol.match(/PlasmaAccelerator/i)) {
        specialModifications = 'special_plasma_slug_pa';
      } else {
        specialModifications = 'special_plasma_slug_cooled';
      }
    }
    special = Modifications.specials[specialModifications];
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
  if (modifiers) {
    for (const i in modifiers) {
      // Some special modifications
      // Look up the modifiers to find what we need to do
      const findMod = val => Object.keys(Modifications.modifierActions).find(elem => elem.toString().toLowerCase().replace(/(outfittingfieldtype_|persecond)/igm, '') === val.toString().toLowerCase().replace(/(outfittingfieldtype_|persecond)/igm, ''));
      const modifierActions = Modifications.modifierActions[findMod(modifiers[i].Label)];
      // TODO: Figure out how to scale this value.
      if (!!modifiers[i].LessIsGood) {

      }
      let value = (modifiers[i].Value / modifiers[i].OriginalValue * 100 - 100) * 100;
      if (value === Infinity) {
        value = modifiers[i].Value * 100;
      }
      if (modifiers[i].Label.search('DamageFalloffRange') >= 0) {
        value = (modifiers[i].Value / module.range - 1) * 100;
      }
      if (modifiers[i].Label.search('Resistance') >= 0) {
        value = (modifiers[i].Value * 100) - (modifiers[i].OriginalValue * 100);
      }
      if (modifiers[i].Label.search('ShieldMultiplier') >= 0 || modifiers[i].Label.search('DefenceModifierHealthMultiplier') >= 0) {
        value = ((100 + modifiers[i].Value) / (100 + modifiers[i].OriginalValue) * 100 - 100) * 100;
      }

      // Carry out the required changes
      for (const action in modifierActions) {
        if (isNaN(modifierActions[action])) {
          module.setModValue(action, modifierActions[action]);
        } else {
          module.setModValue(action, value, true);
        }
      }
    }
  } else if (quality) {
    setQualityCB(module.blueprint, quality, (featureName, value) => module.setModValue(featureName, value, false));
  }
}
