import Ship from '../shipyard/Ship'
import { shipModelFromJson } from './CompanionApiUtils'
import { Ships } from 'coriolis-data/dist'
import Module from '../shipyard/Module'
import { Modules } from '../../../../coriolis-data/dist'

/**
 * Obtain a module given its FD Name
 * @param {string} fdname the FD Name of the module
 * @return {Module} the module
 */
function _moduleFromFdName(fdname) {
  if (!fdname) return null;

  // Check standard modules
  for (const grp in Modules.standard) {
    if (Modules.standard.hasOwnProperty(grp)) {
      for (const i in Modules.standard[grp]) {
        if (Modules.standard[grp][i].fdname === fdname) {
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
        if (Modules.hardpoints[grp][i].fdname === fdname) {
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
        if (Modules.internal[grp][i].fdname === fdname) {
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
  for (const module of json.Modules) {
    switch (module.Slot) {
      // Cargo Hatch.
      case 'CargoHatch':
        ship.cargoHatch.enabled = module.On;
        ship.cargoHatch.priority = module.Priority;
        break;
      // Add the bulkheads
      case 'Armour':
        if (module.Item.endsWith('_Armour_Grade1')) {
          ship.useBulkhead(0, true);
        } else if (module.Item.endsWith('_Armour_Grade2')) {
          ship.useBulkhead(1, true);
        } else if (module.Item.endsWith('_Armour_Grade3')) {
          ship.useBulkhead(2, true);
        } else if (module.Item.endsWith('_Armour_Mirrored')) {
          ship.useBulkhead(3, true);
        } else if (module.Item.endsWith('_Armour_Reactive')) {
          ship.useBulkhead(4, true);
        } else {
          throw 'Unknown bulkheads "' + module.Item + '"';
        }
        ship.bulkheads.enabled = true;
        break;
      case 'PowerPlant':
        const powerplant = _moduleFromFdName(module.Item);
        ship.use(ship.standard[0], powerplant, true);
        ship.standard[0].enabled = module.On;
        ship.standard[0].priority = module.Priority;
        break;
      case 'MainEngines':
        const thrusters = _moduleFromFdName(module.Item);
        ship.use(ship.standard[1], thrusters, true);
        ship.standard[1].enabled = module.On;
        ship.standard[1].priority = module.Priority;
        break;
      case 'FrameShiftDrive':
        const frameshiftdrive = _moduleFromFdName(module.Item);
        ship.use(ship.standard[2], frameshiftdrive, true);
        ship.standard[2].enabled = module.On;
        ship.standard[2].priority = module.Priority;
        break;
      case 'LifeSupport':
        const lifesupport = _moduleFromFdName(module.Item);
        ship.use(ship.standard[3], lifesupport, true);
        ship.standard[3].enabled = module.On === true;
        ship.standard[3].priority = module.Priority;
        break;
      case 'PowerDistributor':
        const powerdistributor = _moduleFromFdName(module.Item);
        ship.use(ship.standard[4], powerdistributor, true);
        ship.standard[4].enabled = module.On;
        ship.standard[4].priority = module.Priority;
        break;
      case 'Radar':
        const sensors = _moduleFromFdName(module.Item);
        ship.use(ship.standard[5], sensors, true);
        ship.standard[5].enabled = module.On;
        ship.standard[5].priority = module.Priority;
        break;
      case 'FuelTank':
        const fueltank = _moduleFromFdName(module.Item);
        ship.use(ship.standard[6], fueltank, true);
        ship.standard[6].enabled = true;
        ship.standard[6].priority = 0;
        break;
      default:
    }
    if (module.Slot.search(/Hardpoint/) !== -1) {
      console.log(module);
    }

  }
  // We don't have any information on it so guess it's priority 5 and disabled
  if (!ship.cargoHatch) {
    ship.cargoHatch.enabled = false;
    ship.cargoHatch.priority = 4;
  }
  console.log(ship);
  let rootModule;

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
    const hardpointSlot = json.Modules[hardpointName];
    if (!hardpointSlot) {
      // This can happen with old imports that don't contain new hardpoints
    } else if (!hardpointSlot.module) {
      // No module
    } else {
      const hardpointJson = hardpointSlot.module;
      const hardpoint = _moduleFromFdName(hardpointJson.id);
      rootModule = hardpointSlot;
      if (rootModule.Engineering) _addModifications(hardpoint, rootModule.Engineering, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel, rootModule.specialModifications);
      ship.use(ship.hardpoints[hardpointArrayNum], hardpoint, true);
      ship.hardpoints[hardpointArrayNum].enabled = hardpointJson.on === true;
      ship.hardpoints[hardpointArrayNum].priority = hardpointJson.Priority;
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
      internalSlot = json.Modules[internalName];
      militarySlotNum++;
    } else {
      // Slot numbers are not contiguous so handle skips.
      while (internalSlot === null && internalSlotNum < 99) {
        // Slot sizes have no relationship to the actual size, either, so check all possibilities
        for (let slotsize = 0; slotsize < 9; slotsize++) {
          const internalName = 'Slot' + (internalSlotNum <= 9 ? '0' : '') + internalSlotNum + '_Size' + slotsize;
          if (json.Modules[internalName]) {
            internalSlot = json.Modules[internalName];
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
      const internal = _moduleFromFdName(internalJson.id);
      rootModule = internalSlot;
      if (rootModule.Engineering) _addModifications(internal, rootModule.Engineering, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
      ship.use(ship.internal[i], internal, true);
      ship.internal[i].enabled = internalJson.on === true;
      ship.internal[i].priority = internalJson.Priority;
    }
  }

  // Now update the ship's codes before returning it
  return ship.updatePowerPrioritesString().updatePowerEnabledString().updateModificationsString();
}
