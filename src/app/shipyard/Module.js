import * as ModuleUtils from './ModuleUtils';
import { Modifications } from 'coriolis-data/dist';

/**
 * Module - active module in a ship's buildout
 */
export default class Module {

  /**
   * Construct a new module
   * @param {Object} params   Module parameters.  Either grp/id or template
   */
  constructor(params) {
    let properties = Object.assign({ grp: null, id: null, template: null }, params);

    if (properties.class != undefined) {
      // We already have a fully-formed module; copy the data over
      for (let p in properties) { this[p] = properties[p]; }
    } else if (properties.template != undefined) {
      // We have a template from coriolis-data; copy the data over
      for (let p in properties.template) { this[p] = properties.template[p]; }
    } else {
      // We don't have a template; find it given the group and ID
      return ModuleUtils.findModule(properties.grp, properties.id);
    }
  }

  /**
   * Clone an existing module
   * @return {Object}  A clone of the existing module
   */
  clone() {
    return new Module(JSON.parse(JSON.stringify(this)));
  }

  /**
   * Get a value for a given modification
   * @param {Number} name The name of the modification
   * @param {Number} raw  True if the value returned should be raw i.e. without the influence of special effects
   * @return {object}     The value of the modification. If it is a numeric value then it is returned as an integer value scaled so that 1.23% == 123
   */
  getModValue(name, raw) {
    let result = this.mods  && this.mods[name] ? this.mods[name] : null;
    if ((!raw) && this.blueprint && this.blueprint.special) {
      // This module has a special effect, see if we need to alter our returned value
      const modifierActions = Modifications.modifierActions[this.blueprint.special.edname];
      if (modifierActions && modifierActions[name]) {
        // this special effect modifies our returned value
        const modification = Modifications.modifications[name];
        if (modification.method === 'additive') {
          result = result + modifierActions[name] * 100;
        } else if (modification.method === 'overwrite') {
          result = modifierActions[name];
        } else {
          // rate of fire is special, as it's really burst interval.  Handle that here
          let mod = null;
          if (name === 'rof') {
            mod = 1 / (1 + modifierActions[name]) - 1;
          } else {
            mod = modifierActions[name];
          }
          const multiplier = modification.type === 'percentage' ? 10000 : 100;
          result = (((1 + result / multiplier) * (1 + mod)) - 1) * multiplier;
        }
      }
    }

    // Sanitise the resultant value to 4dp equivalent
    return isNaN(result) ? result : Math.round(result);
  }

  /**
   * Set a value for a given modification ID
   * @param {Number} name                 The name of the modification
   * @param {object} value  The value of the modification. If it is a numeric value then it should be an integer scaled so that -2.34% == -234
   * @param {bool}   valueiswithspecial   true if the value includes the special effect (when coming from a UI component)
   */
  setModValue(name, value, valueiswithspecial) {
    if (!this.mods) {
      this.mods = {};
    }
    if (valueiswithspecial && this.blueprint && this.blueprint.special) {
      // This module has a special effect, see if we need to alter the stored value
      const modifierActions = Modifications.modifierActions[this.blueprint.special.edname];
      if (modifierActions && modifierActions[name]) {
        // This special effect modifies the value being set, so we need to revert it prior to storing the value
        const modification = Modifications.modifications[name];
        if (modification.method === 'additive') {
          value = value - modifierActions[name];
        } else if (modification.method === 'overwrite') {
          value = null;
        } else {
          // rate of fire is special, as it's really burst interval.  Handle that here
          let mod = null;
          if (name === 'rof') {
            mod = 1 / (1 + modifierActions[name]) - 1;
          } else {
            mod = modifierActions[name];
          }
          value = ((value / 10000 + 1) / (1 + mod) - 1) * 10000;
        }
      }
    }

    if (value == null || value == 0) {
      delete this.mods[name];
    } else {
      this.mods[name] = value;
    }
  }

