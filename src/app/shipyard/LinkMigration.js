/**
 * LinkMigration.js
 *
 * Handles decoding of OLD-style (v1/v2, 'A'/digit) build links for the small set
 * of ships that gained or re-sized internal slots after those links could have
 * been created. Old-style links are positional against the ship's PRE-CHANGE
 * coriolis-data `slots.internal` order; the live data now uses the NEW order
 * (matching coriolis-data/ships/ship-slots.json). This module remaps a decoded
 * old-order internal array onto the new order so modules land in their original
 * slots and genuinely-new slots are left empty.
 *
 * It also powers old-style imports (journal / Companion API) for the same ships.
 *
 * The remap is purely data-driven: bucket OLD slots by (kind|class) in order, then
 * walk the NEW layout and let each NEW slot claim the next OLD module from its
 * matching bucket. New slots with no matching OLD module stay empty; surplus OLD
 * modules (an old-style link that DOES carry enough to fill a new slot) fall into
 * the new slots in order. See coriolis/docs/link-format-v3.md.
 */

import { Ships } from 'coriolis-data/dist';

/**
 * PRE-CHANGE internal layouts, as the kind+class of each slot in the order that
 * old (v1/v2) links are positional against. Keyed by coriolis ship id.
 *
 * kind: 'num' (ordinary numbered slot), 'mil' (Military), 'cargo' (Cargo),
 *       'pas' (PlanetaryApproachSuite). Only ships that CHANGED are listed; any
 *       ship not present here has no migration and uses the normal path.
 *
 * Captured 2026-10-23 from coriolis-data prior to adopting ship-slots.json order.
 */
export const OLD_INTERNAL_LAYOUTS = {
  type_6_transporter: [
    { kind: 'num', class: 5 }, { kind: 'num', class: 5 }, { kind: 'num', class: 4 },
    { kind: 'num', class: 4 }, { kind: 'num', class: 3 }, { kind: 'num', class: 2 },
    { kind: 'num', class: 2 }, { kind: 'num', class: 1 }, { kind: 'pas', class: 1 },
  ],
  type_7_transport: [
    { kind: 'num', class: 6 }, { kind: 'num', class: 6 }, { kind: 'num', class: 6 },
    { kind: 'num', class: 5 }, { kind: 'num', class: 5 }, { kind: 'num', class: 5 },
    { kind: 'num', class: 3 }, { kind: 'num', class: 3 }, { kind: 'num', class: 2 },
    { kind: 'num', class: 1 }, { kind: 'pas', class: 1 },
  ],
  imperial_clipper: [
    { kind: 'num', class: 7 }, { kind: 'num', class: 6 }, { kind: 'num', class: 4 },
    { kind: 'num', class: 4 }, { kind: 'num', class: 3 }, { kind: 'num', class: 3 },
    { kind: 'num', class: 2 }, { kind: 'num', class: 2 }, { kind: 'num', class: 1 },
    { kind: 'pas', class: 1 },
  ],
  federal_dropship: [
    { kind: 'num', class: 6 }, { kind: 'num', class: 5 }, { kind: 'num', class: 5 },
    { kind: 'num', class: 4 }, { kind: 'mil', class: 4 }, { kind: 'mil', class: 4 },
    { kind: 'num', class: 3 }, { kind: 'num', class: 3 }, { kind: 'num', class: 2 },
    { kind: 'num', class: 1 }, { kind: 'pas', class: 1 },
  ],
};

/**
 * Determine whether a ship needs old-link internal migration.
 * @param {String} shipId coriolis ship id
 * @return {Boolean} true if the ship's internal layout changed
 */
export function needsInternalMigration(shipId) {
  return Object.prototype.hasOwnProperty.call(OLD_INTERNAL_LAYOUTS, shipId);
}

/**
 * The kind of a NEW (current data) internal slot definition.
 * @param {Object|Number} slotDef coriolis-data slots.internal entry
 * @return {String} kind
 */
function newSlotKind(slotDef) {
  if (typeof slotDef !== 'object') return 'num';
  const name = slotDef.name || '';
  if (name === 'PlanetaryApproachSuite') return 'pas';
  if (name === 'Military') return 'mil';
  if (name === 'Cargo') return 'cargo';
  return 'num';
}

