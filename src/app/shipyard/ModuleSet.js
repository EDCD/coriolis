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
 * Determine whether a module is fittable on a given ship, honouring a module's
 * optional `ship` restriction. Frontier restricts some modules to a specific
 * ship or set of ships (e.g. the Mk II SCO FSD and Mk II Gravity Optimised
 * Thrusters are Caspian Explorer only; the Mk II Agile Boost Thrusters are
 * Kestrel Mk II only). A module with no `ship` field fits any ship. The `ship`
 * field may be a single ship id string or an array of ship ids.
 * @param  {Object}  m       A module template
 * @param  {String}  shipId  The coriolis ship id being outfitted
 * @return {Boolean}         True if the module is allowed on this ship
 */
function shipAllowsModule(m, shipId) {
  if (!m || m.ship === undefined || m.ship === null) return true;
  const allowed = Array.isArray(m.ship) ? m.ship : [m.ship];
  return allowed.indexOf(shipId) !== -1;
}

/**
 * Filter an array of modules by a ship's `ship` restriction field.
 * @param  {Array}   arr     Modules
 * @param  {String}  shipId  The coriolis ship id being outfitted
 * @return {Array}           Modules fittable on this ship
 */
function ship_filter(arr, shipId) {
  return arr.filter(m => shipAllowsModule(m, shipId));
}

/**
 * Filter SCO Modules to only return legal size.
 * @param  {Array}  arr        Array of available FSD modules.
 * @param  {number} maxSize    Maximum allowable size for SCO modules.
 * @return {Array}             Subset of modules filtered based on legal size amd type.
 */
function sco_filter(arr, slotSize) {
  return arr.filter(module => {
    // Check if this is an SCO FSD (regular or V1)
    if (module.hasOwnProperty('name') && (module['name'].includes("(SCO)"))) {
      // SCO FSDs can only be mounted in slots that exactly match their class size
      return module['class'] === slotSize;
    }
    // For non-SCO modules, use the original logic (prevent undersized SCO modules)
    return true;
  });
}


/**
 * The available module set for a specific ship
 */
export default class ModuleSet {
  /**
   * Instantiate the module set
   * @param  {Object} modules        All Modules
   * @param  {Object} shipData       Ship Specifications Data (see coriolis-data/Ships)
   * @param  {String} shipId         The coriolis ship id (used to honour per-module
   *                                 `ship` restrictions, e.g. the Caspian-only Mk II
   *                                 SCO FSD). Optional for backwards compatibility.
   */
  constructor(modules, shipData, shipId) {
    this.shipId = shipId;
    let maxInternal = Math.max(...shipData.slots.internal.map(slot =>
      isNaN(slot) ? slot.class : slot
    ));
    let mass = shipData.properties.hullMass + 6.5;
    let maxStandardArr = shipData.slots.standard;
    let maxHardPoint = Math.max(...shipData.slots.hardpoints.map(slot =>
      typeof slot === 'object' ? slot.class : slot
    ));

    let stnd = modules.standard;
    this.mass = mass;
    this.standard = {};
    this.internal = {};
    this.hardpoints = {};
    this.hpClass = {};
    this.intClass = {};

    this.bulkheads = shipData.bulkheads.map((b, i) => {
      // Use the bulkhead's own name if it exists, otherwise fall back to standard names
      const name = b.name || BulkheadNames[i];
      return Object.assign(new Module(), { grp: 'bh', id: i, index: i, class: '', rating: '' }, b, { name });
    });

    this.standard[0] = filter(stnd.pp, maxStandardArr[0], 0, mass);  // Power Plant
    this.standard[2] = filter(stnd.fsd, maxStandardArr[2], 0, mass);  // FSD
    this.standard[2] = sco_filter(this.standard[2], maxStandardArr[2]) // FSD - Filter SCO Modules
    this.standard[2] = ship_filter(this.standard[2], shipId);  // FSD - drop ship-restricted (e.g. Caspian-only Mk II SCO)
    this.standard[4] = filter(stnd.pd, maxStandardArr[4], 0, mass);  // Power Distributor

    // Fuel Tank - filter out unrecognised modules
    this.standard[6] = filter(stnd.ft, maxStandardArr[6], 0, mass).filter(m => {
      if (!m || !m.id) return false;
      const id = m.id.toLowerCase();
      const name = (m.name || m.ukName || '').toLowerCase();
      // Filter out unrecognised modules
      if (name.includes('unrecognised') || id.includes('unrecognised')) return false;
      if (id === '4m' || id === '1z' || id === '0z' || id.endsWith('z')) return false;
      if (name.includes('error') || name.includes('placeholder')) return false;
      if (m.rating === 'Z') return false;  // Rating Z is used for unrecognised modules
      return true;
    });

    // Thrusters, filter modules by class only (to show full list of ratings for that class)
    let minThrusterClass = stnd.t.reduce((clazz, th) => (th.maxmass >= mass && th.class < clazz) ? th.class : clazz, maxStandardArr[1]);
    this.standard[1] = filter(stnd.t, maxStandardArr[1], minThrusterClass, 0);  // Thrusters
    this.standard[1] = ship_filter(this.standard[1], shipId);  // Thrusters - drop ship-restricted (e.g. Caspian/Kestrel-only Mk II)
    // Drop the 'Unrecognised Thrusters' placeholder (rating 'Z', maxmass 0) - it
    // exists only so journal/CAPI imports that reference an unknown module don't
    // error; it must never appear as a selectable module. (Mirrors the fuel tank
    // and FSD filters above.)
    this.standard[1] = this.standard[1].filter(m => m && m.rating !== 'Z');
    // Slots where module class must be equal to slot class
    this.standard[3] = filter(stnd.ls, maxStandardArr[3], maxStandardArr[3], 0);     // Life Support
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
      // 'crl' (Large Cargo Racks) can only be mounted in special 'Cargo' slots
      if (key === 'crl' && !eligible) {
        continue;
      }

      if (key == 'pcq' && !(ship.luxuryCabins && ship.luxuryCabins  === true)) {
        continue;
      }
      if (key == 'fh' && !(ship.fighterHangars && ship.fighterHangars  === true)) {
        continue;
      }
      if (key == 'fhmkii' && !(ship.vesselHangarsMkII && ship.vesselHangarsMkII === true)) {
        continue;
      }
      if (key == 'lpvmkii' && !(ship.vehicleHangarsMkII && ship.vehicleHangarsMkII === true)) {
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
  getHps(ship, c, eligible, slot) {
    let o = {};
    for (let key in this.hardpoints) {
      if (eligible && !eligible[key]) { // If the slot has eligibility restrictions
        continue;
      }
      // The Mining Volley Repeater is restricted to specific slots on ships
      // that gate it that way. The Anaconda Mk II allows it only on its two
      // lower Large hardpoints, which carry an `mvr` opt-in flag; drop it from
      // every other slot on that ship. Other ships (e.g. the Type-11, which
      // offers it on its mining slots) are unaffected.
      if (key === 'mvr' && ship && ship.id === 'anaconda2' && !(slot && slot.mvr)) {
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