  /**
   * Helper to obtain a modified value using standard multipliers
   * @param {String}  name     the name of the modifier to obtain
   * @return {Number}          the mass of this module
   */
  _getModifiedValue(name) {
    const modification = Modifications.modifications[name];
    let result = this[name];

    if (!result) {
      if (modification && modification.method === 'additive') {
        // Additive modifications start at 0 rather than NULL
        result = 0;
      } else {
        result = null;
      }
    }

    if (result != null) {
      if (modification) {
        // We store percentages as decimals, so to get them back we need to divide by 10000.  Otherwise
        // we divide by 100.  Both ways we end up with a value with two decimal places
        let modValue;
        if (modification.type === 'percentage') {
          modValue = this.getModValue(name) / 10000;
        } else if (modification.type === 'numeric') {
          modValue = this.getModValue(name) / 100;
        } else {
          modValue = this.getModValue(name);
        }
        if (modValue) {
          if (modification.method === 'additive') {
            result = result + modValue;
          } else if (modification.method === 'overwrite') {
            result = modValue;
          } else {
            result = result * (1 + modValue);
          }
        }
      }
    } else {
      if (name === 'burst') {
        // Burst is special, as if it can not exist but have a modification
        result = this.getModValue(name) / 100;
      } else if (name === 'burstrof') {
        // Burst rate of fire is special, as if it can not exist but have a modification
        result = this.getModValue(name) / 100;
      }
    }

    return result;
  }

  /**
   * Get the power generation of this module, taking in to account modifications
   * @return {Number} the power generation of this module
   */
  getPowerGeneration() {
    return this._getModifiedValue('pgen');
  }

  /**
   * Get the power usage of this module, taking in to account modifications
   * @return {Number} the power usage of this module
   */
  getPowerUsage() {
    return this._getModifiedValue('power');
  }

  /**
   * Get the integrity of this module, taking in to account modifications
   * @return {Number} the integrity of this module
   */
  getIntegrity() {
    return this._getModifiedValue('integrity');
  }

  /**
   * Get the mass of this module, taking in to account modifications
   * @return {Number} the mass of this module
   */
  getMass() {
    return this._getModifiedValue('mass');
  }

  /**
   * Get the thermal efficiency of this module, taking in to account modifications
   * @return {Number} the thermal efficiency of this module
   */
  getThermalEfficiency() {
    return this._getModifiedValue('eff');
  }

  /**
   * Get the maximum fuel per jump for this module, taking in to account modifications
   * @return {Number} the maximum fuel per jump of this module
   */
  getMaxFuelPerJump() {
    return this._getModifiedValue('maxfuel');
  }

  /**
   * Get the systems capacity for this module, taking in to account modifications
   * @return {Number} the systems capacity of this module
   */
  getSystemsCapacity() {
    return this._getModifiedValue('syscap');
  }

  /**
   * Get the engines capacity for this module, taking in to account modifications
   * @return {Number} the engines capacity of this module
   */
  getEnginesCapacity() {
    return this._getModifiedValue('engcap');
  }

  /**
   * Get the weapons capacity for this module, taking in to account modifications
   * @return {Number} the weapons capacity of this module
   */
  getWeaponsCapacity() {
    return this._getModifiedValue('wepcap');
  }

  /**
   * Get the systems recharge rate for this module, taking in to account modifications
   * @return {Number} the systems recharge rate of this module
   */
  getSystemsRechargeRate() {
    return this._getModifiedValue('sysrate');
  }

  /**
   * Get the engines recharge rate for this module, taking in to account modifications
   * @return {Number} the engines recharge rate of this module
   */
  getEnginesRechargeRate() {
    return this._getModifiedValue('engrate');
  }

  /**
   * Get the weapons recharge rate for this module, taking in to account modifications
   * @return {Number} the weapons recharge rate of this module
   */
  getWeaponsRechargeRate() {
    return this._getModifiedValue('weprate');
  }

  /**
   * Get the kinetic resistance for this module, taking in to account modifications
   * @return {Number} the kinetic resistance of this module
   */
  getKineticResistance() {
    return this._getModifiedValue('kinres');
  }

