import { ModuleNameToGroup, BulkheadNames, StandardArray } from './Constants';
import ModuleSet from './ModuleSet';
import Module from './Module';
import { Ships, Modules } from 'coriolis-data/dist';

/*
 * All functions below must return a fresh Module rather than a definition or existing module, as
 * the resultant object can be altered with modifications.
 */


/**
 * Created a cargo hatch model
 * @return {Object} Cargo hatch model
 */
export function cargoHatch() {
  let hatch = new Module();
  Object.assign(hatch, { name: 'Cargo Hatch', class: 1, rating: 'H', power: 0.6 });
  return hatch;
};

/**
 * Finds the module with the specific group and ID
 * @param  {String} grp           Module group (pp - power plant, pl - pulse laser etc)
 * @param  {String} id            The module ID
 * @return {Object}               The module or null
 */
export function findModule(grp, id) {
  // See if it's a standard module
  if (Modules.standard[grp]) {
    let standardmod = Modules.standard[grp].find(e => e.id == id);
    if (standardmod != null) {
      return new Module({ template: standardmod });
    }
  }

  // See if it's an internal module
  if (Modules.internal[grp]) {
    let internalmod = Modules.internal[grp].find(e => e.id == id);
    if (internalmod != null) {
      return new Module({ template: internalmod });
    }
  }

  // See if it's a hardpoint module
  if (Modules.hardpoints[grp]) {
    let hardpointmod = Modules.hardpoints[grp].find(e => e.id == id);
    if (hardpointmod != null) {
      return new Module({ template: hardpointmod });
    }
  }

  return null;
}

/**
 * Finds the standard module type with the specified ID
 * @param  {String|Number} type   Standard Module Type (0/pp - Power Plant, 1/t - Thrusters, etc)
 * @param  {String} id            The module ID or '[Class][Rating]'
 * @return {Object}               The standard module or null
 */
export function standard(type, id) {
  if (!isNaN(type)) {
    type = StandardArray[type];
  }
  let s = Modules.standard[type].find(e => e.id === id);
  if (!s) {
    s = Modules.standard[type].find(e => (e.class == id.charAt(0) && e.rating == id.charAt(1)));
  }
  if (s) {
    s = new Module({ template: s });
  }
  return s || null;
};

/**
 * Finds the hardpoint with the specified ID
 * @param  {String} id Hardpoint ID
 * @return {Object}    Hardpoint module or null
 */
export function hardpoints(id) {
  for (let n in Modules.hardpoints) {
    let group = Modules.hardpoints[n];
    for (let i = 0; i < group.length; i++) {
      if (group[i].id == id) {
        return new Module({ template: group[i] });
      }
    }
  }
  return null;
};

/**
 * Finds the internal module with the specified ID
 * @param  {String} id Internal module ID
 * @return {Object}    Internal module or null
 */
export function internal(id) {
  for (let n in Modules.internal) {
    let group = Modules.internal[n];
    for (let i = 0; i < group.length; i++) {
      if (group[i].id == id) {
        return new Module({ template: group[i] });
      }
    }
  }
  return null;
};

/**
 * Finds a standard module based on Class, Rating, Group and/or name.
 * At least one of Group name or unique module name must be provided
 *
 * @param  {String} groupName [Optional] Full name or abbreviated name for module group
 * @param  {integer} clss     module Class
 * @param  {String} rating    module Rating
 * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
 * @return {Object}           The module if found, null if not found
 */
export function findStandard(groupName, clss, rating, name) {
  let groups = {};

  if (groupName) {
    if (Modules.standard[groupName]) {
      groups[groupName] = Modules.standard[groupName];
    } else {
      let grpCode = ModuleNameToGroup[groupName.toLowerCase()];
      if (grpCode && Modules.standard[grpCode]) {
        groups[grpCode] = Modules.standard[grpCode];
      }
    }
  } else if (name) {
    groups = Modules.standard;
  }

  for (let g in groups) {
    let group = groups[g];
    for (let i = 0, l = group.length; i < l; i++) {
      if (group[i].class == clss && group[i].rating == rating && ((!name && !group[i].name) || group[i].name == name)) {
        return group[i];
      }
    }
  }

  return null;
}

