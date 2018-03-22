import * as Calc from './Calculations';
import * as ModuleUtils from './ModuleUtils';
import * as Utils from '../utils/UtilityFunctions';
import { getBlueprint } from '../utils/BlueprintFunctions';
import Module from './Module';
import LZString from 'lz-string';
import * as _ from 'lodash';
import isEqual from 'lodash/lang';
import { Ships, Modifications } from 'coriolis-data/dist';
const zlib = require('zlib');

const UNIQUE_MODULES = ['psg', 'sg', 'bsg', 'rf', 'fs', 'fh'];

// Constants for modifications struct
const SLOT_ID_DONE = -1;
const MODIFICATION_ID_DONE = -1;
const MODIFICATION_ID_BLUEPRINT = -2;
const MODIFICATION_ID_GRADE = -3;
const MODIFICATION_ID_SPECIAL = -4;

/**
 * Returns the power usage type of a slot and it's particular module
 * @param  {Object} slot      The Slot
 * @param  {Object} modul     The module in the slot
 * @return {String}           The key for the power usage type
 */
function powerUsageType(slot, modul) {
  if (modul) {
    if (modul.passive) {
      return 'retracted';
    }
  }
  return slot.cat != 1 ? 'retracted' : 'deployed';
}

/**
 * Populates the category array with module IDs from
 * the provided code
 * @param  {String} code    Serialized ship code
 * @param  {Array}  arr     Category array
 * @param  {Number} codePos Current position/Index of code string
 * @return {Number}         Next position/Index of code string
 */
function decodeToArray(code, arr, codePos) {
  for (let i = 0; i < arr.length; i++) {
    if (code.charAt(codePos) == '-') {
      arr[i] = 0;
      codePos++;
    } else {
      arr[i] = code.substring(codePos, codePos + 2);
      codePos += 2;
    }
  }
  return codePos;
}

/**
 * Reduce function used to get the IDs for a slot group (or array of slots)
 * @param  {array} idArray    The current Array of IDs
 * @param  {Object} slot      Slot object
 * @param  {integer} slotIndex The index for the slot in its group
 * @return {array}           The mutated idArray
 */
function reduceToIDs(idArray, slot, slotIndex) {
  idArray[slotIndex] = slot.m ? slot.m.id : '-';
  return idArray;
}

/**
 * Ship Model - Encapsulates and models in-game ship behavior
 */
export default class Ship {

  /**
   * @param {String} id         Unique ship Id / Key
   * @param {Object} properties Basic ship properties such as name, manufacturer, mass, etc
   * @param {Object} slots      Collection of slot groups (standard/standard, internal, hardpoints) with their max class size.
   */
  constructor(id, properties, slots) {
    this.id = id;
    this.serialized = {};
    this.cargoHatch = { m: ModuleUtils.cargoHatch(), type: 'SYS' };
    this.bulkheads = { incCost: true, maxClass: 8 };
    this.availCS = ModuleUtils.forShip(id);

    for (let p in properties) { this[p] = properties[p]; }  // Copy all base properties from shipData

    for (let slotType in slots) {   // Initialize all slots
      let slotGroup = slots[slotType];
      let group = this[slotType] = [];   // Initialize Slot group (Standard, Hardpoints, Internal)
      for (let slot of slotGroup) {
        if (typeof slot == 'object') {
          group.push({ m: null, incCost: true, maxClass: slot.class, eligible: slot.eligible });
        } else {
          group.push({ m: null, incCost: true, maxClass: slot });
        }
      }
    }
    // Make a Ship 'slot'/item similar to other slots
    this.m = { incCost: true, type: 'SHIP', discountedCost: this.hullCost, m: { class: '', rating: '', name: this.name, cost: this.hullCost } };
    this.costList = this.internal.concat(this.m, this.standard, this.hardpoints, this.bulkheads);
    this.powerList = this.internal.concat(
      this.cargoHatch,
      this.standard[0],  // Add Power Plant
      this.standard[2],  // Add FSD
      this.standard[1],  // Add Thrusters
      this.standard[4],  // Add Power Distributor
      this.standard[5],  // Add Sensors
      this.standard[3],  // Add Life Support
      this.hardpoints
    );
    this.moduleCostMultiplier = 1;
    this.priorityBands = [
      { deployed: 0, retracted: 0, },
      { deployed: 0, retracted: 0, },
      { deployed: 0, retracted: 0, },
      { deployed: 0, retracted: 0, },
      { deployed: 0, retracted: 0, }
    ];
  }

  /* GETTERS */

  /**
   * Can the ship thrust/move
   * @param  {Number} cargo     Amount of cargo in the ship
   * @param  {Number} fuel      Amount of fuel in the ship
   * @return {[type]} True if thrusters operational
   */
  canThrust(cargo, fuel) {
    return this.getSlotStatus(this.standard[1]) == 3 &&   // Thrusters are powered
        this.unladenMass + cargo + fuel < this.standard[1].m.getMaxMass(); // Max mass not exceeded
  }

  /**
   * Can the ship boost
   * @param  {Number} cargo     Amount of cargo in the ship
   * @param  {Number} fuel      Amount of fuel in the ship
   * @return {[type]} True if boost capable
   */
  canBoost(cargo, fuel) {
    return this.canThrust(cargo, fuel) &&                           // Thrusters operational
        this.standard[4].m.getEnginesCapacity() > this.boostEnergy; // PD capacitor is sufficient for boost
  }

  /**
   * Calculate the hypothetical laden jump range based on a potential change in mass, fuel, or FSD
   * @param  {Number} massDelta Optional - Change in laden mass (mass + cargo + fuel)
   * @param  {Number} fuel      Optional - Available fuel (defaults to max fuel based on FSD)
   * @param  {Object} fsd       Optional - Frame Shift Drive (or use mounted FSD)
   * @return {Number}           Jump range in Light Years
   */
  calcLadenRange(massDelta, fuel, fsd) {
    return Calc.jumpRange(this.ladenMass + (massDelta || 0), fsd || this.standard[2].m, fuel);
  }

  /**
   * Calculate the hypothetical unladen jump range based on a potential change in mass, fuel, or FSD
   * @param  {Number} massDelta Optional - Change in ship mass
   * @param  {Number} fuel      Optional - Available fuel (defaults to lesser of fuel capacity or max fuel based on FSD)
   * @param  {Object} fsd       Optional - Frame Shift Drive (or use mounted FSD)
   * @return {Number}           Jump range in Light Years
   */
  calcUnladenRange(massDelta, fuel, fsd) {
    fsd = fsd || this.standard[2].m;
    let fsdMaxFuelPerJump = fsd instanceof Module ? fsd.getMaxFuelPerJump() : fsd.maxfuel;
    return Calc.jumpRange(this.unladenMass + (massDelta || 0) +  Math.min(fsdMaxFuelPerJump, fuel || this.fuelCapacity), fsd || this.standard[2].m, fuel);
  }

  /**
   * Calculate the hypothetical top speeds at cargo and fuel tonnage
   * @param  {Number} fuel  Fuel available in tons
   * @param  {Number} cargo Cargo in tons
   * @return {array}       Speed at pip settings
   */
  calcSpeedsWith(fuel, cargo) {
    return Calc.speed(this.unladenMass + fuel + cargo, this.speed, this.standard[1].m, this.pipSpeed);
  }

  /**
   * Calculate the speed for a given configuration
   * @param  {Number}  eng   Number of pips in ENG
   * @param  {Number}  fuel  Amount of fuel carried
   * @param  {Number}  cargo Amount of cargo carried
   * @param  {boolean} boost true if boost is applied
   * @return {Number}        Speed
   */
  calcSpeed(eng, fuel, cargo, boost) {
    return Calc.calcSpeed(this.unladenMass + fuel + cargo, this.speed, this.standard[1].m, this.pipSpeed, eng, this.boost / this.speed, boost);
  }

  /**
   * Calculate the pitch for a given configuration
   * @param  {Number}  eng   Number of pips in ENG
   * @param  {Number}  fuel  Amount of fuel carried
   * @param  {Number}  cargo Amount of cargo carried
   * @param  {boolean} boost true if boost is applied
   * @return {Number}        Pitch
   */
  calcPitch(eng, fuel, cargo, boost) {
    return Calc.calcPitch(this.unladenMass + fuel + cargo, this.pitch, this.standard[1].m, this.pipSpeed, eng, this.boost / this.speed, boost);
  }

