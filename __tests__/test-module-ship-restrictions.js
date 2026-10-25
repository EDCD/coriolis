/**
 * Per-module ship-restriction tests.
 *
 * Frontier restricts some modules to a specific ship or set of ships. In the
 * data this is expressed with a module `ship` field (a ship id string or an
 * array of ids); ModuleSet drops a restricted module from any ship not listed.
 * This is the "new normal" for FDev ship-exclusive modules, so the mechanism is
 * data-driven rather than per-module hardcoding.
 *
 * Currently restricted standard modules:
 *   - Mk II SCO FSD (id 6Q)                 -> Caspian Explorer (explorer_nx) only
 *   - Mk II Gravity Optimised Thrusters(6w) -> Caspian Explorer (explorer_nx) only
 *   - Mk II Agile Boost Thrusters (7T)      -> Kestrel Mk II (kestrel) only
 */
import { Ships } from 'coriolis-data/dist';
import * as ModuleUtils from '../src/app/shipyard/ModuleUtils';

const fsdIds = (shipId) => ModuleUtils.forShip(shipId).standard[2].map((m) => m.id);
const thrusterIds = (shipId) => ModuleUtils.forShip(shipId).standard[1].map((m) => m.id);

describe('per-module ship restrictions', () => {

  describe('Mk II SCO FSD (6Q) is Caspian Explorer only', () => {
    it('is offered on the Caspian Explorer', () => {
      expect(fsdIds('explorer_nx')).toContain('6Q');
    });
    it('is NOT offered on the Anaconda Mk II', () => {
      expect(fsdIds('anaconda2')).not.toContain('6Q');
    });
    it('is NOT offered on any ship other than the Caspian', () => {
      // The Anaconda Mk II is the key case: it is the ONLY other ship with a
      // class-8 FSD slot, so before this restriction it could wrongly fit the
      // Caspian-only Mk II SCO FSD. Confirm it (and every non-Caspian ship) is
      // now excluded.
      expect(Ships.anaconda2.slots.standard[2]).toBe(8);
      expect(fsdIds('anaconda2')).not.toContain('6Q');
      for (const shipId of Object.keys(Ships)) {
        if (shipId === 'explorer_nx') continue;
        expect(fsdIds(shipId)).not.toContain('6Q');
      }
    });
  });

  describe('Mk II thrusters are ship-locked', () => {
    it('Mk II Gravity Optimised Thrusters (6w) only on the Caspian Explorer', () => {
      expect(thrusterIds('explorer_nx')).toContain('6w');
      expect(thrusterIds('anaconda2')).not.toContain('6w');
      expect(thrusterIds('anaconda')).not.toContain('6w');
    });
    it('Mk II Agile Boost Thrusters (7T) only on the Kestrel Mk II', () => {
      expect(thrusterIds('kestrel')).toContain('7T');
      expect(thrusterIds('anaconda2')).not.toContain('7T');
      expect(thrusterIds('explorer_nx')).not.toContain('7T');
    });
  });

  it('unrestricted SCO FSDs remain available on ships with a matching slot', () => {
    // Only the Anaconda Mk II and Caspian Explorer have a class-8 FSD slot, so
    // the normal class-8 SCO FSD (6P) must still appear on BOTH (the restriction
    // only removes the Mk II 6Q from the Anaconda Mk II, not ordinary FSDs).
    expect(Ships.anaconda2.slots.standard[2]).toBe(8);
    expect(fsdIds('anaconda2')).toContain('6P');
    expect(fsdIds('explorer_nx')).toContain('6P');
    // A smaller FSD slot (Cutter, class 7) correctly sees no class-8 FSD at all.
    expect(Ships.imperial_cutter.slots.standard[2]).toBe(7);
    expect(fsdIds('imperial_cutter')).not.toContain('6P');
  });

  it('every ship default loadout uses only modules it is allowed to fit', () => {
    // Guards against a default referencing a module the ship is restricted from.
    const offenders = [];
    for (const shipId of Object.keys(Ships)) {
      const allowedFsd = new Set(fsdIds(shipId));
      const allowedThr = new Set(thrusterIds(shipId));
      const def = Ships[shipId].defaults.standard;
      // standard order: [pp, thrusters, fsd, ls, pd, sensors, ft]
      const thr = def[1];
      const fsd = def[2];
      // defaults are stored as "<class><rating>" or a module id; compare by id
      // via the ship's own available set is complex, so just assert the Mk II
      // restricted ids never appear as a default on a disallowed ship.
      if (fsd === '6Q' && !allowedFsd.has('6Q')) offenders.push(`${shipId} default FSD 6Q`);
      if (thr === '6w' && !allowedThr.has('6w')) offenders.push(`${shipId} default thruster 6w`);
      if (thr === '7T' && !allowedThr.has('7T')) offenders.push(`${shipId} default thruster 7T`);
    }
    expect(offenders).toEqual([]);
  });
});