  /**
   * Get the thermal resistance for this module, taking in to account modifications
   * @return {Number} the thermal resistance of this module
   */
  getThermalResistance() {
    return this._getModifiedValue('thermres');
  }

  /**
   * Get the explosive resistance for this module, taking in to account modifications
   * @return {Number} the explosive resistance of this module
   */
  getExplosiveResistance() {
    return this._getModifiedValue('explres');
  }

  /**
   * Get the regeneration rate for this module, taking in to account modifications
   * @return {Number} the regeneration rate of this module
   */
  getRegenerationRate() {
    return this._getModifiedValue('regen');
  }

  /**
   * Get the broken regeneration rate for this module, taking in to account modifications
   * @return {Number} the broken regeneration rate of this module
   */
  getBrokenRegenerationRate() {
    return this._getModifiedValue('brokenregen');
  }

  /**
   * Get the range for this module, taking in to account modifications
   * @return {Number} the range rate of this module
   */
  getRange() {
    return this._getModifiedValue('range');
  }

  /**
   * Get the falloff for this module, taking in to account modifications
   * @return {Number} the falloff of this module
   */
  getFalloff() {
    if (this.getModValue('fallofffromrange')) {
      // Falloff from range means what it says, so use range instead of falloff
      return this.getRange();
    } else {
      // Need to find out if we have a focused modification, in which case our falloff is scaled to range
      if (this.blueprint && this.blueprint.name === 'Focused') {
        const rangeMod = this.getModValue('range') / 10000;
        return this.falloff * (1 + rangeMod);
      } else {
        // Standard falloff calculation
        const range = this.getRange();
        const falloff = this._getModifiedValue('falloff');
        return (falloff > range ? range : falloff);
      }
    }
  }

  /**
   * Get the range (in terms of seconds, for FSDI) for this module, taking in to account modifications
   * @return {Number} the range of this module
   */
  getRangeT() {
    return this._getModifiedValue('ranget');
  }

  /**
   * Get the scan time for this module, taking in to account modifications
   * @return {Number} the scan time of this module
   */
  getScanTime() {
    return this._getModifiedValue('scantime');
  }

  /**
   * Get the capture arc for this module, taking in to account modifications
   * @return {Number} the capture arc of this module
   */
  getCaptureArc() {
    return this._getModifiedValue('arc');
  }

  /**
   * Get the hull reinforcement for this module, taking in to account modifications
   * @return {Number} the hull reinforcement of this module
   */
  getHullReinforcement() {
    return this._getModifiedValue('hullreinforcement');
  }

  /**
   * Get the protection for this module, taking in to account modifications
   * @return {Number} the protection of this module
   */
  getProtection() {
    return this._getModifiedValue('protection');
  }

  /**
   * Get the delay for this module, taking in to account modifications
   * @return {Number} the delay of this module
   */
  getDelay() {
    return this._getModifiedValue('delay');
  }

  /**
   * Get the duration for this module, taking in to account modifications
   * @return {Number} the duration of this module
   */
  getDuration() {
    return this._getModifiedValue('duration');
  }

  /**
   * Get the shield boost for this module, taking in to account modifications
   * @return {Number} the shield boost of this module
   */
  getShieldBoost() {
    return this._getModifiedValue('shieldboost');
  }

  /**
   * Get the minimum mass for this module, taking in to account modifications
   * @return {Number} the minimum mass of this module
   */
  getMinMass() {
    // Modifier is optmass
    let result = 0;
    if (this['minmass']) {
      result = this['minmass'];
      if (result) {
        let mult = this.getModValue('optmass') / 10000;
        if (mult) { result = result * (1 + mult); }
      }
    }
    return result;
  }

  /**
   * Get the optimum mass for this module, taking in to account modifications
   * @return {Number} the optimum mass of this module
   */
  getOptMass() {
    return this._getModifiedValue('optmass');
  }

  /**
   * Get the maximum mass for this module, taking in to account modifications
   * @return {Number} the maximum mass of this module
   */
  getMaxMass() {
    // Modifier is optmass
    let result = 0;
    if (this['maxmass']) {
      result = this['maxmass'];
      if (result) {
        let mult = this.getModValue('optmass') / 10000;
        if (mult) { result = result * (1 + mult); }
      }
    }
    return result;
  }