  /**
   * Calculate the roll for a given configuration
   * @param  {Number}  eng   Number of pips in ENG
   * @param  {Number}  fuel  Amount of fuel carried
   * @param  {Number}  cargo Amount of cargo carried
   * @param  {boolean} boost true if boost is applied
   * @return {Number}        Roll
   */
  calcRoll(eng, fuel, cargo, boost) {
    return Calc.calcRoll(this.unladenMass + fuel + cargo, this.roll, this.standard[1].m, this.pipSpeed, eng, this.boost / this.speed, boost);
  }

  /**
   * Calculate the yaw for a given configuration
   * @param  {Number}  eng   Number of pips in ENG
   * @param  {Number}  fuel  Amount of fuel carried
   * @param  {Number}  cargo Amount of cargo carried
   * @param  {boolean} boost true if boost is applied
   * @return {Number}        Yaw
   */
  calcYaw(eng, fuel, cargo, boost) {
    return Calc.calcYaw(this.unladenMass + fuel + cargo, this.yaw, this.standard[1].m, this.pipSpeed, eng, this.boost / this.speed, boost);
  }

  /**
   * Calculate the hypothetical shield strength for the ship using the specified parameters
   * @param  {Object} sg              [optional] Shield Generator to use
   * @param  {Number} multiplierDelta [optional] Change to shield multiplier (+0.2, - 0.12, etc)
   * @return {Number}                 Shield strength in MJ
   */
  calcShieldStrengthWith(sg, multiplierDelta) {
    if (!sg) {
      let sgSlot = this.findInternalByGroup('sg');
      if (!sgSlot) {
        return 0;
      }
      sg = sgSlot.m;
    }

    // TODO Not accurate if the ship has modified shield boosters
    return Calc.shieldStrength(this.hullMass, this.baseShieldStrength, sg, 1 + (multiplierDelta || 0));
  }

  /**
   * Get the set of available modules for this ship
   * @return {ModuleSet} Available module set
   */
  getAvailableModules() {
    return this.availCS;
  }

  /**
   * Returns the a slots power status:
   *  0 - No status [Blank]
   *  1 - Disabled (Switched off)
   *  2 - Offline (Insufficient power available)
   *  3 - Online
   * @param  {Object} slot        Slot model
   * @param  {boolean} deployed   True - power used when hardpoints are deployed
   * @return {Number}             status index
   */
  getSlotStatus(slot, deployed) {
    if (!slot.m) { // Empty Slot
      return 0;   // No Status (Not possible to be active in this state)
    } else if (!slot.enabled) {
      return 1;   // Disabled
    } else if (deployed) {
      return this.priorityBands[slot.priority].deployedSum >= this.powerAvailable ? 2 : 3; // Offline : Online
      // Active hardpoints have no retracted status
    } else if ((slot.cat === 1 && !slot.m.passive)) {
      return 0;  // No Status (Not possible to be active in this state)
    }
    return this.priorityBands[slot.priority].retractedSum >= this.powerAvailable ? 2 : 3;    // Offline : Online
  }

  /**
   * Find an internal slot that has an installed modul of the specific group.
   *
   * @param  {String} group Module group/type
   * @return {Number}       The index of the slot in ship.internal
   */
  findInternalByGroup(group) {
    if (ModuleUtils.isShieldGenerator(group)) {
      return this.internal.find(slot => slot.m && ModuleUtils.isShieldGenerator(slot.m.grp));
    } else {
      return this.internal.find(slot => slot.m && slot.m.grp == group);
    }
  }

  /**
   * Find the shield generator for this ship
   * @return {object}       The shield generator module for this ship
   */
  findShieldGenerator() {
    const slot = this.internal.find(slot => slot.m && ModuleUtils.isShieldGenerator(slot.m.grp));
    return slot ? slot.m : undefined;
  }

  /**
   * Serializes the ship to a string
   * @return {String} Serialized ship 'code'
   */
  toString() {
    return [
      'A',
      this.getStandardString(),
      this.getHardpointsString(),
      this.getInternalString(),
      '.',
      this.getPowerEnabledString(),
      '.',
      this.getPowerPrioritiesString(),
      '.',
      this.getModificationsString()
    ].join('');
  }

  /**
   * Serializes the standard modules to a string
   * @return {String} Serialized standard modules 'code'
   */
  getStandardString() {
    if(!this.serialized.standard) {
      this.serialized.standard = this.bulkheads.m.index + this.standard.reduce((arr, slot, i) => {
        arr[i] = slot.m ? slot.m.id : '-';
        return arr;
      }, new Array(this.standard.length)).join('');
    }
    return this.serialized.standard;
  }

  /**
   * Serializes the internal modules to a string
   * @return {String} Serialized internal modules 'code'
   */
  getInternalString() {
    if(!this.serialized.internal) {
      this.serialized.internal = this.internal.reduce(reduceToIDs, new Array(this.internal.length)).join('');
    }
    return this.serialized.internal;
  }

  /**
   * Serializes the hardpoints and utility modules to a string
   * @return {String} Serialized hardpoints and utility modules 'code'
   */
  getHardpointsString() {
    if(!this.serialized.hardpoints) {
      this.serialized.hardpoints = this.hardpoints.reduce(reduceToIDs, new Array(this.hardpoints.length)).join('');
    }
    return this.serialized.hardpoints;
  }

  /**
   * Serializes the modifications to a string
   * @return {String} Serialized modifications 'code'
   */
  getModificationsString() {
    // Modifications can be updated outside of the ship's direct knowledge, for example when sliders change the value,
    // so always recreate it from scratch
    this.updateModificationsString();
    return this.serialized.modifications;
  }

  /**
   * Get the serialized module active/inactive settings
   * @return {String} Serialized active/inactive settings
   */
  getPowerEnabledString() {
    return this.serialized.enabled;
  }

  /**
   * Get the serialized module priority settings
   * @return {String} Serialized priority settings
   */
  getPowerPrioritiesString() {
    return this.serialized.priorities;
  }

  /* Mutate / Update Ship */

  /**
   * Recalculate all item costs and total based on discounts.
   * @param  {Number} shipDiscount      Ship cost discount (e.g. 0.1 === 10% discount)
   * @param  {Number} moduleDiscount    Module cost discount (e.g. 0.75 === 25% discount)
   * @return {this} The current ship instance for chaining
   */
  applyDiscounts(shipDiscount, moduleDiscount) {
    let shipCostMultiplier = 1 - shipDiscount;
    let moduleCostMultiplier = 1 - moduleDiscount;
    let total = 0;
    let costList = this.costList;

    for (let i = 0, l = costList.length; i < l; i++) {
      let item = costList[i];
      if (item.m && item.m.cost) {
        item.discountedCost = item.m.cost * (item.type == 'SHIP' ? shipCostMultiplier : moduleCostMultiplier);
        if (item.incCost) {
          total += item.discountedCost;
        }
      }
    }
    this.moduleCostMultiplier = moduleCostMultiplier;
    this.totalCost = total;
    return this;
  }

  /**
   * Clear all modification values for a module
   * @param  {Number} m      The module for which to clear the modifications
   */
  clearModifications(m) {
    m.mods = {};
    this.updatePowerGenerated()
        .updatePowerUsed()
        .recalculateMass()
        .updateJumpStats()
        .recalculateShield()
        .recalculateShieldCells()
        .recalculateArmour()
        .recalculateDps()
        .recalculateEps()
        .recalculateHps()
        .updateMovement();
  }

  /**
   * Set blueprint for a module
   * @param  {Object} m      The module for which to set the blueprint
   * @param  {Object} bp     The blueprint
   */
  setModuleBlueprint(m, bp) {
    m.blueprint = bp;
    this.clearModifications(m);
    // Set any hidden items for the blueprint now
    const features = m.blueprint.grades[m.blueprint.grade].features;
    for (const featureName in features) {
      if (Modifications.modifications[featureName].hidden) {
        this.setModification(m, featureName, bp.grades[bp.grade].features[featureName][0]);
      }
    }
    this.updateModificationsString();
  }

  /**
   * Clear blueprint for a module
   * @param  {Object} m      The module for which to clear the blueprint
   */
  clearModuleBlueprint(m) {
    m.blueprint = {};
    this.updateModificationsString();
  }

  /**
   * Set special for a module
   * @param  {Object} m       The module for which to set the blueprint
   * @param  {Object} special The special
   */
  setModuleSpecial(m, special) {
    if (m.blueprint) {
      m.blueprint.special = special;
    }
    this.recalculateDps().recalculateHps().recalculateEps();
  }

