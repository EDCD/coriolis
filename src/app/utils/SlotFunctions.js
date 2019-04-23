import React from 'react';
import Persist from '../stores/Persist';
import * as ModuleUtils from '../shipyard/ModuleUtils';
import Module from '../shipyard/Module';

/**
 * Determine if a slot on a ship can mount a module of a particular class and group
 * @param  {Object} ship    Ship object
 * @param  {Object} slot    Slot object
 * @param  {String} group   Module group/type abbrivation/code
 * @param  {Integer} clazz  [Optional] Module Class/Size
 * @return {Boolean}        True if the slot can mount the module
 */
export function canMount(ship, slot, group, clazz) {
  if (slot &&
      (!slot.eligible || slot.eligible[group]) &&
      (group != 'pcq' || (ship.luxuryCabins && ship.luxuryCabins  === true)) &&
      (group != 'fh' || (ship.fighterHangars && ship.fighterHangars  === true)) &&
      (clazz === undefined || slot.maxClass >= clazz)) {
    return true;
  }
  return false;
}

/**
 * Returns the translate name for the module mounted in the specified
 * slot.
 * @param  {function} translate Translation function
 * @param  {object} slot      Slot object
 * @return {string}           The translated name
 */
export function slotName(translate, slot) {
  return slot.m ? translate(slot.m.name || slot.m.grp) : '';
}

/**
 * Slot name comparator
 * @param  {Function} translate Translate function
 * @param  {Object} a           Slot object
 * @param  {Object} b           Slot object
 * @return {Number}             1, 0, -1
 */
export function nameComparator(translate, a, b) {
  return translate(a.name || a.grp).localeCompare(translate(b.name || b.grp));
}

/**
 * Generates an internationalization friendly slot comparator that will
 * sort by specified property (if provided) then by name/group, class, rating
 * @param  {function} translate       Tranlation function
 * @param  {function} propComparator  Optional property comparator
 * @param  {boolean} desc             Use descending order
 * @return {function}                 Comparator function for slot names
 */
export function slotComparator(translate, propComparator, desc) {
  return (a, b) => {
    // retain descending order when sorting sorting by name/group/class/rating
    let am = a.m; // Slot A's mounted module
    let bm = b.m; // Slot B's mounted module

    if (!desc) {  // Flip A and B if ascending order
      let t = a;
      a = b;
      b = t;
    }

    // Check for empty slots first
    if (a.m && !b.m) {
      return 1;
    } else if (!a.m && b.m) {
      return -1;
    } else if (!a.m && !b.m) {
      return 0;
    }
    // If a property comparator is provided use it first
    let diff = propComparator ? propComparator(a, b) : nameComparator(translate, a.m, b.m);

    if (diff) {
      return diff;
    }

    // Property matches so sort by name / group, then class, rating
    if (am.name === bm.name && am.grp === bm.grp) {
      if(am.class == bm.class) {
        return am.rating > bm.rating ? 1 : -1;
      }
      return am.class - bm.class;
    }

    return nameComparator(translate, am, bm);
  };
}

/**
 * Determine the appropriate class based on diff value
 * @param  {Number} a         Potential Module (cannot be null)
 * @param  {Number} b         Currently mounted module (optional - null)
 * @param  {Boolean} negative A positive diff has a negative implication
 * @return {String}           CSS Class name
 */
function diffClass(a, b, negative) {
  if (b === undefined || a === b) {
    return 'muted';
  } else if (a > b) {
    return negative ? 'warning' : 'secondary';
  }
  return negative ? 'secondary' : 'warning';
}

/**
 * Determine the displayable diff of a module's proprty
 * @param  {Function} format    Formatter
 * @param  {Number} mVal        Potential Module property value
 * @param  {Number} mmVal       Currently mounted module property value
 * @return {string | React.Component} Component to be rendered
 */
