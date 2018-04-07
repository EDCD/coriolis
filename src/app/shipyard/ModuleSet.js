import Module from './Module';
import { BulkheadNames } from './Constants';

/**
 * Filter eligble modules based on parameters
 * @param  {Array}  arr       Available modules array
 * @param  {number} maxClass  Max class
 * @param  {number} minClass  Minimum class
 * @param  {number} mass      Mass
 * @return {Array}            Fitlered module subset
 */
function filter(arr, maxClass, minClass, mass) {
  return arr.filter(m => m.class <= maxClass && m.class >= minClass && (m.maxmass === undefined || mass <= m.maxmass));
}

/**
 * The available module set for a specific ship
 */
export default class ModuleSet {

  /**
   * Instantiate the module set
   * @param  {Object} modules        All Modules
   * @param  {Object} shipData       Ship Specifications Data (see coriolis-data/Ships)
   */
  constructor(modules, shipData) {
    let maxInternal = isNaN(shipData.slots.internal[0]) ? shipData.slots.internal[0].class : shipData.slots.internal[0];
    let mass = shipData.properties.hullMass + 6.5;
    let maxStandardArr = shipData.slots.standard;
    let maxHardPoint = shipData.slots.hardpoints[0];
    let stnd = modules.standard;
    this.mass = mass;
    this.standard = {};
    this.internal = {};
    this.hardpoints = {};
    this.hpClass = {};
    this.intClass = {};

    this.bulkheads = shipData.bulkheads.map((b, i) => {
      return Object.assign(new Module(), { grp: 'bh', id: i, name: BulkheadNames[i], index: i, class: '', rating: '' }, b);
    });

    this.standard[0] = filter(stnd.pp, maxStandardArr[0], 0, mass);  // Power Plant
    this.standard[2] = filter(stnd.fsd, maxStandardArr[2], 0, mass);  // FSD
    this.standard[4] = filter(stnd.pd, maxStandardArr[4], 0, mass);  // Power Distributor
    this.standard[6] = filter(stnd.ft, maxStandardArr[6], 0, mass);  // Fuel Tank
    // Thrusters, filter modules by class only (to show full list of ratings for that class)
    let minThrusterClass = stnd.t.reduce((clazz, th) => (th.maxmass >= mass && th.class < clazz) ? th.class : clazz, maxStandardArr[1]);
    this.standard[1] = filter(stnd.t, maxStandardArr[1], minThrusterClass, 0);  // Thrusters
    // Slots where module class must be equal to slot class
    this.standard[3] = filter(stnd.ls, maxStandardArr[3], maxStandardArr[3], 0);     // Life Supprt
    this.standard[5] = filter(stnd.s, maxStandardArr[5], maxStandardArr[5], mass);  // Sensors

    for (let h in modules.hardpoints) {
      this.hardpoints[h] = filter(modules.hardpoints[h], maxHardPoint, 0, mass);
    }

    for (let g in modules.internal) {
      this.internal[g] = filter(modules.internal[g], maxInternal, 0, mass);
    }
  }

  /**
   * Get the specified bulkhead
   * @param  {integer} index Bulkhead index
   * @return {Object}      Bulkhead module details
   */
  getBulkhead(index) {
    return this.bulkheads[index] ? new Module({ template: this.bulkheads[index] }) : null;
  }

  /**
   * Determine the modules that areeligible for an internal slot
   * @param  {Object} ship      The ship
   * @param  {integer} c        The max class module that can be mounted in the slot
   * @param  {Object} eligible) The map of eligible internal groups
   * @return {object}           A map of all eligible modules by group
   */
  getInts(ship, c, eligible) {
    let o = {};
    for (let key in this.internal) {
      if (eligible && !eligible[key]) {
        continue;
      }
      if (key == 'pcq' && !(ship.luxuryCabins && ship.luxuryCabins  === true)) {
        continue;
      }
      if (key == 'fh' && !(ship.fighterHangars && ship.fighterHangars  === true)) {
        continue;
      }
      let data = filter(this.internal[key], c, 0, this.mass);
      if (data.length) {  // If group is not empty
        o[key] = data;
      }
    }
    return o;
  }

  /**
   * Determining the modules that are eligible for an hardpoint slot
   * @param  {integer} c        The max class module that can be mounted in the slot
   * @param  {Object} eligible) The map of eligible hardpoint groups
   * @return {object}           A map of all eligible modules by group
   */
  getHps(c, eligible) {
    let o = {};
    for (let key in this.hardpoints) {
      if (eligible && !eligible[key]) {
        continue;
      }
      let data = filter(this.hardpoints[key], c, c ? 1 : 0, this.mass);
      if (data.length) {  // If group is not empty
        o[key] = data;
      }
    }
    return o;
  }

  /**
   * Find the lightest Power Distributor that provides sufficient
   * energy to boost.
   * @param  {number} boostEnergy The energy that is required to boost
   * @return {Object}             Power Distributor
   */
  lightestPowerDist(boostEnergy) {
    let pd = this.standard[4][0];
    for (let p of this.standard[4]) {
      if (p.mass < pd.mass && p.engcap > boostEnergy) {
        pd = p;
      }
    }
    return new Module({ template: pd });
  };

  /** Find the power distributor that matches the requirements
   * @param  {Object} requirements The requirements to be met (currently only support 'weprate')
   * @return {Object}              Power distributor
   */
  matchingPowerDist(requirements) {
    let pd = this.standard[4][0];
    for (let p of this.standard[4]) {
      if (p.weprate >= requirements.weprate || p.weprate >= pd.weprate) {
        pd = p;
      }
    }
    return new Module({ template: pd });
  }

  /**
   * Finds the lightest Thruster that can handle the specified tonnage
   * @param  {number} ladenMass Ship laden mass (mass + cargo + fuel)
   * @return {Object}           Thruster
   */
  lightestThruster(ladenMass) {
    let th = this.standard[1][0];

    for (let t of this.standard[1]) {
      if (t.mass < th.mass && t.maxmass >= ladenMass) {
        th = t;
      }
    }
    return new Module({ template: th });
  };

  /**
   * Finds the lightest usable Shield Generator
   * @param  {number} hullMass  Ship hull mass
   * @return {Object}           Thruster
   */
  lightestShieldGenerator(hullMass) {
    let sg = this.internal.sg[0];

    for (let s of this.internal.sg) {
      if (s.mass < sg.mass && s.maxmass > hullMass) {
        sg = s;
      }
    }
    return new Module({ template: sg });
  };

  /**
   * Find the lightest Power Plant that provides sufficient power
   * @param  {number} powerNeeded Power requirements in MJ
   * @param  {string} rating      The optional rating of the power plant
   * @return {Object}             Power Plant
   */
  lightestPowerPlant(powerNeeded, rating) {
    let pp = this.standard[0][0];

    for (let p of this.standard[0]) {
      // Provides enough power, is lighter or the same mass as current power plant but better output/efficiency
      if (p.pgen >= powerNeeded && (p.mass < pp.mass || (p.mass == pp.mass && p.pgen > pp.pgen)) && (!rating || rating == p.rating)) {
        pp = p;
      }
    }
    return new Module({ template: pp });
  }
}
