import { EventEmitter } from 'fbemitter';
import { Insurance } from '../shipyard/Constants';

const LS_KEY_BUILDS = 'builds';
const LS_KEY_COMPARISONS = 'comparisons';
const LS_KEY_LANG = 'NG_TRANSLATE_LANG_KEY';
const LS_KEY_COST_TAB = 'costTab';
const LS_KEY_CMDR_NAME = 'cmdrName';
const LS_KEY_OUTFITTING_TAB = 'outfittingTab';
const LS_KEY_INSURANCE = 'insurance';
const LS_KEY_SHIP_DISCOUNT = 'shipDiscount';
const LS_KEY_MOD_DISCOUNT = 'moduleDiscount';
const LS_KEY_STATE = 'state';
const LS_KEY_SIZE_RATIO = 'sizeRatio';
const LS_KEY_TOOLTIPS = 'tooltips';
const LS_KEY_MODULE_RESISTANCES = 'moduleResistances';
const LS_KEY_ROLLS = 'matsPerGrade';

let LS;

/**
 * Safe localstorage put
 * @param  {String} key key
 * @param  {any} value data to store
 */
function _put(key, value) {
  if (LS) {
    LS.setItem(key, typeof value != 'string' ? JSON.stringify(value) : value);
  }
}

/**
 * Safe localstorage get string
 * @param  {String} key key
 * @return {String} The stored string
 */
function _getString(key) {
  return LS ? LS.getItem(key) : null;
}

/**
 * Safe localstorage get
 * @param  {String} key key
 * @return {object | number} The stored data
 */