function diff(format, mVal, mmVal) {
  if (mVal == Infinity) {
    return '∞';
  } else {
    let diff = mVal - mmVal;
    if (!diff || mVal === undefined || diff == mVal || Math.abs(diff) == Infinity) {
      return format(mVal);
    }
    return `${format(mVal)} (${diff > 0 ? '+' : ''}${format(diff)})`;
  }
}

/**
 * Returns a a summary and diff of the potential module
 * versus the currently mounted module if there is one. Must be bound
 * to a ship instance
 *
 * @this {Ship}
 * @param  {Object} language Current language
 * @param  {Object} m        Potential Module (cannot be null)
 * @param  {Object} mm       Currently mounted module (optional - null if empty)
 * @return {React.Component} Component to be rendered
 */
export function diffDetails(language, m, mm) {
  let { formats, translate, units } = language;
  let propDiffs = [];
  m = new Module(m);

  // Module-specific items

  if (m.grp === 'pp') {
    let mPowerGeneration = m.getPowerGeneration() || 0;
    let mmPowerGeneration = mm ? mm.getPowerGeneration() : 0;
    if (mPowerGeneration != mmPowerGeneration) propDiffs.push(<div key='pgen'>{translate('pgen')}: <span className={diffClass(mPowerGeneration, mmPowerGeneration)}>{diff(formats.round, mPowerGeneration, mmPowerGeneration)}{units.MW}</span></div>);
  } else {
    let mPowerUsage = m.getPowerUsage() || 0;
    let mmPowerUsage = mm ? mm.getPowerUsage() || 0 : 0;
    if (mPowerUsage != mmPowerUsage) propDiffs.push(<div key='power'>{translate('power')}: <span className={diffClass(mPowerUsage, mmPowerUsage, true)}>{diff(formats.round, mPowerUsage, mmPowerUsage)}{units.MW}</span></div>);
  }

  let mDps = m.getDps() || 0;
  let mmDps = mm ? mm.getDps() || 0 : 0;
  if (mDps && mDps != mmDps) propDiffs.push(<div key='dps'>{translate('dps')}: <span className={diffClass(mmDps, mDps, true)}>{diff(formats.round, mDps, mmDps)}</span></div>);

  let mAffectsShield = ModuleUtils.isShieldGenerator(m.grp)  || m.grp == 'sb';
  let mmAffectsShield = mm ? ModuleUtils.isShieldGenerator(m.grp) || mm.grp == 'sb' : false;
  if (mAffectsShield || mmAffectsShield) {
    let shield = this.calcShieldStrengthWith(); // Get shield strength regardless of slot active / inactive
    let newShield = 0;

    if (mAffectsShield) {
      if (m.grp == 'sb') {  // Both m and mm must be utility modules if this is true
        newShield = this.calcShieldStrengthWith(null, m.getShieldBoost() - (mm ? mm.getShieldBoost() || 0 : 0));
      } else {
        newShield = this.calcShieldStrengthWith(m);
      }
    } else {
      // Old module must be a shield booster
      newShield = this.calcShieldStrengthWith(null, -mm.getShieldBoost());
    }

    let sgDiffClass = Math.round((newShield - shield) * 100) / 100 == 0 ? 'muted' : (newShield > shield ? 'secondary' : 'warning');

    propDiffs.push(<div key='shields'>{translate('shields')}: <span className={sgDiffClass}>{diff(formats.int, newShield, shield)}{units.MJ}</span></div>);
  }

  if (m.grp === 'mrp') {
    let mProtection = m.getProtection();
    let mmProtection = mm ? mm.getProtection() || 0 : 0;
    if (mProtection != mmProtection) {
      propDiffs.push(<div key='protection'>{translate('protection')}: <span className={diffClass(mmProtection, mProtection, true)}>{diff(formats.pct, mProtection, mmProtection)}</span></div>);
    }
  }

  if (m.grp === 'hr') {
    let mHullReinforcement = m.getHullReinforcement();
    let mmHullReinforcement = mm ? mm.getHullReinforcement() || 0 : 0;
    if (mHullReinforcement && mHullReinforcement != mmHullReinforcement) propDiffs.push(<div key='hullreinforcement'>{translate('hullreinforcement')}: <span className={diffClass(mmHullReinforcement, mHullReinforcement, true)}>{diff(formats.round, mHullReinforcement, mmHullReinforcement)}</span></div>);
  }

  if (m.grp == 'pd') {
    propDiffs.push(<div key='wep'>
      {`${translate('WEP')}: `}
      <span className={diffClass(m.wepcap, mm.getWeaponsCapacity())}>{m.wepcap}{units.MJ}</span>
      {' / '}
      <span className={diffClass(m.weprate, mm.getWeaponsRechargeRate())}>{m.weprate}{units.MW}</span>
    </div>);
    propDiffs.push(<div key='sys'>
      {`${translate('SYS')}: `}
      <span className={diffClass(m.syscap, mm.getSystemsCapacity())}>{m.syscap}{units.MJ}</span>
      {' / '}
      <span className={diffClass(m.sysrate, mm.getSystemsRechargeRate())}>{m.sysrate}{units.MW}</span>
    </div>);
    propDiffs.push(<div key='eng'>
      {`${translate('ENG')}: `}
      <span className={diffClass(m.engcap, mm.getEnginesCapacity())}>{m.engcap}{units.MJ}</span>
      {' / '}
      <span className={diffClass(m.engrate, mm.getEnginesRechargeRate())}>{m.engrate}{units.MW}</span>
    </div>);
  }

  // Common items

  let mCost = m.cost || 0;
  let mmCost = mm ? mm.cost : 0;
  if (mCost != mmCost) propDiffs.push(<div key='cost'>{translate('cost')}: <span className={diffClass(mCost, mmCost, true) }>{formats.int(mCost ? Math.round(mCost * (1 - Persist.getModuleDiscount())) : 0)}{units.CR}</span></div>);

  let mMass = m.getMass() || 0;
  let mmMass = mm ? mm.getMass() : 0;
  if (mMass != mmMass) propDiffs.push(<div key='mass'>{translate('mass')}: <span className={diffClass(mMass, mmMass, true)}>{diff(formats.round, mMass, mmMass)}{units.T}</span></div>);

  let massDiff = mMass - mmMass;
  let mCap = m.fuel || m.cargo || 0;
  let mmCap = mm ? mm.fuel || mm.cargo || 0 : 0;
  let capDiff = mCap - mmCap;
  if (m.grp == 'fsd' || massDiff || capDiff) {
    let fsd = m.grp == 'fsd' ? m : null;
    let maxRange = this.calcUnladenRange(massDiff, m.fuel, fsd);
    let ladenRange = this.calcLadenRange(massDiff + capDiff, m.fuel, fsd);

    if (maxRange != this.unladenRange) {
      propDiffs.push(<div key='maxRange'>{translate('max')} {translate('jump range')}: <span className={maxRange > this.unladenRange ? 'secondary' : 'warning'}>{formats.round(maxRange)}{units.LY}</span></div>);
    }
    if (ladenRange != this.ladenRange) {
      propDiffs.push(<div key='unladenRange'>{translate('laden')} {translate('jump range')}: <span className={ladenRange > this.ladenRange ? 'secondary' : 'warning'}>{formats.round(ladenRange)}{units.LY}</span></div>);
    }
  }

  let mIntegrity = m.getIntegrity() || 0;
  let mmIntegrity = mm ? mm.getIntegrity() || 0 : 0;
  if (mIntegrity != mmIntegrity) {
    propDiffs.push(<div key='integrity'>{translate('integrity')}: <span className={diffClass(mmIntegrity, mIntegrity, true)}>{diff(formats.round, mIntegrity, mmIntegrity)}</span></div>);
  }

  return propDiffs.length > 0 ? <div className='cap' style={{ whiteSpace: 'nowrap' }}>{propDiffs}</div> : null;
}