/**
 * The class of a NEW internal slot definition.
 * @param {Object|Number} slotDef coriolis-data slots.internal entry
 * @return {Number} class
 */
function newSlotClass(slotDef) {
  return typeof slotDef === 'object' ? slotDef.class : slotDef;
}

/**
 * Build the OLD-index -> NEW-index map for a changed ship, plus the NEW-length.
 * newFromOld[newIndex] = oldIndex, or null when the new slot has no old match.
 * @param {String} shipId coriolis ship id (must be in OLD_INTERNAL_LAYOUTS)
 * @return {{ newFromOld: Array<Number|null>, newLength: Number }}
 */
export function buildInternalRemap(shipId) {
  const oldLayout = OLD_INTERNAL_LAYOUTS[shipId];
  const newLayout = Ships[shipId].slots.internal;

  // Group the OLD module indices by kind|class, in their original order.
  const oldByKey = {};
  oldLayout.forEach((o, i) => {
    const key = o.kind + '|' + o.class;
    (oldByKey[key] = oldByKey[key] || []).push(i);
  });

  // Group the NEW slot indices by kind|class, in ship-slots order.
  const newByKey = {};
  newLayout.forEach((s, ni) => {
    const key = newSlotKind(s) + '|' + newSlotClass(s);
    (newByKey[key] = newByKey[key] || []).push(ni);
  });

  // For each group, assign old modules to the BOTTOM of the group's new slots:
  // a group that gained slots keeps its genuinely-new slot(s) at the TOP empty
  // (ship-slots.json inserts new slots, e.g. Slot00_SizeN, at the front of their
  // size band), and the old modules fill the remaining lower positions in order.
  // newFromOld[newIndex] = oldIndex, or null for an unfilled (new) slot.
  const newFromOld = new Array(newLayout.length).fill(null);
  for (const key in newByKey) {
    const newIdxs = newByKey[key];
    const oldIdxs = oldByKey[key] || [];
    // Right-align: the last oldIdxs.length new slots receive the old modules.
    const offset = newIdxs.length - oldIdxs.length;
    for (let k = 0; k < oldIdxs.length; k++) {
      newFromOld[newIdxs[offset + k]] = oldIdxs[k];
    }
  }

  return { newFromOld, newLength: newLayout.length };
}

/**
 * Remap a decoded OLD-order internal array (of module id strings / 0 / '-') onto
 * the NEW internal order for a changed ship. Returns a fresh array of newLength.
 * Parallel arrays (priorities, enabled, modifications, blueprints) can be remapped
 * with remapInternalParallel using the same map.
 * @param {String} shipId coriolis ship id
 * @param {Array} oldInternal decoded internal array in OLD order
 * @return {Array} internal array in NEW order (new slots = 0)
 */
export function remapInternalArray(shipId, oldInternal) {
  const { newFromOld, newLength } = buildInternalRemap(shipId);
  const out = new Array(newLength);
  for (let ni = 0; ni < newLength; ni++) {
    const oi = newFromOld[ni];
    out[ni] = (oi === null || oldInternal[oi] === undefined) ? 0 : oldInternal[oi];
  }
  return out;
}

/**
 * Remap a parallel per-internal-slot array (priorities / enabled / modifications /
 * blueprints) from OLD order to NEW order, inserting `fill` for new slots.
 * @param {String} shipId coriolis ship id
 * @param {Array} oldArr parallel array in OLD internal order
 * @param {*} fill value to use for genuinely-new slots
 * @return {Array} parallel array in NEW internal order
 */