  /**
   * Clear special for a module
   * @param  {Object} m      The module for which to clear the blueprint
   */
  clearModuleSpecial(m) {
    if (m.blueprint) {
      m.blueprint.special = null;
    }
    this.recalculateDps().recalculateHps().recalculateEps();
  }

  /**
   * Set a modification value and update ship stats
   * @param {Object} m          The module to change
   * @param {Object} name       The name of the modification to change
   * @param {Number} value The new value of the modification.  The value of the modification is scaled to provide two decimal places of precision in an integer.  For example 1.23% is stored as 123
   * @param {bool}   sentfromui True if this update was sent from the UI
   */
  setModification(m, name, value, sentfromui) {
    if (isNaN(value)) {
      // Value passed is invalid; reset it to 0
      value = 0;
    }

    // Handle special cases
    if (name === 'pgen') {
      // Power generation
      m.setModValue(name, value, sentfromui);
      this.updatePowerGenerated();
    } else if (name === 'power') {
      // Power usage
      m.setModValue(name, value, sentfromui);
      this.updatePowerUsed();
    } else if (name === 'mass') {
      // Mass
      m.setModValue(name, value, sentfromui);
      this.recalculateMass();
      this.updateMovement();
      this.updateJumpStats();
    } else if (name === 'maxfuel') {
      m.setModValue(name, value, sentfromui);
      this.updateJumpStats();
    } else if (name === 'optmass') {
      m.setModValue(name, value, sentfromui);
      // Could be for any of thrusters, FSD or shield
      this.updateMovement();
      this.updateJumpStats();
      this.recalculateShield();
    } else if (name === 'optmul') {
      m.setModValue(name, value, sentfromui);
      // Could be for any of thrusters, FSD or shield
      this.updateMovement();
      this.updateJumpStats();
      this.recalculateShield();
    } else if (name === 'shieldboost') {
      m.setModValue(name, value, sentfromui);
      this.recalculateShield();
    } else if (name === 'hullboost' || name === 'hullreinforcement' || name === 'modulereinforcement') {
      m.setModValue(name, value, sentfromui);
      this.recalculateArmour();
    } else if (name === 'shieldreinforcement') {
      m.setModValue(name, value, sentfromui);
      this.recalculateShieldCells();
    } else if (name === 'burst' || name == 'burstrof' || name === 'clip' || name === 'damage' || name === 'distdraw' || name === 'jitter' || name === 'piercing' || name === 'range' || name === 'reload' || name === 'rof' || name === 'thermload') {
      m.setModValue(name, value, sentfromui);
      this.recalculateDps();
      this.recalculateHps();
      this.recalculateEps();
    } else if (name === 'explres' || name === 'kinres' || name === 'thermres') {
      m.setModValue(name, value, sentfromui);
      // Could be for shields or armour
      this.recalculateArmour();
      this.recalculateShield();
    } else if (name === 'engcap') {
      m.setModValue(name, value, sentfromui);
      // Might have resulted in a change in boostability
      this.updateMovement();
    } else {
      // Generic
      m.setModValue(name, value, sentfromui);
    }
  }

  /**
   * Builds/Updates the ship instance with the ModuleUtils[comps] passed in.
   * @param {Object} comps Collection of ModuleUtils used to build the ship
   * @param {array} priorities Slot priorities
   * @param {Array} enabled    Slot active/inactive
   * @param {Array} mods       Modifications
   * @param {Array} blueprints Blueprints for modifications
   * @return {this} The current ship instance for chaining
   */
  buildWith(comps, priorities, enabled, mods, blueprints) {
    let internal = this.internal,
        standard = this.standard,
        hps = this.hardpoints,
        cl = standard.length,
        i, l;

    // Reset Cumulative stats
    this.fuelCapacity = 0;
    this.cargoCapacity = 0;
    this.ladenMass = 0;
    this.armour = this.baseArmour;
    this.shield = this.baseShieldStrength;
    this.shieldCells = 0;
    this.totalCost = this.m.incCost ? this.m.discountedCost : 0;
    this.unladenMass = this.hullMass;
    this.totalDpe = 0;
    this.totalAbsDpe = 0;
    this.totalExplDpe = 0;
    this.totalKinDpe = 0;
    this.totalThermDpe = 0;
    this.totalDps = 0;
    this.totalAbsDps = 0;
    this.totalExplDps = 0;
    this.totalKinDps = 0;
    this.totalThermDps = 0;
    this.totalSDps = 0;
    this.totalAbsSDps = 0;
    this.totalExplSDps = 0;
    this.totalKinSDps = 0;
    this.totalThermSDps = 0;
    this.totalEps = 0;
    this.totalHps = 0;
    this.shieldExplRes = 0;
    this.shieldKinRes = 0;
    this.shieldThermRes = 0;
    this.hullExplRes = 0;
    this.hullKinRes = 0;
    this.hullThermRes = 0;

    this.bulkheads.m = null;
    this.useBulkhead(comps && comps.bulkheads ? comps.bulkheads : 0, true);
    this.bulkheads.m.mods = mods && mods[0] ? mods[0] : {};
    if (blueprints && blueprints[0]) {
      this.bulkheads.m.blueprint = getBlueprint(blueprints[0].fdname, this.bulkheads.m);
      this.bulkheads.m.blueprint.grade = blueprints[0].grade;
      this.bulkheads.m.blueprint.special = blueprints[0].special;
    } else {
      this.bulkheads.m.blueprint = {};
    }
    this.cargoHatch.priority = priorities ? priorities[0] * 1 : 0;
    this.cargoHatch.enabled = enabled ? enabled[0] * 1 : true;

    for (i = 0; i < cl; i++) {
      standard[i].cat = 0;
      standard[i].priority = priorities && priorities[i + 1] ? priorities[i + 1] * 1 : 0;
      standard[i].type = 'SYS';
      standard[i].m = null; // Resetting 'old' module if there was one
      standard[i].discountedCost = 0;
      if (comps) {
        let module = ModuleUtils.standard(i, comps.standard[i]);
        if (module != null) {
          module.mods = mods && mods[i + 1] ? mods[i + 1] : {};
          if (blueprints && blueprints[i + 1]) {
            module.blueprint = getBlueprint(blueprints[i + 1].fdname, module);
            module.blueprint.grade = blueprints[i + 1].grade;
            module.blueprint.special = blueprints[i + 1].special;
          } else {
            module.blueprint = {};
          }
        }
        this.use(standard[i], module, true);
      }
      standard[i].enabled = enabled ? enabled[i + 1] * 1 : true;
    }

    standard[1].type = 'ENG'; // Thrusters
    standard[2].type = 'ENG'; // FSD
    cl++; // Increase accounts for Cargo Scoop

    for (i = 0, l = hps.length; i < l; i++) {
      hps[i].cat = 1;
      hps[i].priority = priorities && priorities[cl + i] ? priorities[cl + i] * 1 : 0;
      hps[i].type = hps[i].maxClass ? 'WEP' : 'SYS';
      hps[i].m = null; // Resetting 'old' modul if there was one
      hps[i].discountedCost = 0;

      if (comps && comps.hardpoints[i] !== 0) {
        let module = ModuleUtils.hardpoints(comps.hardpoints[i]);
        if (module != null) {
          module.mods = mods && mods[cl + i] ? mods[cl + i] : {};
          if (blueprints && blueprints[cl + i]) {
            module.blueprint = getBlueprint(blueprints[cl + i].fdname, module);
            module.blueprint.grade = blueprints[cl + i].grade;
            module.blueprint.special = blueprints[cl + i].special;
          } else {
            module.blueprint = {};
          }
        }
        this.use(hps[i], module, true);
      }
      hps[i].enabled = enabled ? enabled[cl + i] * 1 : true;
    }

    cl += hps.length; // Increase accounts for hardpoints

    for (i = 0, l = internal.length; i < l; i++) {
      internal[i].cat = 2;
      internal[i].priority = priorities && priorities[cl + i] ? priorities[cl + i] * 1 : 0;
      internal[i].type = 'SYS';
      internal[i].m = null; // Resetting 'old' modul if there was one
      internal[i].discountedCost = 0;

      if (comps && comps.internal[i] !== 0) {
        let module = ModuleUtils.internal(comps.internal[i]);
        if (module != null) {
          module.mods = mods && mods[cl + i] ? mods[cl + i] : {};
          if (blueprints && blueprints[cl + i]) {
            module.blueprint = getBlueprint(blueprints[cl + i].fdname, module);
            module.blueprint.grade = blueprints[cl + i].grade;
            module.blueprint.special = blueprints[cl + i].special;
          } else {
            module.blueprint = {};
          }
        }
        this.use(internal[i], module, true);
      }
      internal[i].enabled = enabled ? enabled[cl + i] * 1 : true;
    }

    // Update aggragated stats
    if (comps) {
      this.updatePowerGenerated()
          .updatePowerUsed()
          .recalculateMass()
          .updateJumpStats()
          .recalculateShield()
          .recalculateShieldCells()
          .recalculateArmour()
          .recalculateDps()
          .recalculateEps()
          .recalculateHps()
          .updateMovement();
    }

    return this.updatePowerPrioritesString().updatePowerEnabledString().updateModificationsString();
  }

