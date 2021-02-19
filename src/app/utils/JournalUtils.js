import Ship from '../shipyard/Ship';
import { HARDPOINT_NUM_TO_CLASS, shipModelFromJson } from './CompanionApiUtils';
import { Ships } from 'coriolis-data/dist';
import Module from '../shipyard/Module';
import { Modules } from 'coriolis-data/dist';
import { Modifications } from 'coriolis-data/dist';
import { getBlueprint } from './BlueprintFunctions';

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
      case 'armour':
        if (module.Item.toLowerCase().endsWith('_armour_grade1')) {
          ship.useBulkhead(0, true);
        } else if (module.Item.toLowerCase().endsWith('_armour_grade2')) {
          ship.useBulkhead(1, true);
        } else if (module.Item.toLowerCase().endsWith('_armour_grade3')) {
          ship.useBulkhead(2, true);
        } else if (module.Item.toLowerCase().endsWith('_armour_mirrored')) {
          ship.useBulkhead(3, true);
        } else if (module.Item.toLowerCase().endsWith('_armour_reactive')) {
          ship.useBulkhead(4, true);
        } else {
          throw 'Unknown bulkheads "' + module.Item + '"';
        }
        ship.bulkheads.enabled = true;
        if (module.Engineering) _addModifications(ship.bulkheads.m, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'powerplant':
        const powerplant = _moduleFromFdName(module.Item);
        ship.use(ship.standard[0], powerplant, true);
        ship.standard[0].enabled = module.On;
        ship.standard[0].priority = module.Priority;
        if (module.Engineering) _addModifications(powerplant, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'mainengines':
        const thrusters = _moduleFromFdName(module.Item);
        ship.use(ship.standard[1], thrusters, true);
        ship.standard[1].enabled = module.On;
        ship.standard[1].priority = module.Priority;
        if (module.Engineering) _addModifications(thrusters, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'frameshiftdrive':
        const frameshiftdrive = _moduleFromFdName(module.Item);
        ship.use(ship.standard[2], frameshiftdrive, true);
        ship.standard[2].enabled = module.On;
        ship.standard[2].priority = module.Priority;
        if (module.Engineering)  _addModifications(frameshiftdrive, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'lifesupport':
        const lifesupport = _moduleFromFdName(module.Item);
        ship.use(ship.standard[3], lifesupport, true);
        ship.standard[3].enabled = module.On === true;
        ship.standard[3].priority = module.Priority;
        if (module.Engineering) _addModifications(lifesupport, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'powerdistributor':
        const powerdistributor = _moduleFromFdName(module.Item);
        ship.use(ship.standard[4], powerdistributor, true);
        ship.standard[4].enabled = module.On;
        ship.standard[4].priority = module.Priority;
        if (module.Engineering) _addModifications(powerdistributor, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'radar':
        const sensors = _moduleFromFdName(module.Item);
        ship.use(ship.standard[5], sensors, true);
        ship.standard[5].enabled = module.On;
        ship.standard[5].priority = module.Priority;
        if (module.Engineering) _addModifications(sensors, module.Engineering.Quality, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
        break;
      case 'fueltank':
        const fueltank = _moduleFromFdName(module.Item);
        ship.use(ship.standard[6], fueltank, true);
        ship.standard[6].enabled = true;
        ship.standard[6].priority = 0;
        break;
      default:
    }
    if (module.Slot.toLowerCase().search(/hardpoint/) !== -1) {
      // Add hardpoints
      let hardpoint;
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
        const hardpointSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === hardpointName.toLowerCase());
        if (!hardpointSlot) {
          // This can happen with old imports that don't contain new hardpoints
        } else if (!hardpointSlot) {
          // No module
        } else {
          hardpoint = _moduleFromFdName(hardpointSlot.Item);
          ship.use(ship.hardpoints[hardpointArrayNum], hardpoint, true);
          ship.hardpoints[hardpointArrayNum].enabled = hardpointSlot.On;
          ship.hardpoints[hardpointArrayNum].priority = hardpointSlot.Priority;
          modsToAdd.push({ coriolisMod: hardpoint, json: hardpointSlot });
        }
        hardpointArrayNum++;
      }
    }
  }

  let internalSlotNum = 0;
  let militarySlotNum = 1;
  for (let i in shipTemplate.slots.internal) {
    if (!shipTemplate.slots.internal.hasOwnProperty(i)) {
      continue;
    }
    const isMilitary = isNaN(shipTemplate.slots.internal[i]) ? shipTemplate.slots.internal[i].name == 'Military' : false;

    // The internal slot might be a standard or a military slot.  Military slots have a different naming system
    let internalSlot = null;
    if (isMilitary) {
      const internalName = 'Military0' + militarySlotNum;
      internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
      militarySlotNum++;
    } else {
      // Slot numbers are not contiguous so handle skips.
      for (; internalSlot === null && internalSlotNum < 99; internalSlotNum++) {
        // Slot sizes have no relationship to the actual size, either, so check all possibilities
        for (let slotsize = 0; slotsize < 9; slotsize++) {
          const internalName = 'Slot' + (internalSlotNum <= 9 ? '0' : '') + internalSlotNum + '_Size' + slotsize;
          if (json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase())) {
            internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
            break;
          }
        }
      }
    }

    if (!internalSlot) {
      // This can happen with old imports that don't contain new slots
    } else {
      const internalJson = internalSlot;
      const internal = _moduleFromFdName(internalJson.Item);
      ship.use(ship.internal[i], internal, true);
      ship.internal[i].enabled = internalJson.On === true;
      ship.internal[i].priority = internalJson.Priority;
      modsToAdd.push({ coriolisMod: internal, json: internalSlot });
    }
  }

  for (const i of modsToAdd) {
    if (i.json.Engineering) {
      _addModifications(i.coriolisMod, i.json.Engineering.Quality, i.json.Engineering.BlueprintName, i.json.Engineering.Level, i.json.Engineering.ExperimentalEffect);
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
 * @param {float} quality the quality of the blueprint
 * @param {Object} blueprint the blueprint of the modification
 * @param {Object} grade the grade of the modification
 * @param {Object} specialModifications special modification
 */
function _addModifications(module, quality, blueprint, grade, specialModifications) {
 
  
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

  console.groupCollapsed(`--- ${module.name || module.ukName || module.symbol} ---`)
  console.info('Module', module)
  console.info('Blueprint', module.blueprint)  
  console.group('Features')
  //Get features from the blueprint
  const features = module.blueprint.grades[Number(grade)].features
  Object.keys(features).map(featureKey => {
    console.group(featureKey)
    console.info('Range', features[featureKey])
    console.info('Blueprint Quality', `${(quality*100)}%`)
    
    /*
      Here we compute the value to use for this feature based on the range and quality. 
      We do this by finding the difference between the low and high ends of the range.
      This gives us the maximum increase at 100% quality. Then we multiply this number by
      the quality to determine the actual increase. Lastly we add the actual increase to 
      the low end of the range back in to determine the final value.

      Value = ((High End of Range - Low End of Range) * Quality) + Low End of Range
    */
    let value = (((features[featureKey][1] * 100) - (features[featureKey][0] * 100)  * Number(quality)) + (features[featureKey][0] * 100)) * 100
    console.info('Computed Value', value)
    console.groupEnd(featureKey)
    module.setModValue(featureKey, value, false);    
  })
  console.groupEnd('Features')

  console.groupEnd(`--- ${module.name} ---`)
}
