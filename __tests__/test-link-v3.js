/**
 * v3 build-link round-trip tests.
 *
 * Ship.toString() emits the v3 ('B'-prefixed) link, positional against the
 * ship-slots.json authoritative internal ordering. buildFrom() must decode a v3
 * link back to an identical canonical string. See docs/link-format-v3.md.
 */
import { Ships } from 'coriolis-data/dist';
import Ship from '../src/app/shipyard/Ship';

/**
 * Build a ship from its stock/default loadout.
 * @param {String} shipId coriolis ship id
 * @return {Ship} a ship built with its defaults
 */
function stockShip(shipId) {
  const sd = Ships[shipId];
  const ship = new Ship(shipId, sd.properties, sd.slots);
  ship.buildWith(sd.defaults);
  return ship;
}

/**
 * Rebuild a ship from a serialized code.
 * @param {String} shipId coriolis ship id
 * @param {String} code serialized build string
 * @return {Ship} the rebuilt ship
 */
function rebuild(shipId, code) {
  const sd = Ships[shipId];
  const ship = new Ship(shipId, sd.properties, sd.slots);
  ship.buildFrom(code);
  return ship;
}

describe('v3 build link', () => {

  it('emits the v3 version marker', () => {
    const code = stockShip('anaconda').toString();
    expect(code.charAt(0)).toBe('B');
  });

  describe('round-trips every ship default loadout', () => {
    for (const shipId of Object.keys(Ships)) {
      it(`${shipId} default loadout round-trips`, () => {
        const original = stockShip(shipId);
        const code = original.toString();
        expect(code.charAt(0)).toBe('B');

        const rebuilt = rebuild(shipId, code);
        // Canonical string is a complete representation of standard/hardpoint/
        // internal modules, power, priorities and modifications.
        expect(rebuilt.toString()).toBe(code);
      });
    }
  });

  it('preserves the exact internal module ordering on round-trip', () => {
    const original = stockShip('anaconda');
    const code = original.toString();
    const rebuilt = rebuild('anaconda', code);

    const idsOf = (ship) => ship.internal.map((s) => (s.m ? s.m.id : null));
    expect(idsOf(rebuilt)).toEqual(idsOf(original));
  });

  it('round-trips a build carrying engineering modifications', () => {
    // The engineered anaconda export fixture produces a v3 code with a gzip mods
    // segment; rebuilding it must be stable.
    const data = require('./fixtures/anaconda-test-detailed-export-v5');
    const code = rebuild('anaconda', data.references[0].code).toString();
    expect(code.charAt(0)).toBe('B');
    // mods segment present (4 dot-delimited fields after the layout)
    expect(code.split('.').length).toBeGreaterThanOrEqual(4);

    const again = rebuild('anaconda', code).toString();
    expect(again).toBe(code);
  });
});
