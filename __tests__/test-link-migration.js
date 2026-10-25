/**
 * Old-link (v1/v2) internal-slot migration tests.
 *
 * Four ships gained or re-sized internal slots after old positional links could
 * have been created: type_6_transporter, type_7_transport, imperial_clipper and
 * federal_dropship. Old links are positional against the PRE-CHANGE internal
 * order (OLD_INTERNAL_LAYOUTS); decoding them must remap modules onto the current
 * ship-slots.json order so each module lands in its original slot and genuinely
 * new slots stay empty. See docs/link-format-v3.md and LinkMigration.js.
 */
import { Ships } from 'coriolis-data/dist';
import Ship from '../src/app/shipyard/Ship';
import * as ModuleUtils from '../src/app/shipyard/ModuleUtils';
import {
  OLD_INTERNAL_LAYOUTS,
  needsInternalMigration,
  buildInternalRemap,
  remapInternalArray,
  remapInternalParallel,
  OLD_HARDPOINT_LAYOUTS,
  needsHardpointMigration,
  buildHardpointRemap,
  remapHardpointArray
} from '../src/app/shipyard/LinkMigration';

const CHANGED = ['type_6_transporter', 'type_7_transport', 'imperial_clipper', 'federal_dropship'];

/**
 * Current internal layout as {kind,class} pairs for comparison.
 * @param {String} shipId coriolis ship id
 * @return {Array} array of {kind,class}
 */
function newLayout(shipId) {
  return Ships[shipId].slots.internal.map((s) => {
    if (typeof s !== 'object') return { kind: 'num', class: s };
    const name = s.name || '';
    let kind = 'num';
    if (name === 'PlanetaryApproachSuite') kind = 'pas';
    else if (name === 'Military') kind = 'mil';
    else if (name === 'Cargo') kind = 'cargo';
    return { kind, class: s.class };
  });
}

