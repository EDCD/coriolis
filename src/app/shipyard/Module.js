import * as ModuleUtils from './ModuleUtils';
import { Modifications } from 'coriolis-data/dist';
import React from 'react';
import { STATS_FORMATTING, SI_PREFIXES } from './StatsFormatting';

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
    let baseVal = this[name];
    let result = this.mods  && this.mods[name] ? this.mods[name] : null;

    if ((!raw) && this.blueprint && this.blueprint.special) {
      // This module has a special effect, see if we need to alter our returned value
      const modifierActions = Modifications.modifierActions[this.blueprint.special.edname];
      if (modifierActions && modifierActions[name]) {
        // this special effect modifies our returned value
        const modification = Modifications.modifications[name];
        const multiplier = modification.type === 'percentage' ? 10000 : 100;
        if (name === 'explres' || name === 'kinres' || name === 'thermres' || name === 'causres') {
          // Apply resistance modding mechanisms to special effects subsequently
          result = result + modifierActions[name] * (1 - (this[name] + result / multiplier)) * 100;
        } else if (modification.method === 'additive') {
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
   * @param {Boolean}   valueiswithspecial   true if the value includes the special effect (when coming from a UI component)
   */
  setModValue(name, value, valueiswithspecial) {
    if (!this.mods) {
      this.mods = {};
    }
    if (!this.origVals) {
      this.origVals = {};
    }
    if (valueiswithspecial && this.blueprint && this.blueprint.special) {
      // This module has a special effect, see if we need to alter the stored value
      const modifierActions = Modifications.modifierActions[this.blueprint.special.edname];
      if (modifierActions && modifierActions[name]) {
        // This special effect modifies the value being set, so we need to revert it prior to storing the value
        const modification = Modifications.modifications[name];
        if (name === 'explres' || name === 'kinres' || name === 'thermres' || name === 'causres') {
          let res = (this[name] ? this[name] : 0) + value / 10000;
          let experimental = modifierActions[name] / 100;
          value = (experimental - res) / (experimental - 1) - this[name];
          value *= 10000;
          // value = ((baseMult - value / 10000) / (1 - modifierActions[name] / 100) - baseMult) * -10000;
        } else if (modification.method === 'additive') {
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
   * Helper to obtain a module's value.
   * @param {String} name     The name of the modifier to obtain
   * @param {Number} modified Whether to return the raw or modified value
   * @return {Number} The value queried
   */
  get(name, modified = true) {
    let val;
    if (modified) {
      val = this._getModifiedValue(name);
    } else {
      val = this[name];
    }
    return isNaN(val) ? null : val;
  }

  /**
   * Sets mod values such that the overall result for the given stat equals value
   * @param {String} name The name of the modification
   * @param {Number} value The value to effectively set
   * @param {Boolean} valueIsWithSpecial True when value includes an special
   *                                     effects
   */
  set(name, value, valueIsWithSpecial) {
    const modification = Modifications.modifications[name];
    if (!modification || isNaN(value)) {
      // TODO: throw?
      return;
    }

    let baseValue = this[name];
    let modValue = 0;
    if (modification.method === 'overwrite') {
      modValue = value;
    } else if (modification.method === 'additive') {
      // additive modifications can be given without a base value
      if (!baseValue) {
        baseValue = 0;
      }
      modValue = value - baseValue;
    } else if (name === 'shieldboost' || name === 'hullboost') {
      modValue = (1 + value) / (1 + baseValue) - 1;
    } else { // multiplicative
      modValue = baseValue == 0 ? 0 : value / baseValue - 1;
    }

    if (modification.type === 'percentage') {
      modValue = modValue * 10000;
    } else if (modification.type === 'numeric' && name !== 'burst' &&
      name !== 'burstrof') {
      modValue = modValue * 100;
    }

    this.setModValue(name, modValue, valueIsWithSpecial);
  }

  /**
   * Returns a value for a given modification in pretty format, i.e. percentages
   * are returned as 90 not as 0.9.
   * @param {String} name Name of the modification to get the value for
   * @param {Boolean} [modified = true] If set to false, the raw value of the
   *                                    raw value of the stat is returned
   * @param {Number} [places = 2] Number of decimal places to round
   * @return {Number} Value for given stat
   */
  getPretty(name, modified = true, places = 2) {
    const formattingOptions = STATS_FORMATTING[name];
    let val = this.get(name, modified) || 0;
    if (formattingOptions && formattingOptions.format.startsWith('pct')) {
      return 100 * val;
    }
    // Round to two decimal places
    let precisionMult = 10 ** places;
    return Math.round(val * precisionMult) / precisionMult;
  }

  /**
   * Same as {@see Module#set} but values expects value that are percentages to
   * come in format 90 as opposed to 0.9.
   * @param {String} name The name of the modification
   * @param {Number} value The value to effectively set
   * @param {Boolean} valueIsWithSpecial True when value includes an special
   */
  setPretty(name, value, valueIsWithSpecial) {
    const formattingOptions = STATS_FORMATTING[name];
    if (formattingOptions && formattingOptions.format.startsWith('pct')) {
      value = value / 100;
    }
    this.set(name, value, valueIsWithSpecial);
  }

  /**
   * Helper to obtain a modified value using standard multipliers
   * @param {String}  name     the name of the modifier to obtain
   * @return {Number}          the value queried
   */
  _getModifiedValue(name) {
    const modification = Modifications.modifications[name];
    let result = this[name];

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
        if (!result && modification.method === 'additive') {
          // If the modification is additive and no value is given by default we
          // start at zero
          result = 0;
        }

        if (result !== undefined) {
          if (modification.method === 'additive') {
            result = result + modValue;
          } else if (modification.method === 'overwrite') {
            result = modValue;
          } else if (name === 'shieldboost' || name === 'hullboost') {
            result = (1 + result) * (1 + modValue) - 1;
          } else {
            result = result * (1 + modValue);
          }
        } else if (name === 'burstrof') {
          // Burst and burst rate of fire are special, as it can not exist but
          // have a modification
          result = modValue / 100;
        }
      }
    }

    return isNaN(result) ? null : result;
  }

  /**
   * Creates a react element that pretty-prints the queried module value
   * @param {String} name     The name of the value
   * @param {object} language Language object holding formats and util functions
   * @param {String} [unit]   If unit is given not the stat's default formatting
   *                          unit will be applied but the given one taking into
   *                          account SI-prefixes such as kilo, milli, etc.
   * @param {Number} [val]    If val is given, not the modules value but given
   *                          one will be formated
   * @returns {React.Component} The formated value as component
   */
  formatModifiedValue(name, language, unit, val) {
    const formattingOptions = STATS_FORMATTING[name];
    if (val === undefined) {
      if (formattingOptions && formattingOptions.synthetic) {
        val = (this[formattingOptions.synthetic]).call(this, true);
      } else {
        val = this._getModifiedValue(name);
      }
    }

    val = val || 0;

    if (!formattingOptions) {
      return (
        <span>
          {val}
        </span>
      );
    }

    let { format } = formattingOptions;
    unit = unit || formattingOptions.unit;
    let storedUnit = formattingOptions.storedUnit || formattingOptions.unit;
    let factor = 1;
    if (storedUnit && storedUnit !== unit) {
      // Find out si prefix of storedUnit and unit as si prefixes can only take
      // on charactere it suffices to compare the first character of each string
      let prefixUnit = unit[0];
      let prefixStored = unit[0];
      if (unit.length > storedUnit.length) {
        factor /= SI_PREFIXES[prefixUnit];
      } else if (storedUnit.length > unit.length) {
        factor *= SI_PREFIXES[prefixStored];
      } else if (prefixUnit !== prefixStored) {
        factor *= SI_PREFIXES[prefixStored];
        factor /= SI_PREFIXES[prefixUnit];
      }
    }

    if (format && language.formats[format]) {
      val = (language.formats[format])(val * factor);
    }

    return (
      <span>
        {val}
        {formattingOptions.unit && language.units[formattingOptions.unit]}
      </span>
    );
  }

  /**
   * Returns the change rate in percentage of a given stat. Change rate can
   * differ from return value of {@see Module#getModValue} when formatting
   * options are given.
   * @param {String} name Name of the value to get the change for
   * @param {Number} [val] If given not the modules value but this one will be
   *                       taken as new value
   * @return {Number} Change rate of the stat according to formatting options
   */
  getChange(name, val) {
    const formattingOptions = STATS_FORMATTING[name];

    if (isNaN(val)) {
      // Calculate the percentage change for an abstract value
      if (formattingOptions && formattingOptions.synthetic) {
        const statGetter = this[formattingOptions.synthetic];
        let unmodifiedStat = statGetter.call(this, false);
        let modifiedStat = statGetter.call(this, true);
        val = (modifiedStat / unmodifiedStat - 1)  * 10000;
      } else {
        val = this.getModValue(name);
      }
    }

    if (formattingOptions && formattingOptions.change) {
      let changeFormatting = formattingOptions.change;
      let baseVal = this[name];
      let absVal = this._getModifiedValue(name);
      if (changeFormatting === 'additive') {
        val = absVal - baseVal;
      } else if (changeFormatting === 'multiplicative') {
        val = absVal / baseVal - 1;
      }
      val *= 10000;
    }
    return val;
  }

  /**
   * Returns the the unit key for a given stat. For example '%' for 'kinres'.
   * @param {String} name Name of the stat
   * @return {String} Unit key
   */
  getUnitFor(name) {
    const formattingOptions = STATS_FORMATTING[name];
    if (!formattingOptions || !formattingOptions.unit) {
      if (formattingOptions.format && formattingOptions.format.startsWith('pct')) {
        return 'pct';
      }
      return '';
    }

    return formattingOptions.unit;
  }

  /**
   * Same as {@see Module#getUnitFor} but returns the unit in which the stat is
   * stored. For example 'm' for 'range' as opposed to 'km' which is the unit
   * 'range' is usually displayed.
   * @param {String} name Name of the stat
   * @return {String} Unit key
   */
  getStoredUnitFor(name) {
    const formattingOptions = STATS_FORMATTING[name];
    if (!formattingOptions || !formattingOptions.storedUnit) {
      return this.getUnitFor(name);
    }
    return formattingOptions.storedUnit;
  }

  /**
   * Get the power generation of this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the power generation of this module
   */
  getPowerGeneration(modified = true) {
    return this.get('pgen', modified);
  }

  /**
   * Get the power usage of this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the power usage of this module
   */
  getPowerUsage(modified = true) {
    return this.get('power', modified);
  }

  /**
   * Get the integrity of this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the integrity of this module
   */
  getIntegrity(modified = true) {
    return this.get('integrity', modified);
  }

  /**
   * Get the mass of this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the mass of this module
   */
  getMass(modified = true) {
    return this.get('mass', modified);
  }

  /**
   * Get the thermal efficiency of this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the thermal efficiency of this module
   */
  getThermalEfficiency(modified = true) {
    return this.get('eff', modified);
  }

  /**
   * Get the maximum fuel per jump for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the maximum fuel per jump of this module
   */
  getMaxFuelPerJump(modified = true) {
    return this.get('maxfuel', modified);
  }

  /**
   * Get the systems capacity for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the systems capacity of this module
   */
  getSystemsCapacity(modified = true) {
    return this.get('syscap', modified);
  }

  /**
   * Get the engines capacity for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the engines capacity of this module
   */
  getEnginesCapacity(modified = true) {
    return this.get('engcap', modified);
  }

  /**
   * Get the weapons capacity for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the weapons capacity of this module
   */
  getWeaponsCapacity(modified = true) {
    return this.get('wepcap', modified);
  }

  /**
   * Get the systems recharge rate for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the systems recharge rate of this module
   */
  getSystemsRechargeRate(modified = true) {
    return this.get('sysrate', modified);
  }

  /**
   * Get the engines recharge rate for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the engines recharge rate of this module
   */
  getEnginesRechargeRate(modified = true) {
    return this.get('engrate', modified);
  }

  /**
   * Get the weapons recharge rate for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the weapons recharge rate of this module
   */
  getWeaponsRechargeRate(modified = true) {
    return this.get('weprate', modified);
  }

  /**
   * Get the kinetic resistance for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the kinetic resistance of this module
   */
  getKineticResistance(modified = true) {
    return this.get('kinres', modified);
  }

  /**
   * Get the thermal resistance for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the thermal resistance of this module
   */
  getThermalResistance(modified = true) {
    return this.get('thermres', modified);
  }

  /**
   * Get the explosive resistance for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the explosive resistance of this module
   */
  getExplosiveResistance(modified = true) {
    return this.get('explres', modified);
  }

  /**
   * Get the caustic resistance for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the caustic resistance of this module
   */
  getCausticResistance(modified = true) {
    return this.get('causres', modified);
  }

  /**
   * Get the regeneration rate for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the regeneration rate of this module
   */
  getRegenerationRate(modified = true) {
    return this.get('regen', modified);
  }

  /**
   * Get the broken regeneration rate for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the broken regeneration rate of this module
   */
  getBrokenRegenerationRate(modified = true) {
    return this.get('brokenregen', modified);
  }

  /**
   * Get the range for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the range rate of this module
   */
  getRange(modified = true) {
    return this.get('range', modified);
  }

  /**
   * Get the falloff for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the falloff of this module
   */
  getFalloff(modified = true) {
    if (!modified) {
      const range = this.getRange(false);
      const falloff = this.get('falloff', false);
      return (falloff > range ? range : falloff);
    }

    // Falloff from range is mapped to range
    if (this.mods && this.mods['fallofffromrange']) {
      return this.getRange();
    // Need to find out if we have a focused modification, in which case our
    // falloff is scaled to range
    } else if (this.blueprint && this.blueprint.name === 'Focused') {
      const rangeMod = this.getModValue('range') / 10000;
      return this.falloff * (1 + rangeMod);
    // Standard falloff calculation
    } else {
      const range = this.getRange();
      const falloff = this._getModifiedValue('falloff');
      return (falloff > range ? range : falloff);
    }
  }

  /**
   * Get the range (in terms of seconds, for FSDI) for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the range of this module
   */
  getRangeT(modified = true) {
    return this.get('ranget', modified);
  }

  /**
   * Get the scan time for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the scan time of this module
   */
  getScanTime(modified = true) {
    return this.get('scantime', modified);
  }

  /**
   * Get the capture arc for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the capture arc of this module
   */
  getCaptureArc(modified = true) {
    return this.get('arc', modified);
  }

  /**
   * Get the hull reinforcement for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the hull reinforcement of this module
   */
  getHullReinforcement(modified = true) {
    return this.get('hullreinforcement', modified);
  }

  /**
   * Get the protection for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the protection of this module
   */
  getProtection(modified = true) {
    return this.get('protection', modified);
  }

  /**
   * Get the delay for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the delay of this module
   */
  getDelay(modified = true) {
    return this.get('delay', modified);
  }

  /**
   * Get the duration for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the duration of this module
   */
  getDuration(modified = true) {
    return this.get('duration', modified);
  }

  /**
   * Get the shield boost for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the shield boost of this module
   */
  getShieldBoost(modified = true) {
    return this.get('shieldboost', modified);
  }

  /**
   * Get the minimum mass for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the minimum mass of this module
   */
  getMinMass(modified = true) {
    // Modifier is optmass
    let result = 0;
    if (this['minmass']) {
      result = this['minmass'];
      if (result && modified) {
        let mult = this.getModValue('optmass') / 10000;
        if (mult) { result = result * (1 + mult); }
      }
    }
    return result;
  }

  /**
   * Get the optimum mass for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the optimum mass of this module
   */
  getOptMass(modified = true) {
    return this.get('optmass', modified);
  }

  /**
   * Get the maximum mass for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the maximum mass of this module
   */
  getMaxMass(modified = true) {
    // Modifier is optmass
    let result = 0;
    if (this['maxmass']) {
      result = this['maxmass'];
      // max mass is only modified for shield generators
      if (result && modified && this.grp === 'sg') {
        let mult = this.getModValue('optmass') / 10000;
        if (mult) { result = result * (1 + mult); }
      }
    }
    return result;
  }

  /**
   * Get the minimum multiplier for this module
   * @param {string} type the type for which we are obtaining the multiplier.  Can be 'speed', 'rotation', 'acceleration', or null
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the minimum multiplier of this module
   */
  getMinMul(type = null, modified = true) {
    // Modifier is optmul
    let result = 0;
    if (this['minmul' + type]) {
      result = this['minmul' + type];
    } else if (this['minmul']) {
      result = this['minmul'];
    }
    if (result && modified) {
      let mult = this.getModValue('optmul') / 10000;
      if (mult) { result = result * (1 + mult); }
    }
    return result;
  }

  /**
   * Get the optimum multiplier for this module
   * @param {string} type the type for which we are obtaining the multiplier.  Can be 'speed', 'rotation', 'acceleration', or null
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the optimum multiplier of this module
   */
  getOptMul(type = null, modified = true) {
    // Modifier is optmul
    let result = 0;
    if (this['optmul' + type]) {
      result = this['optmul' + type];
    } else if (this['optmul']) {
      result = this['optmul'];
    }
    if (result && modified) {
      let mult = this.getModValue('optmul') / 10000;
      if (mult) { result = result * (1 + mult); }
    }
    return result;
  }

  /**
   * Get the maximum multiplier for this module
   * @param {string} type the type for which we are obtaining the multiplier.  Can be 'speed', 'rotation', 'acceleration', or null
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the maximum multiplier of this module
   */
  getMaxMul(type = null, modified = true) {
    // Modifier is optmul
    let result = 0;
    if (this['maxmul' + type]) {
      result = this['maxmul' + type];
    } else if (this['maxmul']) {
      result = this['maxmul'];
    }
    if (result && modified) {
      let mult = this.getModValue('optmul') / 10000;
      if (mult) { result = result * (1 + mult); }
    }
    return result;
  }

  /**
   * Get the damage for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the damage of this module
   */
  getDamage(modified = true) {
    return this.get('damage', modified);
  }

  /**
   * Get the distributor draw for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the distributor draw of this module
   */
  getDistDraw(modified = true) {
    return this.get('distdraw', modified);
  }

  /**
   * Get the thermal load for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the thermal load of this module
   */
  getThermalLoad(modified = true) {
    return this.get('thermload', modified);
  }

  /**
   * Get the rounds per shot for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the rounds per shot of this module
   */
  getRoundsPerShot(modified = true) {
    return this.get('roundspershot', modified);
  }

  /**
   * Get the DPS for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the DPS of this module
   */
  getDps(modified = true) {
    // DPS is a synthetic value
    let damage = this.getDamage(modified);
    let rpshot = this.roundspershot || 1;
    let rof = this.getRoF(modified) || 1;

    return damage * rpshot * rof;
  }

  /**
   * Get the DPE for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the DPE of this module
   */
  getDpe(modified = true) {
    return this.getDps(modified) / this.getEps(modified);
  }

  /**
   * Get the SDPS for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} The SDPS of this module
   */
  getSDps(modified = true) {
    let dps = this.getDps(modified);
    if (this.getClip(modified)) {
      let clipSize = this.getClip(modified);
      // If auto-loader is applied, effective clip size will be nearly doubled
      // as you get one reload for every two shots fired.
      if (this.blueprint && this.blueprint.special && this.blueprint.special.edname === 'special_auto_loader' && modified) {
        clipSize += clipSize - 1;
      }
      let timeToDeplete = clipSize / this.getRoF(modified);
      return dps * timeToDeplete / (timeToDeplete + this.getReload(modified));
    } else {
      return dps;
    }
  }

  /**
   * Get the EPS for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the EPS of this module
   */
  getEps(modified = true) {
    // EPS is a synthetic value
    let distdraw = this.getDistDraw(modified);
    // We don't use rpshot here as dist draw is per combined shot
    let rof = this.getRoF(modified) || 1;

    return distdraw * rof;
  }

  /**
   * Get the HPS for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the HPS of this module
   */
  getHps(modified = true) {
    // HPS is a synthetic value
    let heat = this.getThermalLoad(modified);
    // We don't use rpshot here as dist draw is per combined shot
    let rof = this.getRoF(modified) || 1;

    return heat * rof;
  }

  /**
   * Get the clip size for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the clip size of this module
   */
  getClip(modified = true) {
    // Clip size is always rounded up
    let result = this.get('clip', modified);
    if (result) { result = Math.ceil(result); }
    return result;
  }

  /**
   * Get the ammo size for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the ammo size of this module
   */
  getAmmo(modified = true) {
    return this.get('ammo', modified);
  }

  /**
   * Get the reload time for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the reload time of this module
   */
  getReload(modified = true) {
    return this.get('reload', modified);
  }

  /**
   * Get the burst size for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the burst size of this module
   */
  getBurst(modified = true) {
    return this.get('burst', modified);
  }

  /**
   * Get the burst rate of fire for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the burst rate of fire of this module
   */
  getBurstRoF(modified = true) {
    return this.get('burstrof', modified);
  }

  /**
   * Get the rate of fire for this module.
   * The rate of fire is a combination value, and needs to take in to account
   * bursts of fire.
   * Firing goes [burst 1] [burst interval] [burst 2] [burst interval] ... [burst n] [interval]
   * where 'n' is 'burst', 'burst interval' is '1/burstrof' and 'interval' is '1/rof'
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the rate of fire for this module
   */
  getRoF(modified = true) {
    const burst = this.getBurst(modified) || 1;
    const burstRoF = this.getBurstRoF(modified) || 1;
    const intRoF = this.get('rof', modified);

    return burst / (((burst - 1) / burstRoF) + 1 / intRoF);
  }

  /**
   * Get the facing limit for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the facing limit for this module
   */
  getFacingLimit(modified = true) {
    return this.get('facinglimit', modified);
  }

  /**
   * Get the hull boost for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the hull boost for this module
   */
  getHullBoost(modified = true) {
    return this.get('hullboost', modified);
  }

  /**
   * Get the shield reinforcement for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the shield reinforcement for this module
   */
  getShieldReinforcement(modified = true) {
    return this.get('shieldreinforcement', modified);
  }

  /**
   * Get the shield addition for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the shield addition for this module
   */
  getShieldAddition(modified = true) {
    return this.get('shieldaddition', modified);
  }

  /**
   * Get the jump range boost for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the jump range boost for this module
   */
  getJumpBoost(modified = true) {
    return this.get('jumpboost', modified);
  }

  /**
   * Get the piercing for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the piercing for this module
   */
  getPiercing(modified = true) {
    return this.get('piercing', modified);
  }

  /**
   * Get the bays for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the bays for this module
   */
  getBays(modified) {
    return this.get('bays', modified);
  }

  /**
   * Get the rebuilds per bay for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the rebuilds per bay for this module
   */
  getRebuildsPerBay(modified = true) {
    return this.get('rebuildsperbay', modified);
  }

  /**
   * Get the jitter for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {Number} the jitter for this module
   */
  getJitter(modified = true) {
    return this.get('jitter', modified);
  }

  /**
   * Get the damage distribution for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {string} the damage distribution for this module
   */
  getDamageDist(modified = true) {
    return (modified && this.getModValue('damagedist')) || this.damagedist;
  }

  /**
   * Get the shot speed for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {string} the shot speed for this module
   */
  getShotSpeed(modified = true) {
    return this.get('shotspeed', modified);
  }

  /**
   * Get the spinup for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {string} the spinup for this module
   */
  getSpinup(modified = true) {
    return this.get('spinup', modified);
  }

  /**
   * Get the time for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {string} the time for this module
   */
  getTime(modified = true) {
    return this.get('time', modified);
  }

  /**
   * Get the hack time for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {string} the time for this module
   */
  getHackTime(modified = true) {
    return this.get('hacktime', modified);
  }

  /**
   * Get the scan range for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {string} the time for this module
   */
  getScanRange(modified = true) {
    return this.get('scanrange', modified);
  }

  /**
   * Get the scan angle for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {string} the time for this module
   */
  getScanAngle(modified = true) {
    return this.get('scanangle', modified);
  }

  /**
   * Get the max angle for this module
   * @param {Boolean} [modified=true] Whether to take modifications into account
   * @return {string} the time for this module
   */
  getMaxAngle(modified = true) {
    return this.get('maxangle', modified);
  }
}