  /**
   * Updates an existing ship instance's slots with modules determined by the
   * code.
   *
   * @param {String}  serializedString  The string to deserialize
   * @return {this} The current ship instance for chaining
   */
  buildFrom(serializedString) {
    if (!serializedString) {
      // Empty serialized string; nothing to do
      return this;
    }

    let standard = new Array(this.standard.length),
        hardpoints = new Array(this.hardpoints.length),
        internal = new Array(this.internal.length),
        modifications = new Array(1 + this.standard.length + this.hardpoints.length + this.internal.length),
        blueprints = new Array(1 + this.standard.length + this.hardpoints.length + this.internal.length),
        parts = serializedString.split('.'),
        priorities = null,
        enabled = null,
        code = parts[0];

    // Code has a version ID embedded as the first character (if it is alphabetic)
    let version;
    if (code && code.match(/^[0-4]/)) {
      // Starting with bulkhead number is version 1
      version = 1;
    } else {
      // Version 2 (current version)
      version = 2;
      if (code) {
        code = code.substring(1);
      }
    }

    if (parts[1]) {
      enabled = LZString.decompressFromBase64(Utils.fromUrlSafe(parts[1])).split('');
    }

    if (parts[2]) {
      priorities = LZString.decompressFromBase64(Utils.fromUrlSafe(parts[2])).split('');
    }

    if (parts[3]) {
      const modstr = parts[3];
      if (modstr.match(':')) {
        this.decodeModificationsString(modstr, modifications);
      } else {
        try {
          this.decodeModificationsStruct(zlib.gunzipSync(new Buffer(Utils.fromUrlSafe(modstr), 'base64')), modifications, blueprints);
        } catch (err) {
          // Could be out-of-date URL; ignore
        }
      }
    }

    decodeToArray(code, internal, decodeToArray(code, hardpoints, decodeToArray(code, standard, 1)));

    if (version != 2) {
      // Alter as required due to changes in the (build) code from one version to the next
      this.upgradeInternals(internal, 1 + this.standard.length + this.hardpoints.length, priorities, enabled, modifications, blueprints, version);
    }
    
    return this.buildWith(
      {
        bulkheads: code.charAt(0) * 1,
        standard,
        hardpoints,
        internal
      },
      priorities,
      enabled,
      modifications,
      blueprints,
    );
  };

  /**
   * Empties all hardpoints and utility slots
   * @return {this} The current ship instance for chaining
   */
  emptyHardpoints() {
    for (let i = this.hardpoints.length; i--;) {
      this.use(this.hardpoints[i], null);
    }
    return this;
  }

  /**
   * Empties all Internal slots
   * @return {this} The current ship instance for chaining
   */
  emptyInternal() {
    for (let i = this.internal.length; i--;) {
      this.use(this.internal[i], null);
    }
    return this;
  }

  /**
   * Empties all Utility slots
   * @return {this} The current ship instance for chaining
   */
  emptyUtility() {
    for (let i = this.hardpoints.length; i--;) {
      if (!this.hardpoints[i].maxClass) {
        this.use(this.hardpoints[i], null);
      }
    }
    return this;
  }

  /**
   * Empties all hardpoints
   * @return {this} The current ship instance for chaining
   */
  emptyWeapons() {
    for (let i = this.hardpoints.length; i--;) {
      if (this.hardpoints[i].maxClass) {
        this.use(this.hardpoints[i], null);
      }
    }
    return this;
  }

  /**
   * Optimize for the lower mass build that can still boost and power the ship
   * without power management.
   * @param  {Object} m Standard Module overrides
   * @return {this} The current ship instance for chaining
   */
  optimizeMass(m) {
    return this.emptyHardpoints().emptyInternal().useLightestStandard(m);
  }

  /**
   * Include/Exclude a item/slot in cost calculations
   * @param {Object} item       Slot or item
   * @param {boolean} included  Cost included
   * @return {this} The current ship instance for chaining
   */
  setCostIncluded(item, included) {
    if (item.incCost != included && item.m) {
      this.totalCost += included ? item.discountedCost : -item.discountedCost;
    }
    item.incCost = included;
    return this;
  }

  /**
   * Set slot active/inactive
   * @param {Object} slot    Slot model
   * @param {boolean} enabled  True - active
   * @return {this} The current ship instance for chaining
   */
  setSlotEnabled(slot, enabled) {
    if (slot.enabled != enabled) { // Enabled state is changing
      slot.enabled = enabled;
      if (slot.m) {
        if (ModuleUtils.isShieldGenerator(slot.m.grp) || slot.m.grp === 'sb') {
          this.recalculateShield();
        }
        if (slot.m.grp === 'scb') {
          this.recalculateShieldCells();
        }

        this.updatePowerUsed();
        this.updatePowerEnabledString();

        if (slot.m.getDps()) {
          this.recalculateDps();
        }

        if (slot.m.getHps()) {
          this.recalculateHps();
        }

        if (slot.m.getEps()) {
          this.recalculateEps();
        }
      }
    }
    return this;
  }

  /**
   * Will change the priority of the specified slot if the new priority is valid
   * @param  {Object} slot        The slot to be updated
   * @param  {Number} newPriority The new priority to be set
   * @return {boolean}            Returns true if the priority was changed (within range)
   */
  setSlotPriority(slot, newPriority) {
    if (newPriority >= 0 && newPriority < this.priorityBands.length) {
      slot.priority = newPriority;
      this.updatePowerPrioritesString();

      if (slot.enabled) { // Only update power if the slot is enabled
        this.updatePowerUsed();
      }
      return true;
    }
    return false;
  }

  /**
   * Updates the ship's cumulative and aggregated stats based on the module change.
   * @param  {Object} slot            The slot being updated
   * @param  {Object} n               The new module (may be null)
   * @param  {Object} old             The old module (may be null)
   * @param  {boolean} preventUpdate  If true the global ship state will not be updated
   * @return {this}                   The ship instance (for chaining operations)
   */
  updateStats(slot, n, old, preventUpdate) {
    let powerGeneratedChange = slot == this.standard[0];
    let powerDistributorChange = slot == this.standard[4];
    let powerUsedChange = false;
    let dpsChanged = n && n.getDps() || old && old.getDps();
    let epsChanged = n && n.getEps() || old && old.getEps();
    let hpsChanged = n && n.getHps() || old && old.getHps();

    let armourChange = (slot === this.bulkheads) || (n && n.grp === 'hr') || (old && old.grp === 'hr') || (n && n.grp === 'mrp') || (old && old.grp === 'mrp');

    let shieldChange = (n && n.grp === 'bsg') || (old && old.grp === 'bsg') || (n && n.grp === 'psg') || (old && old.grp === 'psg') || (n && n.grp === 'sg') || (old && old.grp === 'sg') || (n && n.grp === 'sb') || (old && old.grp === 'sb');

    let shieldCellsChange = (n && n.grp === 'scb') || (old && old.grp === 'scb');

    if (old) {  // Old modul now being removed
      if (slot.incCost && old.cost) {
        this.totalCost -= old.cost * this.moduleCostMultiplier;
      }

      if (old.getPowerUsage() > 0 && slot.enabled) {
        powerUsedChange = true;
      }
    }

    if (n) {
      if (slot.incCost && n.cost) {
        this.totalCost += n.cost * this.moduleCostMultiplier;
      }

      if (n.power && slot.enabled) {
        powerUsedChange = true;
      }
    }

    if (!preventUpdate) {
      // Must recalculate mass first, as movement, jump etc. relies on it
      this.recalculateMass();
      if (dpsChanged) {
        this.recalculateDps();
      }
      if (epsChanged) {
        this.recalculateEps();
      }
      if (hpsChanged) {
        this.recalculateHps();
      }
      if (powerGeneratedChange) {
        this.updatePowerGenerated();
      }
      if (powerUsedChange) {
        this.updatePowerUsed();
      }
      if (armourChange) {
        this.recalculateArmour();
      }
      if (shieldChange) {
        this.recalculateShield();
      }
      if (shieldCellsChange) {
        this.recalculateShieldCells();
      }
      this.updateMovement();
      this.updateJumpStats();
    }
    return this;
  }