/**
 * Finds a standard Module ID based on Class, Rating, Group and/or name.
 * At least one of Group name or unique module name must be provided
 *
 * @param  {String} groupName [Optional] Full name or abbreviated name for module group
 * @param  {integer} clss     module Class
 * @param  {String} rating    Module Rating
 * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
 * @return {String}           The id of the module if found, null if not found
 */
export function findStandardId(groupName, clss, rating, name) {
  let i = this.findStandard(groupName, clss, rating, name);
  return i ? i.id : 0;
}

/**
 * Finds an internal module based on Class, Rating, Group and/or name.
 * At least one ofGroup name or unique module name must be provided
 *
 * @param  {String} groupName [Optional] Full name or abbreviated name for module group
 * @param  {integer} clss     module Class
 * @param  {String} rating    module Rating
 * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
 * @return {Object}           The module if found, null if not found
 */
export function findInternal(groupName, clss, rating, name) {
  let groups = {};

  if (groupName) {
    if (Modules.internal[groupName]) {
      groups[groupName] = Modules.internal[groupName];
    } else {
      let grpCode = ModuleNameToGroup[groupName.toLowerCase()];
      if (grpCode && Modules.internal[grpCode]) {
        groups[grpCode] = Modules.internal[grpCode];
      }
    }
  } else if (name) {
    groups = Modules.internal;
  }

  for (let g in groups) {
    let group = groups[g];
    for (let i = 0, l = group.length; i < l; i++) {
      if (group[i].class == clss && group[i].rating == rating && ((!name && !group[i].name) || group[i].name == name)) {
        return group[i];
      }
    }
  }

  return null;
}

/**
 * Finds an internal module based on Class, Rating, Group and/or name.
 * At least one of Group name or unique module name must be provided.
 * will start searching at specified class and proceed lower until a
 * module is found or 0 is hit
 * Uses findInternal internally
 *
 * @param  {String} groupName [Optional] Full name or abbreviated name for module group
 * @param  {integer} clss     module Class
 * @param  {String} rating    module Rating
 * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
 * @return {Object}           The module if found, null if not found
 */
export function findMaxInternal(groupName, clss, rating, name) {
  let foundModule = null;
  let currentClss = clss;
  while (currentClss > 0 && foundModule == null) {
    foundModule = findInternal(groupName, currentClss, rating, name);
    currentClss = currentClss - 1;
  }
  return foundModule;
}

/**
 * Finds an internal Module ID based on Class, Rating, Group and/or name.
 * At least one ofGroup name or unique module name must be provided
 *
 * @param  {String} groupName [Optional] Full name or abbreviated name for module group
 * @param  {integer} clss     module Class
 * @param  {String} rating    Module Rating
 * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
 * @return {String}           The id of the module if found, null if not found
 */
export function findInternalId(groupName, clss, rating, name) {
  let i = this.findInternal(groupName, clss, rating, name);
  return i ? i.id : 0;
}

/**
 * Finds a hardpoint Module based on Class, Rating, Group and/or name.
 * At least one ofGroup name or unique module name must be provided
 *
 * @param  {String} groupName [Optional] Full name or abbreviated name for module group
 * @param  {integer} clss     Module Class
 * @param  {String} rating    [Optional] module Rating
 * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Heat Sink Launcher'
 * @param  {String} mount     Mount type - [F]ixed, [G]imballed, [T]urret
 * @param  {String} missile   [Optional] Missile type - [D]umbfire, [S]eeker
 * @return {String}           The id of the module if found, null if not found
 */