function _get(key) {
  let str = _getString(key);
  try {
    return str ? JSON.parse(str) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Safe localstorage delete
 * @param  {String} key key
 */
function _delete(key) {
  if (LS) {
    LS.removeItem(key);
  }
}


/**
 * Persist store / service for all user settings. Currently uses localstorage only
 * Should be treated as a singleton / single instance should be used hence why the default
 * export is an instance (see end of this file).
 */
export class Persist extends EventEmitter {
  /**
   * Create an instance
   */
  constructor() {
    super();
    // Eventually check use session over localstorage - 'remember me' logic
    // Safe check to determine if localStorage is enabled
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      LS = localStorage;
    } catch(e) {
      LS = null;
    }

    let moduleResistances = _get(LS_KEY_MODULE_RESISTANCES);
    let matsPerGrade = _get(LS_KEY_ROLLS);
    let cmdrName = _get(LS_KEY_CMDR_NAME);
    let tips = _get(LS_KEY_TOOLTIPS);
    let insurance = _getString(LS_KEY_INSURANCE);
    let shipDiscount = _get(LS_KEY_SHIP_DISCOUNT);
    let moduleDiscount = _get(LS_KEY_MOD_DISCOUNT);
    let buildJson = _get(LS_KEY_BUILDS);
    let comparisonJson = _get(LS_KEY_COMPARISONS);

    this.onStorageChange = this.onStorageChange.bind(this);
    this.langCode = _getString(LS_KEY_LANG) || 'en';
    this.insurance = insurance && Insurance[insurance.toLowerCase()] !== undefined ? insurance : 'standard';
    this.shipDiscount = !isNaN(shipDiscount) && shipDiscount < 1 ? shipDiscount * 1 : 0;
    this.moduleDiscount = !isNaN(moduleDiscount) && moduleDiscount < 1 ? moduleDiscount * 1 : 0;
    this.builds = buildJson && typeof buildJson == 'object' ? buildJson : {};
    this.comparisons = comparisonJson && typeof comparisonJson == 'object' ? comparisonJson : {};
    this.costTab = _getString(LS_KEY_COST_TAB);
    this.outfittingTab = _getString(LS_KEY_OUTFITTING_TAB);
    this.state =  _get(LS_KEY_STATE);
    this.sizeRatio = _get(LS_KEY_SIZE_RATIO) || 1;
    this.matsPerGrade = matsPerGrade || {
      1: 2,
      2: 2,
      3: 3,
      4: 4,
      5: 5
    };
    this.cmdrName = cmdrName || { selected: '', cmdrs: [] };
    this.tooltipsEnabled = tips === null ? true : tips;
    this.moduleResistancesEnabled = moduleResistances === null ? true : moduleResistances;

    if (LS) {
      window.addEventListener('storage', this.onStorageChange);
    }
  }

  /**
   * Listen to storage changes from other windows/tabs
   * and update accordingly
   * @param  {StorageEvent} e Storage Event
   */
  onStorageChange(e) {
    let newValue = e.newValue;

    try {
      switch(e.key) {
        case LS_KEY_BUILDS:
          this.builds = newValue ? JSON.parse(newValue) : {};
          this.emit('builds');
          break;
        case LS_KEY_COMPARISONS:
          this.comparisons = newValue ? JSON.parse(newValue) : {};
          this.emit('comparisons');
          break;
        case LS_KEY_LANG:
          this.langCode = newValue;
          this.emit('language', newValue);
          break;
        case LS_KEY_INSURANCE:
          this.insurance = newValue;
          this.emit('insurance', newValue);
          break;
        case LS_KEY_SHIP_DISCOUNT:
          this.shipDiscount = JSON.parse(newValue);
          this.emit('discounts');
          break;
        case LS_KEY_MOD_DISCOUNT:
          this.moduleDiscount = JSON.parse(newValue);
          this.emit('discounts');
          break;
        case LS_KEY_TOOLTIPS:
          this.tooltipsEnabled = !!newValue && newValue.toLowerCase() == 'true';
          this.emit('tooltips', this.tooltipsEnabled);
          break;
        case LS_KEY_MODULE_RESISTANCES:
          this.moduleResistancesEnabled = !!newValue && newValue.toLowerCase() == 'true';
          this.emit('moduleresistances', this.moduleResistancesEnabled);
          break;
        case LS_KEY_ROLLS:
          this.matsPerGrade = JSON.parse(newValue);
          this.emit('matsPerGrade', this.matsPerGrade);
          break;
      }
    } catch (e) {
      // On JSON.Parse Error - don't sync or do anything
      console && console.error && console.error('Localstorage Sync Error', e); // eslint-disable-line no-console
    }
  }

  /**
   * Get the current language code
   * @return {String} language code
   */
  getLangCode() {
    return this.langCode;
  };

  /**
   * Update and save the current language
   * @param {String} langCode language code
   */
  setLangCode(langCode) {
    this.langCode = langCode;
    _put(LS_KEY_LANG, langCode);
    this.emit('language', langCode);
  }

  /**
   * Show tooltips setting
   * @param  {boolean} show Optional - update setting
   * @return {boolean} True if tooltips should be shown
   */
  showTooltips(show) {
    if (show !== undefined) {
      this.tooltipsEnabled = !!show;
      _put(LS_KEY_TOOLTIPS, this.tooltipsEnabled);
      this.emit('tooltips', this.tooltipsEnabled);
    }

    return this.tooltipsEnabled;
  }

  /**
   * Show module resistances setting
   * @param  {boolean} show Optional - update setting
   * @return {boolean} True if module resistances should be shown
   */
  showModuleResistances(show) {
    if (show !== undefined) {
      this.moduleResistancesEnabled = !!show;
      _put(LS_KEY_MODULE_RESISTANCES, this.moduleResistancesEnabled);
      this.emit('moduleresistances', this.moduleResistancesEnabled);
    }

    return this.moduleResistancesEnabled;
  }

  /**
   * Persist a ship build in local storage.
   *
   * @param  {String} shipId The unique id for a model of ship
   * @param  {String} name   The name of the build
   * @param  {String} code   The serialized code
   */
  saveBuild(shipId, name, code) {
    if (!this.builds[shipId]) {
      this.builds[shipId] = {};
    }
    this.builds[shipId][name] = code;
    _put(LS_KEY_BUILDS, this.builds);
    this.emit('builds');
  }

  /**
   * Get the serialized code/string for a build. Returns null if a
   * build is not found.
   *
   * @param  {String} shipId The unique id for a model of ship
   * @param  {String} name   The name of the build
   * @return {String}        The serialized build string.
   */
  getBuild(shipId, name) {
    if (this.builds[shipId] && this.builds[shipId][name]) {
      return this.builds[shipId][name];
    }
    return null;
  }

  /**
   *  Get all builds (object) or builds for a specific ship (array)
   * @param  {String} shipId Optional Ship Id
   * @return {Object | Array} Object if Ship Id is not provided
   */
  getBuilds(shipId) {
    if(shipId && shipId.length > 0) {
      return this.builds[shipId];
    }
    return this.builds;
  }

  /**
   * Get an array of all builds names for a ship
   * @param  {String} shipId Ship Id
   * @return {Array}  Array of string or empty array
   */
  getBuildsNamesFor(shipId) {
    if (this.builds[shipId]) {
      return Object.keys(this.builds[shipId]).sort();
    } else {
      return [];
    }
  }

  /**
   * Check if a build has been saved
   * @param  {String} shipId  Ship Id
   * @param  {String} name    Build name
   * @return {Boolean}        True if the build exists
   */
  hasBuild(shipId, name) {
    return this.builds[shipId] && this.builds[shipId][name];
  }

  /**
   * Check if any builds have been saved
   * @return {Boolean} True if any builds have been saved
   */
  hasBuilds() {
    return Object.keys(this.builds).length > 0;
  }

  /**
   * Delete a build from local storage. It will also delete the ship build collection if
   * it becomes empty
   *
   * @param  {String} shipId The unique id for a model of ship
   * @param  {String} name   The name of the build
   */
  deleteBuild(shipId, name) {
    if (this.builds[shipId][name]) {
      delete this.builds[shipId][name];
      if (Object.keys(this.builds[shipId]).length === 0) {
        delete this.builds[shipId];
      }
      _put(LS_KEY_BUILDS, this.builds);
      // Check if the build was used in existing comparisons
      let comps = this.comparisons;
      for (let c in comps) {
        for (let i = 0; i < comps[c].builds.length; i++) {  // For all builds in the current comparison
          if (comps[c].builds[i].shipId == shipId && comps[c].builds[i].buildName == name) {
            comps[c].builds.splice(i, 1);
            break;  // A build is unique per comparison
          }
        }
      }
      _put(LS_KEY_COMPARISONS, this.comparisons);
      this.emit('builds');
    }
  }

  /**
   * Persist a comparison in localstorage.
   *
   * @param  {String} name   The name of the comparison
   * @param  {array} builds  Array of builds
   * @param  {array} facets  Array of facet indices
   */
  saveComparison(name, builds, facets) {
    if (!this.comparisons[name]) {
      this.comparisons[name] = {};
    }
    this.comparisons[name] = {
      facets,
      builds: builds.map(b => { return { shipId: b.id || b.shipId, buildName: b.buildName }; })
    };
    _put(LS_KEY_COMPARISONS, this.comparisons);
    this.emit('comparisons');
  }

  /**
   * Get a comparison
   * @param  {String} name Comparison name
   * @return {Object}      Object containing array of facets and ship id + build names
   */
  getComparison(name) {
    if (this.comparisons[name]) {
      return this.comparisons[name];
    }
    return null;
  }

  /**
   * Get all saved comparisons
   * @return {Object} All comparisons
   */
  getComparisons() {
    return this.comparisons;
  }

  /**
   * Check if a comparison has been saved
   * @param  {String}  name Comparison name
   * @return {Boolean}      True if a comparison has been saved
   */
  hasComparison(name) {
    return !!this.comparisons[name];
  }

  /**
   * Check if any comparisons have been saved
   * @return {Boolean} True if any comparisons have been saved
   */
  hasComparisons() {
    return Object.keys(this.comparisons).length > 0;
  }

  /**
   * Removes the comparison from localstorage.
   * @param  {String} name Comparison name
   */
  deleteComparison(name) {
    if (this.comparisons[name]) {
      delete this.comparisons[name];
      _put(LS_KEY_COMPARISONS, this.comparisons);
      this.emit('comparisons');
    }
  }

  /**
   * Delete all builds and comparisons from localStorage
   */
  deleteAll() {
    this.builds = {};
    this.comparisons = {};
    _put(LS_KEY_BUILDS, {});
    _put(LS_KEY_COMPARISONS, {});
    this.emit('deletedAll');
  }

  /**
   * Get all saved data and settings
   * @return {Object} Data and settings
   */
  getAll() {
    let data = {};
    data[LS_KEY_BUILDS] = this.getBuilds();
    data[LS_KEY_COMPARISONS] = this.getComparisons();
    data[LS_KEY_INSURANCE] = this.getInsurance();
    data[LS_KEY_SHIP_DISCOUNT] = this.shipDiscount;
    data[LS_KEY_MOD_DISCOUNT] = this.moduleDiscount;
    return data;
  }

  /**
   * Get the saved insurance type
   * @return {String} The name of the saved insurance type of null
   */
  getInsurance() {
    return this.insurance.toLowerCase();
  }

  /**
   * Persist selected insurance type
   * @param {String} insurance Insurance type name
   */
  setInsurance(insurance) {
    this.insurance = insurance.toLowerCase();
    _put(LS_KEY_INSURANCE, this.insurance);
    this.emit('insurance', this.insurance);
  }

  /**
   * Persist selected ship discount
   * @param {number} shipDiscount Discount value/amount
   */
  setShipDiscount(shipDiscount) {
    this.shipDiscount = shipDiscount;
    _put(LS_KEY_SHIP_DISCOUNT, this.shipDiscount);
    this.emit('discounts');
  }

  /**
   * Get the saved ship discount
   * @return {number} val Discount value/amount
   */
  getShipDiscount() {
    return this.shipDiscount;
  };

  /**
   * Persist selected module discount
   * @param {number} moduleDiscount Discount value/amount
   */
  setModuleDiscount(moduleDiscount) {
    this.moduleDiscount = moduleDiscount;
    _put(LS_KEY_MOD_DISCOUNT, this.moduleDiscount);
    this.emit('discounts');
  }

  /**
   * Get the saved ship discount
   * @return {number} val Discount value/amount
   */
  getModuleDiscount() {
    return this.moduleDiscount;
  }

  /**
   * Get the saved ship discount
   * @param {Object} matsPerGrade # of rolls per grade
   */
  setRolls(matsPerGrade) {
    this.matsPerGrade = matsPerGrade;
    _put(LS_KEY_ROLLS, this.matsPerGrade);
    this.emit('matsPerGrade');
  }
  /**
   * Get the saved Mats per grade
   * @return {Object} # of rolls per grade
   */
  getRolls() {
    return this.matsPerGrade;
  }

  /**
   * Get the saved Mats per grade
   * @return {Object} # of rolls per grade
   */
  getCmdr() {
    return this.cmdrName;
  }

  /**
   * Persist selected cost tab
   * @param {number} tabName Cost tab name
   */
  setCostTab(tabName) {
    this.costTab = tabName;
    _put(LS_KEY_COST_TAB, tabName);
  }

  /**
   * Persist cmdr name
   * @param {Object} cmdrName Commander name for EDEngineer
   */
  setCmdr(cmdrName) {
    this.cmdrName = cmdrName;
    _put(LS_KEY_CMDR_NAME, cmdrName);
    this.emit('cmdr');
  }

  /**
   * Get the saved  discount
   * @return {number} val Discount value/amount
   */
  getCostTab() {
    return this.costTab;
  }

  /**
   * Persist selected outfitting tab
   * @param {string} tabName Cost tab name
   */
  setOutfittingTab(tabName) {
    this.outfittingTab = tabName;
    _put(LS_KEY_OUTFITTING_TAB, tabName);
  }
  /**
   * Get the current outfitting tab
   * @return {string} the current outfitting tab
   */
  getOutfittingTab() {
    return this.outfittingTab;
  }

  /**
   * Retrieve the last router state from local storage
   * @return {Object} state State object containing state name and params
   */
  getState() {
    return this.state;
  }

  /**
   * Save the current router state to localstorage
   * @param {Object} state State object containing state name and params
   */
  setState(state) {
    this.state = state;
    _put(LS_KEY_STATE, state);
  }

  /**
   * Retrieve the last router state from local storage
   * @return {number} size Ratio
   */
  getSizeRatio() {
    return this.sizeRatio;
  }

  /**
   * Save the current size ratio to localstorage
   * @param {number} sizeRatio Size ratio scale
   */
  setSizeRatio(sizeRatio) {
    if (sizeRatio != this.sizeRatio) {
      this.sizeRatio = sizeRatio;
      _put(LS_KEY_SIZE_RATIO, sizeRatio);
      this.emit('sizeRatio', sizeRatio);
    }
  }

  /**
   * Check if localStorage is enabled/active
   * @return {Boolean} True if localStorage is enabled
   */
  isEnabled() {
    return LS != null;
  }
}

// Export an instance as the default to use as a singleton
export default new Persist();