export function remapInternalParallel(shipId, oldArr, fill) {
  if (!oldArr) return oldArr;
  const { newFromOld, newLength } = buildInternalRemap(shipId);
  const out = new Array(newLength);
  for (let ni = 0; ni < newLength; ni++) {
    const oi = newFromOld[ni];
    out[ni] = (oi === null || oldArr[oi] === undefined) ? fill : oldArr[oi];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Hardpoint / utility-mount migration
// ---------------------------------------------------------------------------
// Some ships gained a HARDPOINT slot (e.g. the Asp Scout gained a 3rd utility
// mount). Old links encode exactly the OLD number of hardpoint slots, so decoding
// against the grown array over-reads the positional stream and shifts the internal
// slots that follow. We decode hardpoints using the OLD length, then remap onto
// the current array.
//
// Unlike internal slots (new ones inserted at the FRONT of their size band),
// Frontier APPENDS new utility mounts at the END of the class-0 band (named
// TinyHardpointN). So hardpoints LEFT-ALIGN: old modules keep the first positions
// of each class group and the genuinely-new (trailing) slots stay empty.

/**
 * PRE-CHANGE hardpoint layouts (class of each slot, in old link order). A
 * hardpoint "class" is its mount size: 0 = utility mount, 1-4 = weapon. Only
 * ships whose hardpoints array changed are listed.
 * Captured 2026-10-24 prior to the utility-slot rebalance.
 */
export const OLD_HARDPOINT_LAYOUTS = {
  // Asp Scout gained a 3rd utility mount: [2,2,1,1,0,0] -> [2,2,1,1,0,0,0]
  asp_scout: [2, 2, 1, 1, 0, 0],
};

/**
 * Whether a ship needs old-link hardpoint migration.
 * @param {String} shipId coriolis ship id
 * @return {Boolean} true if the ship's hardpoint layout changed
 */
export function needsHardpointMigration(shipId) {
  return Object.prototype.hasOwnProperty.call(OLD_HARDPOINT_LAYOUTS, shipId);
}

/**
 * Build the OLD-index -> NEW-index map for a changed ship's hardpoints, plus the
 * NEW length. Old modules left-align within each mount-class group; trailing new
 * slots map to null (empty). newFromOld[newIndex] = oldIndex, or null.
 * @param {String} shipId coriolis ship id (must be in OLD_HARDPOINT_LAYOUTS)
 * @return {{ newFromOld: Array<Number|null>, newLength: Number }}
 */
export function buildHardpointRemap(shipId) {
  const oldLayout = OLD_HARDPOINT_LAYOUTS[shipId];
  const newLayout = Ships[shipId].slots.hardpoints; // array of class numbers

  // Group OLD indices by class (in order) and NEW indices by class (in order).
  const oldByClass = {};
  oldLayout.forEach((c, i) => { (oldByClass[c] = oldByClass[c] || []).push(i); });
  const newByClass = {};
  newLayout.forEach((c, ni) => { (newByClass[c] = newByClass[c] || []).push(ni); });

  // Left-align: the FIRST oldIdxs.length new slots of each class receive the old
  // modules in order; any extra (trailing) new slots stay empty.
  const newFromOld = new Array(newLayout.length).fill(null);
  for (const cls in newByClass) {
    const newIdxs = newByClass[cls];
    const oldIdxs = oldByClass[cls] || [];
    for (let k = 0; k < oldIdxs.length; k++) {
      newFromOld[newIdxs[k]] = oldIdxs[k];
    }
  }

  return { newFromOld, newLength: newLayout.length };
}

/**
 * Remap a decoded OLD-order hardpoint array onto the current hardpoint order.
 * @param {String} shipId coriolis ship id
 * @param {Array} oldHardpoints decoded hardpoint array in OLD order
 * @return {Array} hardpoint array in NEW order (new slots = 0)
 */
export function remapHardpointArray(shipId, oldHardpoints) {
  const { newFromOld, newLength } = buildHardpointRemap(shipId);
  const out = new Array(newLength);
  for (let ni = 0; ni < newLength; ni++) {
    const oi = newFromOld[ni];
    out[ni] = (oi === null || oldHardpoints[oi] === undefined) ? 0 : oldHardpoints[oi];
  }
  return out;
}

/**
 * Remap a parallel per-hardpoint-slot array (priorities / enabled / modifications
 * / blueprints) from OLD order to NEW order, inserting `fill` for new slots.
 * @param {String} shipId coriolis ship id
 * @param {Array} oldArr parallel array in OLD hardpoint order
 * @param {*} fill value for genuinely-new slots
 * @return {Array} parallel array in NEW hardpoint order
 */
export function remapHardpointParallel(shipId, oldArr, fill) {
  if (!oldArr) return oldArr;
  const { newFromOld, newLength } = buildHardpointRemap(shipId);
  const out = new Array(newLength);
  for (let ni = 0; ni < newLength; ni++) {
    const oi = newFromOld[ni];
    out[ni] = (oi === null || oldArr[oi] === undefined) ? fill : oldArr[oi];
  }
  return out;
}
