/**
 * Ablative-armour ship tests (Caspian Explorer, Anaconda Mk II).
 *
 * These ships offer Lightweight Alloy plus five ship-specific "Mk II Ablative"
 * armour grades, and do NOT offer the ordinary Reinforced/Military/Mirrored/
 * Reactive grades (matching the game). The bulkhead layout is:
 *   [0] Lightweight Alloy, [1..5] Mk II Ablative Lightweight..Reactive
 * which lines up with the 6-bulkhead import offset in CompanionApiUtils /
 * JournalUtils. The detailed-build serializer must export each bulkhead's real
 * name (BulkheadNames only covers the 5 standard grades) and the result must
 * validate against the v5 ship-loadout schema.
 */
import { Ships } from 'coriolis-data/dist';
import Ship from '../src/app/shipyard/Ship';
import * as Serializer from '../src/app/shipyard/Serializer';
import jsen from 'jsen';

const ABLATIVE_SHIPS = ['anaconda2', 'explorer_nx'];
const EXPECTED_NAMES = [
  'Lightweight Alloy',
  'Mk II Ablative Lightweight',
  'Mk II Ablative Reinforced',
  'Mk II Ablative Military Grade',
  'Mk II Ablative Mirrored',
  'Mk II Ablative Reactive'
];

describe('ablative-armour ships', () => {
  const validate = jsen(require('../src/schemas/ship-loadout/5'));

  for (const shipId of ABLATIVE_SHIPS) {
    describe(shipId, () => {
      const sd = Ships[shipId];

      it('offers exactly Lightweight Alloy + 5 Mk II Ablative grades (no normal Reinforced/Military/Mirrored/Reactive)', () => {
        const names = sd.bulkheads.map((b) => b.name);
        expect(names).toEqual(EXPECTED_NAMES);
        // No ordinary (non-lightweight) grades present
        expect(names).not.toContain('Reinforced Alloy');
        expect(names).not.toContain('Military Grade Composite');
        expect(names).not.toContain('Mirrored Surface Composite');
        expect(names).not.toContain('Reactive Surface Composite');
      });

      it('exports each bulkhead with its real name and validates against v5', () => {
        for (let i = 0; i < sd.bulkheads.length; i++) {
          const ship = new Ship(shipId, sd.properties, sd.slots);
          ship.buildWith(sd.defaults);
          ship.useBulkhead(i);
          const exported = Serializer.toDetailedBuild('Test', ship);
          expect(exported.components.standard.bulkheads.name).toBe(EXPECTED_NAMES[i]);
          expect(validate(exported)).toBe(true);
        }
      });

      it('round-trips the fitted bulkhead through the build link', () => {
        for (let i = 0; i < sd.bulkheads.length; i++) {
          const ship = new Ship(shipId, sd.properties, sd.slots);
          ship.buildWith(sd.defaults);
          ship.useBulkhead(i);
          const code = ship.toString();
          const rebuilt = new Ship(shipId, sd.properties, sd.slots);
          rebuilt.buildFrom(code);
          expect(rebuilt.bulkheads.m.index).toBe(i);
          expect(rebuilt.bulkheads.m.name).toBe(EXPECTED_NAMES[i]);
          expect(rebuilt.toString()).toBe(code);
        }
      });
    });
  }
});
