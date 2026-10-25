/**
 * ship-slots.json authoritative slot resolver tests.
 *
 * Journal and Companion API imports resolve Frontier slot names against the
 * published ship-slots.json (bundled as ShipSlots on coriolis-data/dist). The
 * resolver maps a coriolis ship id to its ShipSlots key (either a direct match or
 * the lowercased FD name via SHIP_FD_NAME_TO_CORIOLIS_NAME) and returns the
 * authoritative per-group slot list. See CompanionApiUtils.js.
 */
import { Ships, ShipSlots } from 'coriolis-data/dist';
import {
  shipSlotsKey,
  shipSlots,
  SHIP_FD_NAME_TO_CORIOLIS_NAME
} from '../src/app/utils/CompanionApiUtils';

describe('ship-slots resolver', () => {

  it('bundles ShipSlots on the data dist', () => {
    expect(ShipSlots).toBeTruthy();
    expect(Object.keys(ShipSlots).length).toBeGreaterThan(0);
  });

  it('resolves every coriolis ship id to a ship-slots key', () => {
    const unresolved = [];
    for (const shipId of Object.keys(Ships)) {
      const key = shipSlotsKey(shipId);
      if (!key || !ShipSlots[key]) unresolved.push(shipId);
    }
    expect(unresolved).toEqual([]);
  });

  it('returns authoritative internal / hardpoint / standard slot lists', () => {
    for (const shipId of Object.keys(Ships)) {
      const internal = shipSlots(shipId, 'internal');
      expect(internal).not.toBeNull();
      expect(Array.isArray(internal)).toBe(true);

      // Each slot entry carries a Frontier slot name and a class.
      for (const slot of internal) {
        expect(typeof slot.name).toBe('string');
        expect(slot.name.length).toBeGreaterThan(0);
        expect(typeof slot.class).toBe('number');
      }

      // Hardpoints and standard lists are present too.
      expect(shipSlots(shipId, 'hardpoints')).not.toBeNull();
      expect(shipSlots(shipId, 'standard')).not.toBeNull();
    }
  });

  it('the authoritative internal count matches coriolis-data slots.internal', () => {
    const mismatches = [];
    for (const shipId of Object.keys(Ships)) {
      const authoritative = shipSlots(shipId, 'internal');
      const dataLen = Ships[shipId].slots.internal.length;
      if (authoritative.length !== dataLen) {
        mismatches.push(`${shipId}: ship-slots=${authoritative.length} data=${dataLen}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('the authoritative internal class ordering matches coriolis-data slots.internal', () => {
    const mismatches = [];
    for (const shipId of Object.keys(Ships)) {
      const authoritative = shipSlots(shipId, 'internal').map((s) => s.class);
      const dataClasses = Ships[shipId].slots.internal.map(
        (s) => (typeof s === 'object' ? s.class : s)
      );
      if (JSON.stringify(authoritative) !== JSON.stringify(dataClasses)) {
        mismatches.push(`${shipId}: ${authoritative} vs ${dataClasses}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('maps the Anaconda Mk II FD name to its coriolis id', () => {
    expect(SHIP_FD_NAME_TO_CORIOLIS_NAME['AnacondaMkII']).toBe('anaconda2');
    expect(shipSlotsKey('anaconda2')).not.toBeNull();
  });

  it('returns null for an unknown ship id', () => {
    expect(shipSlotsKey('not_a_ship')).toBeNull();
    expect(shipSlots('not_a_ship', 'internal')).toBeNull();
  });
});
