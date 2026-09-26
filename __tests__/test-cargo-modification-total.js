import { Ships, Modules } from 'coriolis-data/dist';
import Ship from '../src/app/shipyard/Ship';
import Module from '../src/app/shipyard/Module';

/**
 * Regression test for the "increased capacity" (Merc) cargo rack bug.
 *
 * Symptom: applying/changing the `cargo` engineering modification updates the
 * capacity shown on the individual slot (module.get('cargo')) but does NOT
 * update the ship's total cargo capacity (ship.cargoCapacity). This happened
 * because Ship.setModification() had no `cargo` branch, so recalculateMass()
 * (the only thing that recomputes ship.cargoCapacity) was never called when the
 * cargo mod changed - e.g. when the blueprint grade was increased.
 */
describe('Cargo modification updates ship total', function() {

  /**
   * Build an Anaconda with a single class-7 cargo rack in its first internal slot.
   * @return {Object} { ship, slot } the ship and the internal slot holding the rack
   */
  function shipWithCargoRack() {
    const shipData = Ships['anaconda'];
    const ship = new Ship('anaconda', shipData.properties, shipData.slots);
    // Start from the ship's stock build so all standard slots are populated
    ship.buildWith(shipData.defaults);

    // Class-7 E-rated cargo rack (id '06', base cargo 64)
    const template = Modules.internal.cr.find(m => m.id === '06');
    const rack = new Module({ template });

    // First internal slot on the Anaconda is class 7 - fits the class-7 rack
    const slot = ship.internal[0];
    ship.use(slot, rack);

    return { ship, slot };
  }

  it('places the unmodified rack and counts its base cargo in the total', function() {
    const { ship, slot } = shipWithCargoRack();
    expect(slot.m.get('cargo')).toBe(64);
    // The ship total should include this rack's 64t
    expect(ship.cargoCapacity).toBeGreaterThanOrEqual(64);
  });

  it('updates ship.cargoCapacity when a cargo modification is applied', function() {
    const { ship, slot } = shipWithCargoRack();
    const before = ship.cargoCapacity;

    // Apply a +34.375% cargo mod (grade 5 Expanded Capacity blueprint feature).
    // Modifications are stored scaled so that 34.375% === 3437.5 -> 3438 rounded.
    ship.setModification(slot.m, 'cargo', 3438, false);

    const slotCargo = slot.m.get('cargo');
    // Slot must reflect the increase (this always worked)
    expect(slotCargo).toBeGreaterThan(64);
    // The ship total must have grown by the same rounded per-module amount
    expect(ship.cargoCapacity).toBe(before - 64 + Math.round(slotCargo));
  });

  it('updates ship.cargoCapacity when the blueprint grade is increased', function() {
    const { ship, slot } = shipWithCargoRack();

    // Grade 1-ish increase first
    ship.setModification(slot.m, 'cargo', 313, false); // ~3.125%
    const afterLow = ship.cargoCapacity;
    const slotLow = Math.round(slot.m.get('cargo'));
    expect(afterLow).toBe(afterLow - slotLow + slotLow); // sanity
    expect(afterLow).toBeGreaterThanOrEqual(64);

    // Now bump to a higher grade - this is the reported failure case
    ship.setModification(slot.m, 'cargo', 3438, false); // ~34.375%
    const slotHigh = Math.round(slot.m.get('cargo'));

    expect(slotHigh).toBeGreaterThan(slotLow);
    // The ship total must track the higher grade, not stay stale at the low grade
    expect(ship.cargoCapacity).toBe(afterLow - slotLow + slotHigh);
  });
});
