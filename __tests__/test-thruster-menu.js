/**
 * Thruster available-modules menu tests.
 *
 * Covers the data-level filtering in ModuleSet and the variant sub-grouping in
 * AvailableModulesMenu that together drive how thrusters appear in the menu:
 *
 *  - The 'Unrecognised Thrusters' placeholder (rating 'Z') must never be
 *    offered (it exists only so imports referencing an unknown module don't
 *    error). It previously leaked onto light ships (e.g. the Eagle).
 *  - Ship-locked Mk II thrusters only appear on their ship.
 *  - Named thruster families (Enhanced Performance, Mk II ...) each get their
 *    OWN sub-heading, and ordinary thrusters lead under the plain "Thrusters"
 *    heading (previously a named variant hijacked the single group heading and
 *    sorted above the ordinary thrusters).
 */
import { Ships } from 'coriolis-data/dist';
import * as ModuleUtils from '../src/app/shipyard/ModuleUtils';
import AvailableModulesMenu from '../src/app/components/AvailableModulesMenu';

const thrusters = (shipId) => ModuleUtils.forShip(shipId).standard[1];

describe('thruster menu data (ModuleSet)', () => {
  it('never offers the Unrecognised Thrusters placeholder on any ship', () => {
    const offenders = [];
    for (const shipId of Object.keys(Ships)) {
      for (const m of thrusters(shipId)) {
        const uk = (m.ukName || '').toLowerCase();
        if (m.rating === 'Z' || uk.includes('unrecognised')) {
          offenders.push(`${shipId}:${m.id}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('offers Enhanced Performance thrusters on a light ship (Eagle) and not the placeholder', () => {
    const names = thrusters('eagle').map(m => m.name).filter(Boolean);
    expect(names).toContain('Enhanced Performance');
  });
});

describe('thruster menu variant sub-grouping (AvailableModulesMenu)', () => {
  // _partitionGroupVariants / _getModuleVariantName are plain prototype methods;
  // call them against a minimal `this` without rendering the component.
  const proto = AvailableModulesMenu.prototype;
  const partition = (modules) =>
    proto._partitionGroupVariants.call(proto, modules, 't', 'Thrusters');

  it('keeps ordinary thrusters under the "Thrusters" heading, first', () => {
    const list = thrusters('explorer_nx'); // Caspian: ordinary + MkII Gravity
    const groups = partition(list);
    expect(groups[0].heading).toBe('Thrusters');
    // every module in the base group is an ordinary thruster (no distinct name)
    for (const m of groups[0].modules) {
      const isOrdinary = !m.name || (m.class && m.rating && m.name === `${m.class}${m.rating}`);
      expect(isOrdinary).toBe(true);
    }
  });

  it('gives each named thruster family its own heading after the ordinary ones', () => {
    const caspian = partition(thrusters('explorer_nx'));
    const headings = caspian.map(g => g.heading);
    expect(headings).toEqual(['Thrusters', 'MkII Gravity Optimised Thrusters']);

    const kestrel = partition(thrusters('kestrel'));
    const kHeadings = kestrel.map(g => g.heading);
    expect(kHeadings[0]).toBe('Thrusters');
    expect(kHeadings).toContain('MkII Agile Boost Thrusters');
    expect(kHeadings).toContain('Enhanced Performance');

    const eagle = partition(thrusters('eagle'));
    expect(eagle.map(g => g.heading)).toEqual(['Thrusters', 'Enhanced Performance']);
  });

  it('_getModuleVariantName treats ordinary thrusters as base and named ones as variants', () => {
    expect(proto._getModuleVariantName.call(proto, { name: '5A', class: 5, rating: 'A' }, 't', 'Thrusters')).toBeNull();
    expect(proto._getModuleVariantName.call(proto, {}, 't', 'Thrusters')).toBeNull();
    expect(proto._getModuleVariantName.call(proto, { name: 'Thrusters' }, 't', 'Thrusters')).toBeNull();
    expect(proto._getModuleVariantName.call(proto, { name: 'Enhanced Performance' }, 't', 'Thrusters')).toBe('Enhanced Performance');
  });
});