  /**
   * Calculate diminishing returns value, where values below a given limit are returned
   * as-is, and values between the lower and upper limit of the diminishing returns are
   * given at half value.
   * Commonly used for resistances.
   * @param {Number} val  The value
   * @param {Number} drll  The lower limit for diminishing returns
   * @param {Number} drul  The upper limit for diminishing returns
   * @return {this} The ship instance (for chaining operations)
   */
  diminishingReturns(val, drll, drul) {
    if (val < drll) {
      val = drll;
    }  else if (val < drul) {
      val = drul - (drul - val) / 2;
    }
    return val;
  }

  /**
   * Calculate damage per second and related items for weapons
   * @return {this} The ship instance (for chaining operations)
   */
  recalculateDps() {
    let totalDpe = 0;
    let totalAbsDpe = 0;
    let totalExplDpe = 0;
    let totalKinDpe = 0;
    let totalThermDpe = 0;
    let totalDps = 0;
    let totalAbsDps = 0;
    let totalExplDps = 0;
    let totalKinDps = 0;
    let totalThermDps = 0;
    let totalSDps = 0;
    let totalAbsSDps = 0;
    let totalExplSDps = 0;
    let totalKinSDps = 0;
    let totalThermSDps = 0;

    for (let slotNum in this.hardpoints) {
      const slot = this.hardpoints[slotNum];
      if (slot.m && slot.enabled && slot.type === 'WEP' && slot.m.getDps()) {
        const dpe = slot.m.getEps() === 0 ? 0 : slot.m.getDps() / slot.m.getEps();
        const dps = slot.m.getDps();
        const sdps = slot.m.getClip() ? (slot.m.getClip() * slot.m.getDps() / slot.m.getRoF()) / ((slot.m.getClip() / slot.m.getRoF()) + slot.m.getReload()) : dps;

        totalDpe += dpe;
        totalDps += dps;
        totalSDps += sdps;
        if (slot.m.getDamageDist()) {
          if (slot.m.getDamageDist().A) {
            totalAbsDpe += dpe * slot.m.getDamageDist().A;
            totalAbsDps += dps * slot.m.getDamageDist().A;
            totalAbsSDps += sdps * slot.m.getDamageDist().A;
          }
          if (slot.m.getDamageDist().E) {
            totalExplDpe += dpe * slot.m.getDamageDist().E;
            totalExplDps += dps * slot.m.getDamageDist().E;
            totalExplSDps += sdps * slot.m.getDamageDist().E;
          }
          if (slot.m.getDamageDist().K) {
            totalKinDpe += dpe * slot.m.getDamageDist().K;
            totalKinDps += dps * slot.m.getDamageDist().K;
            totalKinSDps += sdps * slot.m.getDamageDist().K;
          }
          if (slot.m.getDamageDist().T) {
            totalThermDpe += dpe * slot.m.getDamageDist().T;
            totalThermDps += dps * slot.m.getDamageDist().T;
            totalThermSDps += sdps * slot.m.getDamageDist().T;
          }
        }
      }
    }

    this.totalDpe = totalDpe;
    this.totalAbsDpe = totalAbsDpe;
    this.totalExplDpe = totalExplDpe;
    this.totalKinDpe = totalKinDpe;
    this.totalThermDpe = totalThermDpe;
    this.totalDps = totalDps;
    this.totalAbsDps = totalAbsDps;
    this.totalExplDps = totalExplDps;
    this.totalKinDps = totalKinDps;
    this.totalThermDps = totalThermDps;
    this.totalSDps = totalSDps;
    this.totalAbsSDps = totalAbsSDps;
    this.totalExplSDps = totalExplSDps;
    this.totalKinSDps = totalKinSDps;
    this.totalThermSDps = totalThermSDps;

    return this;
  }

  /**
   * Calculate heat per second for weapons
   * @return {this} The ship instance (for chaining operations)
   */
  recalculateHps() {
    let totalHps = 0;

    for (let slotNum in this.hardpoints) {
      const slot = this.hardpoints[slotNum];
      if (slot.m && slot.enabled && slot.type === 'WEP' && slot.m.getHps()) {
        totalHps += slot.m.getHps();
      }
    }
    this.totalHps = totalHps;

    return this;
  }

  /**
   * Calculate energy per second for weapons
   * @return {this} The ship instance (for chaining operations)
   */
  recalculateEps() {
    let totalEps = 0;

    for (let slotNum in this.hardpoints) {
      const slot = this.hardpoints[slotNum];
      if (slot.m && slot.enabled && slot.m.getEps() && slot.type === 'WEP') {
        totalEps += slot.m.getEps();
      }
    }
    this.totalEps = totalEps;

    return this;
  }

  /**
   * Update power calculations when amount generated changes
   * @return {this} The ship instance (for chaining operations)
   */
  updatePowerGenerated() {
    this.powerAvailable = this.standard[0].m.getPowerGeneration();
    return this;
  };

  /**
   * Update power calculations when amount consumed changes
   * @return {this} The ship instance (for chaining operations)
   */
  updatePowerUsed() {
    let bands = [
      { deployed: 0, retracted: 0, },
      { deployed: 0, retracted: 0, },
      { deployed: 0, retracted: 0, },
      { deployed: 0, retracted: 0, },
      { deployed: 0, retracted: 0, }
    ];

    if (this.cargoHatch.enabled) {
      bands[this.cargoHatch.priority].retracted += this.cargoHatch.m.getPowerUsage();
    }

    for (let slotNum in this.standard) {
      const slot = this.standard[slotNum];
      if (slot.m && slot.enabled) {
        bands[slot.priority][powerUsageType(slot, slot.m)] += slot.m.getPowerUsage();
      }
    }

    for (let slotNum in this.internal) {
      const slot = this.internal[slotNum];
      if (slot.m && slot.enabled) {
        bands[slot.priority][powerUsageType(slot, slot.m)] += slot.m.getPowerUsage();
      }
    }

    for (let slotNum in this.hardpoints) {
      const slot = this.hardpoints[slotNum];
      if (slot.m && slot.enabled) {
        bands[slot.priority][powerUsageType(slot, slot.m)] += slot.m.getPowerUsage();
      }
    }

    // Work out the running totals
    let prevRetracted = 0, prevDeployed = 0;
    for (let i = 0, l = bands.length; i < l; i++) {
      let band = bands[i];
      prevRetracted = band.retractedSum = prevRetracted + band.retracted;
      prevDeployed = band.deployedSum = prevDeployed + band.deployed + band.retracted;
    }

    // Update global stats
    this.powerRetracted = prevRetracted;
    this.powerDeployed = prevDeployed;
    this.priorityBands = bands;

    return this;
  }

  /**
   * Eecalculate mass
   * @return {this} The ship instance (for chaining operations)
   */
  recalculateMass() {
    let unladenMass = this.hullMass;
    let cargoCapacity = 0;
    let fuelCapacity = 0;

    unladenMass += this.bulkheads.m.getMass();

    for (let slotNum in this.standard) {
      const slot = this.standard[slotNum];
      if (slot.m) {
        unladenMass += slot.m.getMass();
        if (slot.m.grp === 'ft') {
          fuelCapacity += slot.m.fuel;
        }
      }
    }

    for (let slotNum in this.internal) {
      const slot = this.internal[slotNum];
      if (slot.m) {
        unladenMass += slot.m.getMass();
        if (slot.m.grp === 'ft') {
          fuelCapacity += slot.m.fuel;
        } else if (slot.m.grp === 'cr') {
          cargoCapacity += slot.m.cargo;
        }
      }
    }

    for (let slotNum in this.hardpoints) {
      const slot = this.hardpoints[slotNum];
      if (slot.m) {
        unladenMass += slot.m.getMass();
      }
    }

    // Update global stats
    this.unladenMass = unladenMass;
    this.cargoCapacity = cargoCapacity;
    this.fuelCapacity = fuelCapacity;
    this.ladenMass = unladenMass + fuelCapacity + cargoCapacity;

    return this;
  }