  /**
   * Get the minimum multiplier for this module, taking in to account modifications
   * @param {string} type the type for which we are obtaining the multiplier.  Can be 'speed', 'rotation', 'acceleration', or null
   * @return {Number} the minimum multiplier of this module
   */
  getMinMul(type = null) {
    // Modifier is optmul
    let result = 0;
    if (this['minmul' + type]) {
      result = this['minmul' + type];
    } else if (this['minmul']) {
      result = this['minmul'];
    }
    if (result) {
      let mult = this.getModValue('optmul') / 10000;
      if (mult) { result = result * (1 + mult); }
    }
    return result;
  }

  /**
   * Get the optimum multiplier for this module, taking in to account modifications
   * @param {string} type the type for which we are obtaining the multiplier.  Can be 'speed', 'rotation', 'acceleration', or null
   * @return {Number} the optimum multiplier of this module
   */
  getOptMul(type = null) {
    // Modifier is optmul
    let result = 0;
    if (this['optmul' + type]) {
      result = this['optmul' + type];
    } else if (this['optmul']) {
      result = this['optmul'];
    }
    if (result) {
      let mult = this.getModValue('optmul') / 10000;
      if (mult) { result = result * (1 + mult); }
    }
    return result;
  }

  /**
   * Get the maximum multiplier for this module, taking in to account modifications
   * @param {string} type the type for which we are obtaining the multiplier.  Can be 'speed', 'rotation', 'acceleration', or null
   * @return {Number} the maximum multiplier of this module
   */
  getMaxMul(type = null) {
    // Modifier is optmul
    let result = 0;
    if (this['maxmul' + type]) {
      result = this['maxmul' + type];
    } else if (this['maxmul']) {
      result = this['maxmul'];
    }
    if (result) {
      let mult = this.getModValue('optmul') / 10000;
      if (mult) { result = result * (1 + mult); }
    }
    return result;
  }

  /**
   * Get the damage for this module, taking in to account modifications
   * @return {Number} the damage of this module
   */
  getDamage() {
    return this._getModifiedValue('damage');
  }

  /**
   * Get the distributor draw for this module, taking in to account modifications
   * @return {Number} the distributor draw of this module
   */
  getDistDraw() {
    return this._getModifiedValue('distdraw');
  }

  /**
   * Get the thermal load for this module, taking in to account modifications
   * @return {Number} the thermal load of this module
   */
  getThermalLoad() {
    return this._getModifiedValue('thermload');
  }

  /**
   * Get the rounds per shot for this module, taking in to account modifications
   * @return {Number} the rounds per shot of this module
   */
  getRoundsPerShot() {
    return this._getModifiedValue('roundspershot');
  }

  /**
   * Get the DPS for this module, taking in to account modifications
   * @return {Number} the DPS of this module
   */
  getDps() {
    // DPS is a synthetic value
    let damage = this.getDamage();
    let rpshot = this.roundspershot || 1;
    let rof = this.getRoF() || 1;

    return damage * rpshot * rof;
  }

  /**
   * Get the EPS for this module, taking in to account modifications
   * @return {Number} the EPS of this module
   */
  getEps() {
    // EPS is a synthetic value
    let distdraw = this.getDistDraw();
    // We don't use rpshot here as dist draw is per combined shot
    let rof = this.getRoF() || 1;

    return distdraw * rof;
  }

  /**
   * Get the HPS for this module, taking in to account modifications
   * @return {Number} the HPS of this module
   */
  getHps() {
    // HPS is a synthetic value
    let heat = this.getThermalLoad();
    // We don't use rpshot here as dist draw is per combined shot
    let rof = this.getRoF() || 1;

    return heat * rof;
  }

  /**
   * Get the clip size for this module, taking in to account modifications
   * @return {Number} the clip size of this module
   */
  getClip() {
    // Clip size is always rounded up
    let result = this._getModifiedValue('clip');
    if (result) { result = Math.ceil(result); }
    return result;
  }