describe('old-link internal migration', () => {

  it('flags exactly the four changed ships as needing migration', () => {
    for (const id of CHANGED) {
      expect(needsInternalMigration(id)).toBe(true);
    }
    // A representative unchanged ship
    expect(needsInternalMigration('anaconda')).toBe(false);
    expect(needsInternalMigration('sidewinder')).toBe(false);
  });

  describe('remap is consistent with the current layout', () => {
    for (const shipId of CHANGED) {
      it(`${shipId}: every new slot maps to a same-kind/class old slot or null`, () => {
        const { newFromOld, newLength } = buildInternalRemap(shipId);
        const nl = newLayout(shipId);
        const ol = OLD_INTERNAL_LAYOUTS[shipId];

        expect(newLength).toBe(nl.length);
        expect(newFromOld.length).toBe(newLength);

        for (let ni = 0; ni < newLength; ni++) {
          const oi = newFromOld[ni];
          if (oi === null) continue;
          // mapped old slot must match this new slot's kind and class
          expect(ol[oi].kind).toBe(nl[ni].kind);
          expect(ol[oi].class).toBe(nl[ni].class);
        }
      });

      it(`${shipId}: each old slot is claimed at most once`, () => {
        const { newFromOld } = buildInternalRemap(shipId);
        const used = newFromOld.filter((x) => x !== null);
        expect(new Set(used).size).toBe(used.length);
      });

      it(`${shipId}: new layout is at least as large as the old one`, () => {
        expect(Ships[shipId].slots.internal.length)
          .toBeGreaterThanOrEqual(OLD_INTERNAL_LAYOUTS[shipId].length);
      });
    }
  });

  describe('new slots sit at the TOP of their size group', () => {
    // In ship-slots.json the genuinely-new slots are inserted at the FRONT of
    // their size band (the game names them Slot00_SizeN). So when an old link is
    // migrated, old modules must right-align within each size group: the new
    // (top) slot(s) stay empty and the old modules fill the lower positions.
    // These are the exact expected old->new maps (null = empty new slot).
    const EXPECTED = {
      // 9 old -> 10 new; new c6 at top (index 0)
      type_6_transporter: [null, 0, 1, 2, 3, 4, 5, 6, 7, 8],
      // 11 old -> 13 new; new c7 (idx 0) and new c6 (idx 1) both at the top
      type_7_transport: [null, null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      // 10 old -> 11 new; new c7 at top (idx 0), old c7 drops to idx 1
      imperial_clipper: [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      // 11 old -> 12 new; new c6 at top (idx 0), old c6 drops to idx 1
      federal_dropship: [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };
    for (const shipId of CHANGED) {
      it(`${shipId}: produces the expected top-of-group remap`, () => {
        const { newFromOld } = buildInternalRemap(shipId);
        expect(newFromOld).toEqual(EXPECTED[shipId]);
      });
    }
  });

  it('remapInternalArray places old modules by matching slot and leaves new slots empty', () => {
    // Federal Dropship gained a class-6 slot at the front (Slot00_Size6) under the
    // new ship-slots order. Fabricate an old-order internal id array (distinct
    // markers) and confirm they migrate onto matching new slots.
    const shipId = 'federal_dropship';
    const old = OLD_INTERNAL_LAYOUTS[shipId];
    // Tag each old slot with a unique string id so we can trace placement.
    const oldInternal = old.map((_, i) => `m${i}`);

    const out = remapInternalArray(shipId, oldInternal);
    const { newFromOld } = buildInternalRemap(shipId);

    expect(out.length).toBe(Ships[shipId].slots.internal.length);
    for (let ni = 0; ni < out.length; ni++) {
      const oi = newFromOld[ni];
      if (oi === null) {
        expect(out[ni]).toBe(0); // genuinely new slot stays empty
      } else {
        expect(out[ni]).toBe(oldInternal[oi]); // original module preserved
      }
    }
    // The dropship gained at least one slot, so at least one new slot is empty.
    expect(out.filter((x) => x === 0).length).toBeGreaterThanOrEqual(1);
  });

  it('remapInternalParallel fills new slots with the supplied default', () => {
    const shipId = 'imperial_clipper';
    const old = OLD_INTERNAL_LAYOUTS[shipId];
    const oldPriorities = old.map((_, i) => String(i % 5));

    const out = remapInternalParallel(shipId, oldPriorities, '0');
    const { newFromOld } = buildInternalRemap(shipId);

    expect(out.length).toBe(Ships[shipId].slots.internal.length);
    for (let ni = 0; ni < out.length; ni++) {
      const oi = newFromOld[ni];
      expect(out[ni]).toBe(oi === null ? '0' : oldPriorities[oi]);
    }
  });

  describe('decoding old positional links for changed ships', () => {
    // valid-detailed-export.json carries v1 ('0'-prefixed) positional links for
    // these ships; decoding them exercises the full migration path.
    const expectedBuilds = require('./fixtures/expected-builds');
    const detailed = require('./fixtures/valid-detailed-export');

    for (const build of detailed) {
      const shipName = build.ship;
      const shipId = Object.keys(Ships).find(
        (id) => Ships[id].properties.name.toLowerCase() === shipName.toLowerCase()
      );
      if (!CHANGED.includes(shipId)) continue;

      it(`${shipId} "${build.name}" decodes an old v1 link without throwing and matches the regenerated v3 code`, () => {
        const sd = Ships[shipId];
        const ship = new Ship(shipId, sd.properties, sd.slots);
        // Old positional link from the fixture
        expect(() => ship.buildFrom(build.references[0].code)).not.toThrow();
        // Re-serialized to v3 and compared to the regenerated expectation
        expect(ship.toString()).toBe(expectedBuilds[shipId][build.name]);
      });
    }
  });
});

describe('old-link hardpoint (utility-mount) migration', () => {
  // The Asp Scout gained a 3rd utility mount, appended at the END of its
  // hardpoint array ([2,2,1,1,0,0] -> [2,2,1,1,0,0,0]). An old link encodes only
  // 6 hardpoint slots; decoding against the grown array over-reads the positional
  // stream and shifts the internal slots. The migration decodes with the old
  // length and left-aligns, leaving the new (trailing) utility empty.

  it('flags the Asp Scout as needing hardpoint migration (and not internal)', () => {
    expect(needsHardpointMigration('asp_scout')).toBe(true);
    expect(needsInternalMigration('asp_scout')).toBe(false);
    expect(needsHardpointMigration('anaconda')).toBe(false);
  });

  it('produces an identity-plus-trailing-empty hardpoint remap', () => {
    // 6 old -> 7 new; old modules keep positions 0..5, new slot 6 (TinyHardpoint3) empty
    const { newFromOld, newLength } = buildHardpointRemap('asp_scout');
    expect(newLength).toBe(7);
    expect(newFromOld).toEqual([0, 1, 2, 3, 4, 5, null]);
  });

  it('remapHardpointArray leaves the new trailing utility empty', () => {
    const old = OLD_HARDPOINT_LAYOUTS.asp_scout.map((_, i) => `h${i}`);
    const out = remapHardpointArray('asp_scout', old);
    expect(out).toEqual(['h0', 'h1', 'h2', 'h3', 'h4', 'h5', 0]);
  });

  it('decodes an old 6-hardpoint Asp Scout link without shifting internals', () => {
    const sd = Ships.asp_scout;

    // Two distinct utility modules for the leading mounts.
    const u0 = ModuleUtils.findHardpoint('sb', 0, 'A'); // Shield Booster
    const u1 = ModuleUtils.findHardpoint('kw', 0, 'C'); // Kill Warrant Scanner
    expect(u0 && u0.id).toBeTruthy();
    expect(u1 && u1.id).toBeTruthy();

    // Fabricate a genuine OLD (v1, digit-prefixed) positional link for the
    // pre-change 6-hardpoint Asp Scout:
    //   bulkhead(0) + standard(defaults) + hardpoints[OLD 6] + internal(defaults)
    // OLD hardpoints = [2:empty, 2:empty, 1:empty, 1:empty, util0, util1].
    const standardStr = sd.defaults.standard.join('');
    const oldHp = ['-', '-', '-', '-', u0.id, u1.id].join('');
    const internalStr = sd.defaults.internal.map((s) => (s === 0 ? '-' : s)).join('');
    const oldCode = '0' + standardStr + oldHp + internalStr;

    const ship = new Ship('asp_scout', sd.properties, sd.slots);
    ship.buildFrom(oldCode);

    const utils = ship.hardpoints.filter((s) => s.maxClass === 0);
    expect(utils.length).toBe(3);
    // first two utilities preserved, by group
    expect(utils[0].m && utils[0].m.grp).toBe('sb');
    expect(utils[1].m && utils[1].m.grp).toBe('kw');
    // third (new) utility empty
    expect(utils[2].m).toBeFalsy();

    // Internals must match the ship's stock defaults in order (NOT shifted by the
    // extra hardpoint char). Build a reference from defaults for comparison.
    const ref = new Ship('asp_scout', sd.properties, sd.slots);
    ref.buildWith(sd.defaults);
    const refInternals = ref.internal.map((s) => (s.m ? s.m.id : null));
    const gotInternals = ship.internal.map((s) => (s.m ? s.m.id : null));
    expect(gotInternals).toEqual(refInternals);
  });
});