export function findHardpoint(groupName, clss, rating, name, mount, missile) {
  let groups = {};

  if (groupName) {
    if (Modules.hardpoints[groupName]) {
      groups[groupName] = Modules.hardpoints[groupName];
    } else {
      let grpCode = ModuleNameToGroup[groupName.toLowerCase()];
      if (grpCode && Modules.hardpoints[grpCode]) {
        groups[grpCode] = Modules.hardpoints[grpCode];
      }
    }
  } else if (name) {
    groups = Modules.hardpoints;
  }

  for (let g in groups) {
    let group = groups[g];
    for (let h of group) {
      if (h.class == clss && (!rating || h.rating == rating) && h.mount == mount && h.name == name && h.missile == missile) {
        return h;
      }
    }
  }

  return null;
}

/**
 * Finds a hardpoint module ID based on Class, Rating, Group and/or name.
 * At least one of Group name or unique module name must be provided
 *
 * @param  {String} groupName [Optional] Full name or abbreviated name for module group
 * @param  {integer} clss     module Class
 * @param  {String} rating    module Rating
 * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Heat Sink Launcher'
 * @param  {String} mount     Mount type - [F]ixed, [G]imballed, [T]urret
 * @param  {String} missile   [Optional] Missile type - [D]umbfire, [S]eeker
 * @return {String}           The id of the module if found, null if not found
 */
export function findHardpointId(groupName, clss, rating, name, mount, missile) {
  let h = this.findHardpoint(groupName, clss, rating, name, mount, missile);
  if (h) {
    return h.id;
  }

  // Countermeasures used to be lumped in a single group but have been broken, out.  If we have been given a groupName of 'Countermeasure' then
  // rely on the unique name to find it
  if (groupName === 'cm' || groupName === 'Countermeasure') {
    h = this.findHardpoint(null, clss, rating, name, mount, missile);
  }

  return h ? h.id : 0;
}

/**
 * Get the bulkhead index for the given bulkhead name
 * @param  {String} bulkheadName Bulkhead name in english
 * @return {number}              Bulkhead index
 */
export function bulkheadIndex(bulkheadName) {
  return BulkheadNames.indexOf(bulkheadName);
}

/*
 * Categorisation of module groups
 */
const INTGRPCAT = {
  'am': 'auto field-maintenance unit',
  'cr': 'cargo racks',
  'crl': 'cargo racks',
  'dc': 'docking computers',
  'fi': 'fsd interdictor',
  'ft': 'fuel',
  'fs': 'fuel',
  'fh': 'hangars',
  'pv': 'hangars',
  'cc': 'limpet controllers',
  'fx': 'limpet controllers',
  'hb': 'limpet controllers',
  'pc': 'limpet controllers',
  'rpl': 'limpet controllers',
  'mlc': 'limpet controllers',
  'pce': 'passenger cabins',
  'pci': 'passenger cabins',
  'pcm': 'passenger cabins',
  'pcq': 'passenger cabins',
  'rf': 'refineries',
  'sg': 'shields',
  'bsg': 'shields',
  'psg': 'shields',
  'scb': 'shields',
  'hr': 'structural reinforcement',
  'mrp': 'structural reinforcement',
  // Assists
  'dc': 'flight assists',
  'sua': 'flight assists',
  // Scanners
  'ss': 'scanners',
  // Experimental
  'rcpl': 'experimental',
  'dtl': 'experimental',
  'mahr': 'experimental',
  'rsl': 'experimental',
  // Stabilizers
  'ews': 'weapon stabilizers',
  // Guardian
  'gsrp': 'guardian',
  'gfsb': 'guardian',
  'ghrp': 'guardian',
  'gmrp': 'guardian',
};