  /**
   * Get the ammo size for this module, taking in to account modifications
   * @return {Number} the ammo size of this module
   */
  getAmmo() {
    return this._getModifiedValue('ammo');
  }

  /**
   * Get the reload time for this module, taking in to account modifications
   * @return {Number} the reload time of this module
   */
  getReload() {
    return this._getModifiedValue('reload');
  }

  /**
   * Get the burst size for this module, taking in to account modifications
   * @return {Number} the burst size of this module
   */
  getBurst() {
    return this._getModifiedValue('burst');
  }

  /**
   * Get the burst rate of fire for this module, taking in to account modifications
   * @return {Number} the burst rate of fire of this module
   */
  getBurstRoF() {
    return this._getModifiedValue('burstrof');
  }

  /**
   * Get the rate of fire for this module, taking in to account modifications.
   * The rate of fire is a combination value, and needs to take in to account
   * bursts of fire.
   * Firing goes [burst 1] [burst interval] [burst 2] [burst interval] ... [burst n] [interval]
   * where 'n' is 'burst', 'burst interval' is '1/burstrof' and 'interval' is '1/rof'
   * @return {Number} the rate of fire for this module
   */
  getRoF() {
    const burst = this.getBurst() || 1;
    const burstRoF = this.getBurstRoF() || 1;
    const intRoF = this._getModifiedValue('rof');

    return burst / (((burst - 1) / burstRoF) + 1 / intRoF);
  }

  /**
   * Get the facing limit for this module, taking in to account modifications
   * @return {Number} the facing limit for this module
   */
  getFacingLimit() {
    return this._getModifiedValue('facinglimit');
  }

  /**
   * Get the hull boost for this module, taking in to account modifications
   * @return {Number} the hull boost for this module
   */
  getHullBoost() {
    return this._getModifiedValue('hullboost');
  }

  /**
   * Get the shield reinforcement for this module, taking in to account modifications
   * @return {Number} the shield reinforcement for this module
   */
  getShieldReinforcement() {
    return this._getModifiedValue('shieldreinforcement');
  }

  /**
   * Get the piercing for this module, taking in to account modifications
   * @return {Number} the piercing for this module
   */
  getPiercing() {
    return this._getModifiedValue('piercing');
  }

  /**
   * Get the bays for this module, taking in to account modifications
   * @return {Number} the bays for this module
   */
  getBays() {
    return this._getModifiedValue('bays');
  }

  /**
   * Get the rebuilds per bay for this module, taking in to account modifications
   * @return {Number} the rebuilds per bay for this module
   */
  getRebuildsPerBay() {
    return this._getModifiedValue('rebuildsperbay');
  }

  /**
   * Get the jitter for this module, taking in to account modifications
   * @return {Number} the jitter for this module
   */
  getJitter() {
    return this._getModifiedValue('jitter', true);
  }

  /**
   * Get the damage distribution for this module, taking in to account modifications
   * @return {string} the damage distribution for this module
   */
  getDamageDist() {
    return this.getModValue('damagedist') || this.damagedist;
  }

  /**
   * Get the shot speed for this module, taking in to account modifications
   * @return {string} the shot speed for this module
   */
  getShotSpeed() {
    if (this.blueprint && (this.blueprint.name === 'Focused' || this.blueprint.name === 'Long range')) {
      // If the modification is focused or long range then the shot speed
      // uses the range modifier
      const rangemod = this.getModValue('range') / 10000;
      let result = this['shotspeed'];
      if (!result) {
        return null;
      }
      return result * (1 + rangemod);
    }
    return this._getModifiedValue('shotspeed');
  }

  /**
   * Get the spinup for this module, taking in to account modifications
   * @return {string} the spinup for this module
   */
  getSpinup() {
    return this._getModifiedValue('spinup');
  }

  /**
   * Get the time for this module, taking in to account modifications
   * @return {string} the time for this module
   */
  getTime() {
    return this._getModifiedValue('time');
  }
}