  /**
   * Update movement values
   * @return {this} The ship instance (for chaining operations)
   */
  updateMovement() {
    this.speeds = Calc.speed(this.unladenMass + this.fuelCapacity, this.speed, this.standard[1].m, this.pipSpeed);
    this.topSpeed = this.speeds[4];
    this.topBoost = this.canBoost(0, 0) ? this.speeds[4] * this.boost / this.speed : 0;

    this.pitches = Calc.pitch(this.unladenMass + this.fuelCapacity, this.pitch, this.standard[1].m, this.pipSpeed);
    this.topPitch = this.pitches[4];

    this.rolls = Calc.roll(this.unladenMass + this.fuelCapacity, this.roll, this.standard[1].m, this.pipSpeed);
    this.topRoll = this.rolls[4];

    this.yaws = Calc.yaw(this.unladenMass + this.fuelCapacity, this.yaw, this.standard[1].m, this.pipSpeed);
    this.topYaw = this.yaws[4];

    return this;
  }

  /**
   * Update shield
   * @return {this} The ship instance (for chaining operations)
   */
  recalculateShield() {
    // Obtain shield metrics with 0 pips to sys (parts affected by SYS aren't used here)
    const metrics = Calc.shieldMetrics(this, 0);

    this.shield = metrics.generator ? metrics.generator + metrics.boosters : 0;
    this.shieldExplRes = this.shield > 0 ? 1 - metrics.explosive.total : null;
    this.shieldKinRes = this.shield > 0 ?  1 - metrics.kinetic.total : null;
    this.shieldThermRes = this.shield > 0 ?  1 - metrics.thermal.total : null;
    return this;
  }

  /**
   * Update shield cells
   * @return {this} The ship instance (for chaining operations)
   */
  recalculateShieldCells() {
    let shieldCells = 0;

    for (let slot of this.internal) {
      if (slot.m && slot.m.grp == 'scb') {
        // There is currently a bug with Elite where you can have a clip > 1 thanks to engineering but it doesn't do anything,
        // so we need to hard-code clip to 1
        shieldCells += slot.m.getShieldReinforcement() * slot.m.getDuration() * (slot.m.getAmmo() + 1);
      }
    }

    this.shieldCells = shieldCells;

    return this;
  }

  /**
   * Update armour and hull resistances
   * @return {this} The ship instance (for chaining operations)
   */
  recalculateArmour() {
    // Armour from bulkheads
    let bulkhead = this.bulkheads.m;
    let armour = this.baseArmour + (this.baseArmour * bulkhead.getHullBoost());
    let modulearmour = 0;
    let moduleprotection = 1;
    let hullExplRes = 1 - bulkhead.getExplosiveResistance();
    const hullExplResDRStart = hullExplRes * 0.7;
    const hullExplResDREnd = hullExplRes * 0;
    let hullKinRes = 1 - bulkhead.getKineticResistance();
    const hullKinResDRStart = hullKinRes * 0.7;
    const hullKinResDREnd = hullKinRes * 0;
    let hullThermRes = 1 - bulkhead.getThermalResistance();
    const hullThermResDRStart = hullThermRes * 0.7;
    const hullThermResDREnd = hullThermRes * 0;

    // Armour from HRPs and module armour from MRPs
    for (let slot of this.internal) {
      if (slot.m && slot.m.grp == 'hr') {
        armour += slot.m.getHullReinforcement();
        // Hull boost for HRPs is applied against the ship's base armour
        armour += this.baseArmour * slot.m.getModValue('hullboost') / 10000;

        hullExplRes *= (1 - slot.m.getExplosiveResistance());
        hullKinRes *= (1 - slot.m.getKineticResistance());
        hullThermRes *= (1 - slot.m.getThermalResistance());
      }
      if (slot.m && slot.m.grp == 'mrp') {
        modulearmour += slot.m.getIntegrity();
        moduleprotection = moduleprotection * (1 - slot.m.getProtection());
      }
    }
    moduleprotection = 1 - moduleprotection;

    this.armour = armour;
    this.modulearmour = modulearmour;
    this.moduleprotection = moduleprotection;
    this.hullExplRes = 1 - this.diminishingReturns(hullExplRes, hullExplResDREnd, hullExplResDRStart);
    this.hullKinRes = 1 - this.diminishingReturns(hullKinRes, hullKinResDREnd, hullKinResDRStart);
    this.hullThermRes = 1 - this.diminishingReturns(hullThermRes, hullThermResDREnd, hullThermResDRStart);

    return this;
  }

  /**
   * Jump Range and total range calculations
   * @return {this} The ship instance (for chaining operations)
   */
  updateJumpStats() {
    let fsd = this.standard[2].m;   // Frame Shift Drive;
    let { unladenMass, fuelCapacity } = this;
    this.unladenRange = this.calcUnladenRange(); // Includes fuel weight for jump
    this.fullTankRange = Calc.jumpRange(unladenMass + fuelCapacity, fsd); // Full Tank
    this.ladenRange = this.calcLadenRange(); // Includes full tank and caro
    this.unladenFastestRange = Calc.totalJumpRange(unladenMass + this.fuelCapacity, fsd, fuelCapacity);
    this.ladenFastestRange = Calc.totalJumpRange(unladenMass + this.fuelCapacity + this.cargoCapacity, fsd, fuelCapacity);
    this.maxJumpCount = Math.ceil(fuelCapacity / fsd.getMaxFuelPerJump());
    return this;
  }

  /**
   * Update the serialized power priorites string
   * @return {this} The ship instance (for chaining operations)
   */
  updatePowerPrioritesString() {
    let priorities = [this.cargoHatch.priority];

    for (let slot of this.standard) {
      priorities.push(slot.priority);
    }
    for (let slot of this.hardpoints) {
      priorities.push(slot.priority);
    }
    for (let slot of this.internal) {
      priorities.push(slot.priority);
    }

    this.serialized.priorities = LZString.compressToBase64(priorities.join(''));
    return this;
  }

  /**
   * Update the serialized power active/inactive string
   * @return {this} The ship instance (for chaining operations)
   */
  updatePowerEnabledString() {
    let enabled = [this.cargoHatch.enabled ? 1 : 0];

    for (let slot of this.standard) {
      enabled.push(slot.enabled ? 1 : 0);
    }
    for (let slot of this.hardpoints) {
      enabled.push(slot.enabled ? 1 : 0);
    }
    for (let slot of this.internal) {
      enabled.push(slot.enabled ? 1 : 0);
    }

    this.serialized.enabled = LZString.compressToBase64(enabled.join(''));
    return this;
  }

  /**
   * Populate the modifications array with modification values from the code
   * @param {String} code    Serialized modification code
   * @param {Array}  arr     Modification array
   */
  decodeModificationsString(code, arr) {
    let moduleMods = code.split(',');
    for (let i = 0; i < arr.length; i++) {
      arr[i] = {};
      if (moduleMods.length > i && moduleMods[i] != '') {
        let mods = moduleMods[i].split(';');
        for (let j = 0; j < mods.length; j++) {
          let modElements = mods[j].split(':');
          if (modElements[0].match('[0-9]+')) {
            const modification = _.find(Modifications.modifications, function(o) { return o.id === modElements[0]; });
            if (modification != null) arr[i][modification.name] = Number(modElements[1]);
          } else {
            arr[i][modElements[0]] = Number(modElements[1]);
          }
        }
      }
    }
  }