export const HardpointCategories = {
  // Lasers
  'bl': 'lasers',
  'pl': 'lasers',
  'ul': 'lasers',
  // Projectiles
  'c': 'projectiles',
  'mc': 'projectiles',
  'advmc': 'projectiles',
  'fc': 'projectiles',
  'pa': 'projectiles',
  'rg': 'projectiles',
  // Ordnance
  'mr': 'ordnance',
  'amr': 'ordnance',
  'tp': 'ordnance',
  'nl': 'ordnance',
  // Mining
  'ml': 'mining',
  'scl': 'mining',
  'sdm': 'mining',
  'abl': 'mining',
  'mvr': 'mining',
  'pwa': 'mining',
  // Experimental
  'axmc': 'experimental',
  'axmce': 'experimental',
  'axmr': 'experimental',
  'axmre': 'experimental',
  'ntp': 'experimental',
  'rfl': 'experimental',
  'tbrfl': 'experimental',
  'tbsc': 'experimental',
  'tbem': 'experimental',
  'xs': 'experimental',
  'sfn': 'experimental',
  // Guardian
  'gpc': 'guardian',
  'ggc': 'guardian',
  'gsc': 'guardian',
};


/**
 * Get the categories for a given Internal slot
 * @param {*} slot
 * @param {*} INTGRPCAT
 */
export function getIntCategoriesForSlot(slot) {
  // For each module in INTGRPCAT, check if any of that module type from Modules can fit in the slot.
  // If the module type has a suitable candidate for the slot, add that category to the categories list
  // And skip to the next module in INTGRPCAT that isn't in the same category.
  // Check if the slot is a restricted slot
  const eligibleGroups = slot.eligible;

  // Set categories to an empty object
  const categories = {};
  for (const grp in INTGRPCAT) {
    if (slot.eligible && !(grp in eligibleGroups)) {
      // If this group is not eligible for the slot, skip it
      console.log(`Skipping group ${grp} as it is not eligible for the slot.`);
      continue;
    }
    const group = Modules.internal[grp];
    if (group) {
      for (const m of group) {
        if (m.class <= slot.maxClass) {
          if (!slot.eligible && (grp === 'crl')) {
            // 'crl' (Large Cargo Racks) can only be mounted in special 'Cargo' slots
            console.log(`Skipping group ${grp} as it is not a Cargo slot.`);
            continue;
          }

          categories[INTGRPCAT[grp]] = true;
          break; // No need to check further in this group
        }
      }
    }
  }
  return categories;
}

/**
 * Get the categories for a given Hardpoint/Utility slot
 * @param {object} slot The slot object
 * @returns {object} A map of valid category names
 */
export function getHpCategoriesForSlot(slot) {
  const categories = {};
  const groupsToCheck = Object.keys(Modules.hardpoints);

  for (const grp of groupsToCheck) {
    if (slot.eligible && !slot.eligible[grp]) {
      // If this group is not eligible for the slot, skip it
      continue;
    }

    if (HardpointCategories[grp]) {
      const moduleGroup = Modules.hardpoints[grp];
      if (moduleGroup) {
        for (const m of moduleGroup) {
          // Check if module class fits and if it's the right type (weapon/utility)
          if (m.class <= slot.maxClass && (slot.maxClass > 0 ? m.class > 0 : m.class === 0)) {
            categories[HardpointCategories[grp]] = true;
            break;
          }
        }
      }
    }
  }
  return categories;
}

/**
 * Determine if a module group is a shield generator
 * @param  {String}  g Module Group name
 * @return {Boolean}   True if the group is a shield generator
 */
export function isShieldGenerator(g) {
  return g == 'sg' || g == 'psg' || g == 'bsg';
}

/**
 * Creates a new ModuleSet that contains all available modules
 * that the specified ship is eligible to use.
 *
 * 6.5 T is the lightest possible mass of standard components that any ship can use
 *
 * @param  {String} shipId    Unique ship Id/Key
 * @return {ModuleSet}     The set of modules the ship can install
 */
export function forShip(shipId) {
  return new ModuleSet(Modules, Ships[shipId]);
}
