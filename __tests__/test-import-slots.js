import { shipFromLoadoutJSON } from '../src/app/utils/JournalUtils';

/**
 * Regression tests for internal slot indexing during import.
 *
 * Some ships skip journal internal slot numbers because military/restricted
 * slots occupy those numbers (e.g. the Federal Dropship's journal jumps from
 * Slot06 to Slot09, reserving 07/08 for its two Military slots). The importer
 * must apply a per-ship correction keyed on the *Coriolis* ship model id.
 *
 * A previous bug keyed the Federal Dropship correction on the FDev name
 * ('federation_dropship') instead of the Coriolis model id ('federal_dropship'),
 * so the correction never fired and the size 2 and size 1 internal slots were
 * looked up under the wrong names (Slot07/Slot08) and silently dropped.
 */
describe('Import internal slot indexing', function() {

  describe('Federal Dropship (military slots skip journal indexes)', function() {
    const slef = require.requireActual('./fixtures/slef-federal-dropship.json');
    const ship = shipFromLoadoutJSON(slef.data);

    // Coriolis internal slot layout for the Federal Dropship:
    // [6, 5, 5, 4, Military, Military, 3, 3, 2, 1, PlanetaryApproachSuite]
    const SIZE_2_INDEX = 8;
    const SIZE_1_INDEX = 9;

    it('maps to the Federal Dropship model', function() {
      expect(ship.id).toBe('federal_dropship');
    });

    it('populates the size 2 internal slot with the Hull Reinforcement Package', function() {
      const slot = ship.internal[SIZE_2_INDEX];
      expect(slot.m).toBeTruthy();
      expect(slot.m.grp).toBe('hr');
      expect(slot.m.class).toBe(2);
    });

    it('populates the size 1 internal slot with the FSD Interdictor', function() {
      const slot = ship.internal[SIZE_1_INDEX];
      expect(slot.m).toBeTruthy();
      expect(slot.m.grp).toBe('fi');
      expect(slot.m.class).toBe(1);
    });

    it('does not drop any occupied internal slot from the loadout', function() {
      // The fixture fits all 8 numbered internal slots plus 2 military slots.
      // The importer also auto-fits an Advanced Planetary Approach Suite into
      // the PlanetaryApproachSuite slot when the loadout omits one, so the
      // Federal Dropship ends up with all 11 internal slots occupied.
      const occupied = ship.internal.filter(s => s.m).length;
      expect(occupied).toBe(11);
    });

    it('leaves no internal slot that the loadout fitted empty', function() {
      // Specifically guard against the reported regression: the size 2 and
      // size 1 slots must not be dropped.
      expect(ship.internal[SIZE_2_INDEX].m).toBeTruthy();
      expect(ship.internal[SIZE_1_INDEX].m).toBeTruthy();
    });
  });
});