  /**
   * Update the modifications string.
   * This is a binary structure.  It starts with a byte that identifies a slot, with bulkheads being ID 0 and moving through
   * standard modules, hardpoints, and finally internal modules.  It then contains one or more modifications, with each
   * modification being a one-byte modification ID and at two-byte modification value.  Modification IDs are based on the array
   * in Modifications.modifications.  The list of modifications is terminated by a modification ID of -1.  The structure then repeats
   * for the next module, and the next, and is terminated by a slot ID of -1.
   * @return {this} The ship instance (for chaining operations)
   */
  updateModificationsString() {
    // Start off by gathering the information that we need
    let slots = new Array();
    let blueprints = new Array();
    let specials = new Array();

    let bulkheadMods = new Array();
    let bulkheadBlueprint = null;
    if (this.bulkheads.m && this.bulkheads.m.mods) {
      for (let modKey in this.bulkheads.m.mods) {
        // Filter out invalid modifications
        if (Modifications.modules['bh'] && Modifications.modules['bh'].modifications.indexOf(modKey) != -1) {
          bulkheadMods.push({ id: Modifications.modifications[modKey].id, value: this.bulkheads.m.getModValue(modKey, true) });
        }
      }
      bulkheadBlueprint = this.bulkheads.m.blueprint;
    }
    slots.push(bulkheadMods);
    blueprints.push(bulkheadBlueprint);
    specials.push(bulkheadBlueprint ? bulkheadBlueprint.special : null);

    for (let slot of this.standard) {
      let slotMods = new Array();
      if (slot.m && slot.m.mods) {
        for (let modKey in slot.m.mods) {
          // Filter out invalid modifications
          if (Modifications.modules[slot.m.grp] && Modifications.modules[slot.m.grp].modifications.indexOf(modKey) != -1) {
            slotMods.push({ id: Modifications.modifications[modKey].id, value: slot.m.getModValue(modKey, true) });
          }
        }
      }
      slots.push(slotMods);
      blueprints.push(slot.m ? slot.m.blueprint : null);
      specials.push(slot.m && slot.m.blueprint ? slot.m.blueprint.special : null);
    }

    for (let slot of this.hardpoints) {
      let slotMods = new Array();
      if (slot.m && slot.m.mods) {
        for (let modKey in slot.m.mods) {
          // Filter out invalid modifications
          if (Modifications.modules[slot.m.grp] && Modifications.modules[slot.m.grp].modifications.indexOf(modKey) != -1) {
            slotMods.push({ id: Modifications.modifications[modKey].id, value: slot.m.getModValue(modKey, true) });
          }
        }
      }
      slots.push(slotMods);
      blueprints.push(slot.m ? slot.m.blueprint : null);
      specials.push(slot.m && slot.m.blueprint ? slot.m.blueprint.special : null);
    }

    for (let slot of this.internal) {
      let slotMods = new Array();
      if (slot.m && slot.m.mods) {
        for (let modKey in slot.m.mods) {
          // Filter out invalid modifications
          if (Modifications.modules[slot.m.grp] && Modifications.modules[slot.m.grp].modifications.indexOf(modKey) != -1) {
            slotMods.push({ id: Modifications.modifications[modKey].id, value: slot.m.getModValue(modKey, true) });
          }
        }
      }
      slots.push(slotMods);
      blueprints.push(slot.m ? slot.m.blueprint : null);
      specials.push(slot.m && slot.m.blueprint ? slot.m.blueprint.special : null);
    }

    // Now work out the size of the binary buffer from our modifications array
    let bufsize = 0;
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].length > 0 || (blueprints[i] && blueprints[i].id)) {
        // Length is 1 for the slot ID, 5 for each modification, 1 for the end marker of the modifications and 1 for the end marker of the slot
        bufsize = bufsize + 1 + (5 * slots[i].length) + 1 + 1;

        if (blueprints[i] && blueprints[i].id) {
          // Additional 10 for the blueprint and grade
          bufsize += 10;
        }

        if (specials[i]) {
          // Additional 5 for each special
          bufsize += 5;
        }
      }
    }

    if (bufsize > 0) {
      bufsize = bufsize + 1; // For end marker
      // Now create and populate the buffer
      let buffer = Buffer.alloc(bufsize);
      let curpos = 0;
      let i = 0;
      for (let slot of slots) {
        if (slot.length > 0 || (blueprints[i] && blueprints[i].id)) {
          buffer.writeInt8(i, curpos++);
          if (blueprints[i] && blueprints[i].id) {
            buffer.writeInt8(MODIFICATION_ID_BLUEPRINT, curpos++);
            buffer.writeInt32LE(blueprints[i].id, curpos);
            curpos += 4;
            buffer.writeInt8(MODIFICATION_ID_GRADE, curpos++);
            buffer.writeInt32LE(blueprints[i].grade, curpos);
            curpos += 4;
          }
          if (specials[i]) {
            buffer.writeInt8(MODIFICATION_ID_SPECIAL, curpos++);
            buffer.writeInt32LE(specials[i].id, curpos);
            curpos += 4;
          }
          for (let slotMod of slot) {
            buffer.writeInt8(slotMod.id, curpos++);
            if (isNaN(slotMod.value)) {
              // Need to write the string with exactly four characters, so pad with whitespace
              buffer.write(('    ' + slotMod.value).slice(-4), curpos, 4);
            } else {
              buffer.writeInt32LE(slotMod.value, curpos);
            }
            // const modification = _.find(Modifications.modifications, function(o) { return o.id === slotMod.id; });
            // console.log('ENCODE Slot ' + i + ': ' + modification.name + ' = ' + slotMod.value);
            curpos += 4;
          }
          buffer.writeInt8(MODIFICATION_ID_DONE, curpos++);
        }
        i++;
      }
      if (curpos > 0) {
        buffer.writeInt8(SLOT_ID_DONE, curpos++);
      }

      this.serialized.modifications = zlib.gzipSync(buffer).toString('base64');
    } else {
      this.serialized.modifications = null;
    }
    return this;
  }

  /**
   * Populate the modifications array with modification values from the code.
   * See updateModificationsString() for details of the structure.
   * @param {String} buffer         Buffer holding modification info
   * @param {Array}  modArr         Modification array
   * @param {Array}  blueprintArr    Blueprint array
   */
  decodeModificationsStruct(buffer, modArr, blueprintArr) {
    let curpos = 0;
    let slot = buffer.readInt8(curpos++);
    while (slot != SLOT_ID_DONE) {
      let modifications = {};
      let blueprint = {};
      let modificationId = buffer.readInt8(curpos++);
      while (modificationId != MODIFICATION_ID_DONE) {
        let modificationValue;
        if (modificationId === 40) {
          // Type is special, in that it's a character string
          modificationValue = buffer.toString('utf8', curpos, curpos + 4).trim();
        } else {
          modificationValue = buffer.readInt32LE(curpos);
        }
        curpos += 4;
        // There are a number of 'special' modification IDs, check for them here
        if (modificationId === MODIFICATION_ID_BLUEPRINT) {
          if (modificationValue !== 0) {
            blueprint = Object.assign(blueprint, _.find(Modifications.blueprints, function(o) { return o.id === modificationValue; }));
          }
        } else if (modificationId === MODIFICATION_ID_GRADE) {
          if (modificationValue !== 0) {
            blueprint.grade = modificationValue;
          }
        } else if (modificationId === MODIFICATION_ID_SPECIAL) {
          blueprint.special = _.find(Modifications.specials, function(o) { return o.id === modificationValue; });
        } else {
          const modification = _.find(Modifications.modifications, function(o) { return o.id === modificationId; });
          // console.log('DECODE Slot ' + slot + ': ' + modification.name + ' = ' + modificationValue);
          modifications[modification.name] = modificationValue;
        }
        modificationId = buffer.readInt8(curpos++);
      }
      modArr[slot] = modifications;
      if (blueprint.id) {
        blueprintArr[slot] = blueprint;
      }
      slot = buffer.readInt8(curpos++);
    }
  }

  /**
   * Update a slot with a the modul if the id is different from the current id for this slot.
   * Has logic handling ModuleUtils that you may only have 1 of (Shield Generator or Refinery).
   *
   * @param {Object}  slot            The modul slot
   * @param {Object}  mdef            Properties for the selected modul
   * @param {boolean} preventUpdate   If true, do not update aggregated stats
   * @return {this} The ship instance (for chaining operations)
   */
  use(slot, mdef, preventUpdate) {
    // See if the module passed in is really a module or just a definition, and fix it accordingly so that we have a module instance
    let m;
    if (mdef == null) {
      m = null;
    } else if (mdef instanceof Module) {
      m = mdef;
    } else {
      m = new Module({ grp: mdef.grp, id: mdef.id });
    }

    if (slot.m != m) { // Selecting a different modul
      // Slot is an internal slot, is not being emptied, and the selected modul group/type must be of unique
      if (slot.cat == 2 && m && UNIQUE_MODULES.indexOf(m.grp) != -1) {
        // Find another internal slot that already has this type/group installed
        let similarSlot = this.findInternalByGroup(m.grp);
        // If another slot has an installed modul with of the same type
        if (!preventUpdate && similarSlot && similarSlot !== slot) {
          this.updateStats(similarSlot, null, similarSlot.m);
          similarSlot.m = null;  // Empty the slot
          similarSlot.discountedCost = 0;
        }
      }
      let oldModule = slot.m;
      slot.m = m;
      slot.enabled = true;
      slot.discountedCost = (m && m.cost) ? m.cost * this.moduleCostMultiplier : 0;
      this.updateStats(slot, m, oldModule, preventUpdate);

      switch (slot.cat) {
        case 0: this.serialized.standard = null; break;
        case 1: this.serialized.hardpoints = null; break;
        case 2: this.serialized.internal = null;
      }
    }
    return this;
  }

  /**
   * Mount the specified bulkhead type (index)
   * @param  {Number} index           Bulkhead index [0-4]
   * @param  {boolean} preventUpdate  Prevent summary update
   * @return {this} The ship instance (for chaining operations)
   */
  useBulkhead(index, preventUpdate) {
    let oldBulkhead = this.bulkheads.m;
    this.bulkheads.m = this.availCS.getBulkhead(index);
    this.bulkheads.discountedCost = this.bulkheads.m.cost * this.moduleCostMultiplier;
    this.updateStats(this.bulkheads, this.bulkheads.m, oldBulkhead, preventUpdate);
    this.serialized.standard = null;
    return this;
  }

  /**
   * Set all standard slots to use the speficied rating and class based on
   * the slot's max class
   * @param  {String} rating Module Rating (A-E)
   * @return {this} The ship instance (for chaining operations)
   */
  useStandard(rating) {
    for (let i = this.standard.length - 1; i--;) { // All except Fuel Tank
      let id = this.standard[i].maxClass + rating;
      this.use(this.standard[i], ModuleUtils.standard(i, id));
    }
    return this;
  }

  /**
   * Calculate the lowest possible mass for this ship.
   * @param  {Object} m Module override set (standard type => Module)
   * @return {number} The lowest possible mass for this ship
   */
  calcLowestPossibleMass(m) {
    m = m || {};

    let mass = this.hullMass;
    mass += m.pp ? m.pp.getMass() : ModuleUtils.standard(0, '2D').getMass();
    mass += m.th ? m.th.getMass() : ModuleUtils.standard(1, '2D').getMass();
    mass += m.fsd ? m.fsd.getMass() : ModuleUtils.standard(2, '2D').getMass();
    mass += m.ls ? m.ls.getMass() : ModuleUtils.standard(3, this.standard[3].maxClass + 'D').getMass() * 0.3; // Lightweight grade 4 mod reduces mass by up to 70%
    mass += m.pd ? m.pd.getMass() : ModuleUtils.standard(4, '1D').getMass();
    mass += m.s ? m.s.getMass() : ModuleUtils.standard(5, this.standard[5].maxClass + 'D').getMass() * 0.2; // Lightweight grade 5 mod reduces mass by up to 80%
    // Ignore fuel tank as it could be empty
    return mass;
  }

  /**
   * Use the lightest standard ModuleUtils unless otherwise specified
   * @param  {Object} m Module override set (standard type => module ID)
   * @return {this} The ship instance (for chaining operations)
   */
  useLightestStandard(m) {
    m = m || {};

    let standard = this.standard,
        // Find lightest Power Distributor that can still boost;
        pd = m.pd ? ModuleUtils.standard(4, m.pd) : this.availCS.lightestPowerDist(this.boostEnergy),
        fsd = ModuleUtils.standard(2, m.fsd || standard[2].maxClass + 'A'),
        ls = ModuleUtils.standard(3, m.ls || standard[3].maxClass + 'D'),
        s = ModuleUtils.standard(5, m.s || standard[5].maxClass + 'D'),
        ft = m.ft ? ModuleUtils.standard(6, m.ft) : standard[6].m, // Use existing fuel tank unless specified
        updated;

    this.useBulkhead(0)
        .use(standard[2], fsd)   // FSD
        .use(standard[3], ls)    // Life Support
        .use(standard[5], s)     // Sensors
        .use(standard[4], pd)    // Power Distributor
        .use(standard[6], ft);   // Fuel Tank

    // Turn off nearly everything
    if (m.fsdDisabled) this.setSlotEnabled(this.standard[2], false);
    if (m.pdDisabled) this.setSlotEnabled(this.standard[4], false);
    if (m.sDisabled) this.setSlotEnabled(this.standard[5], false);

    // Thrusters and Powerplant must be determined after all other ModuleUtils are mounted
    // Loop at least once to determine absolute lightest PD and TH
    do {
      updated = false;
      // Find lightest Thruster that still works for the ship at max mass
      let th = m.th ? ModuleUtils.standard(1, m.th) : this.availCS.lightestThruster(this.ladenMass);
      if (!isEqual.isEqual(th, standard[1].m)) {
        this.use(standard[1], th);
        updated = true;
      }
      // Find lightest Power plant that can power the ship
      let pp = m.pp ? ModuleUtils.standard(0, m.pp) : this.availCS.lightestPowerPlant(Math.max(this.powerRetracted, this.powerDeployed), m.ppRating);

      if (!isEqual.isEqual(pp, standard[0].m)) {
        this.use(standard[0], pp);
        updated = true;
      }
    } while (updated);

    return this;
  }

  /**
   * Fill all utility slots with the specified module
   * @param  {String} group   Group name
   * @param  {String} rating  Rating [A-I]
   * @param  {String} name    Module name
   * @param  {boolean} clobber Overwrite non-empty slots
   * @return {this} The ship instance (for chaining operations)
   */
  useUtility(group, rating, name, clobber) {
    let m = ModuleUtils.findHardpoint(group, 0, rating, name);
    for (let i = this.hardpoints.length; i--;) {
      if ((clobber || !this.hardpoints[i].m) && !this.hardpoints[i].maxClass) {
        this.use(this.hardpoints[i], m);
      }
    }
    return this;
  }

  /**
   * [useWeapon description]
   * @param  {[type]} group   [description]
   * @param  {[type]} mount   [description]
   * @param  {[type]} missile [description]
   * @param  {boolean} clobber Overwrite non-empty slots
   * @return {this} The ship instance (for chaining operations)
   */
  useWeapon(group, mount, missile, clobber) {
    let hps = this.hardpoints;
    for (let i = hps.length; i--;) {
      if (hps[i].maxClass) {
        let size = hps[i].maxClass, m;
        do {
          m = ModuleUtils.findHardpoint(group, size, null, null, mount, missile);
          if ((clobber || !hps[i].m) && m) {
            this.use(hps[i], m);
            break;
          }
        } while (!m && (--size > 0));
      }
    }
    return this;
  }

  /**
   * Upgrade information about internals with version changes
   * @param {array} internals     the internals from the ship code
   * @param {int}   offset        the offset of the internals information in the priorities etc. arrays
   * @param {array} priorities    the existing priorities arrray
   * @param {array} enableds      the existing enableds arrray
   * @param {array} modifications the existing modifications arrray
   * @param {array} blueprints    the existing blueprints arrray
   * @param {int}   version       the version of the information
   */
  upgradeInternals(internals, offset, priorities, enableds, modifications, blueprints, version) {
    if (version == 1) {
      // Version 2 reflects the addition of military slots.  this means that we need to juggle the internals and their
      // associated information around to make holes in the appropriate places
      for (let slotId = 0; slotId < this.internal.length; slotId++) {
        if (this.internal[slotId].eligible && this.internal[slotId].eligible.mrp) {
          // Found a restricted military slot - push all of the existing items down one to compensate for the fact that they didn't exist before now
          internals.push.apply(internals, [0].concat(internals.splice(slotId).slice(0, -1)));

          const offsetSlotId = offset + slotId;

          // Same for priorities etc.
          if (priorities) { priorities.push.apply(priorities, [0].concat(priorities.splice(offsetSlotId))); }
          if (enableds) { enableds.push.apply(enableds, [1].concat(enableds.splice(offsetSlotId))); }
          if (modifications) { modifications.push.apply(modifications, [null].concat(modifications.splice(offsetSlotId).slice(0, -1))); }
          if (blueprints) { blueprints.push.apply(blueprints, [null].concat(blueprints.splice(offsetSlotId).slice(0, -1))); }
        }
      }
      // Ensure that all items are the correct length
      internals.splice(Ships[this.id].slots.internal.length);
    }
  }
}
