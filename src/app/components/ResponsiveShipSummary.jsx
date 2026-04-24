import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import cn from 'classnames';
import { Warning } from './SvgIcons';
import * as Calc from '../shipyard/Calculations';
import { Insurance } from '../shipyard/Constants';
import Persist from '../stores/Persist';

/**
 * Responsive Ship Summary - A modern, responsive version of the ship stats display
 */
export default class ResponsiveShipSummary extends TranslatedComponent {

  static propTypes = {
    ship: PropTypes.object.isRequired,
    cargo: PropTypes.number.isRequired,
    fuel: PropTypes.number.isRequired,
    marker: PropTypes.string.isRequired,
    pips: PropTypes.object.isRequired,
    collapsed: PropTypes.bool
  };

  constructor(props) {
    super(props);
    this.state = {
      shieldColour: 'blue',
      activeTab: 'movjump'
    };
    this._setTab = this._setTab.bind(this);
  }

  _setTab(tab) {
    this.setState({ activeTab: tab });
  }

  render() {
    const { ship, cargo, fuel, pips } = this.props;
    let { language, tooltip, termtip } = this.context;
    let translate = language.translate;
    let u = language.units;
    let formats = language.formats;
    let { time, int, round, f1, f2 } = formats;
    let hide = tooltip.bind(null, null);

    const shieldGenerator = ship.findInternalByGroup('sg') || ship.findInternalByGroup('psg');
    const sgClassNames = cn({ warning: shieldGenerator && !ship.shield, muted: !shieldGenerator });
    const sgTooltip = shieldGenerator ? 'TT_SUMMARY_SHIELDS' : 'TT_SUMMARY_SHIELDS_NONFUNCTIONAL';
    const timeToDrain = Calc.timeToDrainWep(ship, 4);

    const currTimeToDrain = Calc.timeToDrainWep(ship, pips.wep);
    const canThrust = ship.canThrust(cargo, ship.fuelCapacity);
    const speedTooltip = canThrust ? 'TT_SUMMARY_SPEED' : 'TT_SUMMARY_SPEED_NONFUNCTIONAL';
    const canBoost = ship.canBoost(cargo, ship.fuelCapacity);
    const boostTooltip = canBoost ? 'TT_SUMMARY_BOOST' : canThrust ? 'TT_SUMMARY_BOOST_NONFUNCTIONAL' : 'TT_SUMMARY_SPEED_NONFUNCTIONAL';
    const canJump = ship.getSlotStatus(ship.standard[2]) == 3;
    const sgMetrics = Calc.shieldMetrics(ship, pips.sys);
    const distBoost = canBoost ? Calc.calcBoost(ship) : 'No Boost';
    const restingHeat = Math.sqrt(((ship.standard[0].m.pgen * ship.standard[0].m.eff) / ship.heatCapacity) / 0.2);
    const armourMetrics = Calc.armourMetrics(ship);

    /**
     * Format large credit values compactly (e.g. 1.05Bn, 52.4M)
     * @param {number} value Credit amount
     * @return {string} Formatted string
     */
    const compactCredits = (value) => {
      const abs = Math.abs(value);
      if (abs >= 1e9) return f2(value / 1e9) + ' Bn ';
      if (abs >= 1e6) return f2(value / 1e6) + ' M ';
      return int(value);
    };

    const bulkheadName = ship && ship.bulkheads && ship.bulkheads.m && ship.bulkheads.m.name || 'No Armour';
    const armourTypeShortMap = {
      'Lightweight Alloy': 'Ltwt',
      'Reinforced Alloy': 'Reinf',
      'Military Grade Composite': 'Milit',
      'Mirrored Surface Composite': 'Mirror',
      'Reactive Surface Composite': 'React',
    };
    const armourTypeShort = armourTypeShortMap[bulkheadName] || bulkheadName;

    const canHaveFighters = ship.fighterHangars === true;
    const fighterBayCount = canHaveFighters ?
      ship.internal.filter(slot => slot.m && slot.m.grp === 'fh')
        .reduce((sum, slot) => sum + slot.m.getBays(), 0) : 0;

    const srvBayCount = ship.internal
      .filter(slot => slot.m && slot.m.grp === 'pv')
      .reduce((sum, slot) => sum + slot.m.getBays(), 0);

    let shieldColour = 'blue';
    let shieldTypeShort = 'No Shield';
    if (shieldGenerator && shieldGenerator.m.grp === 'psg') {
      shieldColour = 'green';
      shieldTypeShort = 'Prismo';
    } else if (shieldGenerator && shieldGenerator.m.grp === 'bsg') {
      shieldColour = 'purple';
      shieldTypeShort = 'Bi-Weave';
    } else if (shieldGenerator) {
      shieldTypeShort = 'Shield';
    }

    const { activeTab } = this.state;

    return (
      <div id='summary-responsive'>
        {!this.props.collapsed && <div>

        {/* Tab bar - visible only at narrow widths */}
        <div className='stat-tab-bar'>
          <button className={cn('stat-tab', { active: activeTab === 'movjump' })} onClick={() => this._setTab('movjump')}><span className='tab-full'>MOV / JUMP</span><span className='tab-abbr'>MOV/JMP</span></button>
          <button className={cn('stat-tab', { active: activeTab === 'wpncap' })} onClick={() => this._setTab('wpncap')}><span className='tab-full'>WPN / CAP</span><span className='tab-abbr'>WPN/CAP</span></button>
          <button className={cn('stat-tab', { active: activeTab === 'massmisc' })} onClick={() => this._setTab('massmisc')}><span className='tab-full'>MASS / MISC</span><span className='tab-abbr'>MSS/MSC</span></button>
          <button className={cn('stat-tab', { active: activeTab === 'shield' })} onClick={() => this._setTab('shield')}><span className='tab-full'>{translate('SHIELD')}</span><span className='tab-abbr'>{translate('SHIELD')}</span></button>
          <button className={cn('stat-tab', { active: activeTab === 'armour' })} onClick={() => this._setTab('armour')}><span className='tab-full'>{translate('ARMOUR')}</span><span className='tab-abbr'>{translate('ARMOUR')}</span></button>
        </div>

        {/* Primary Stats Tables */}
        <div className='stats-tables'>
        <div className={cn('tab-group', 'tab-movjump', { 'tab-active': activeTab === 'movjump' })}>
          {/* Movement */}
          <div className='stat-table'>
            <div className='stat-table-header'>{translate('MOVEMENT')}</div>
            <table>
              <colgroup>
                <col className='stat-label-col' />
                <col className='stat-value-col' />
              </colgroup>
              <tbody>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('MAX SPEED')}</span>
                    <span className='label-abbr'>MAX SPEED</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, speedTooltip, { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {canThrust ? <span>{int(ship.calcSpeed(4, ship.fuelCapacity, 0, false))}{u['m/s']}</span> : <span className='warning'>0 <Warning/></span>}
                  </td>
                </tr>
                <tr>
                  <td className='label'>

                    <span className='label-full'>CURRENT SPEED</span>
                    <span className='label-abbr'>Curr SPD</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, canThrust ? 'TT_SUMMARY_SPEED_1PIP' : 'TT_SUMMARY_SPEED_NONFUNCTIONAL', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {canThrust ? <span>{int(ship.calcSpeed(pips.eng, ship.fuelCapacity, 0, false))}{u['m/s']}</span> : <span className='warning'>0 <Warning/></span>}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('BOOST')}</span>
                    <span className='label-abbr'>BOOST</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, boostTooltip, { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {canBoost ? <span>{int(ship.calcSpeed(4, ship.fuelCapacity, 0, true))}{u['m/s']}</span> : <span className='warning'>0 <Warning/></span>}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>BST INT ({translate('PD')})</span>
                    <span className='label-abbr'>BST INT(D)</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_BOOST_INTERVAL', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {distBoost !== 'No Boost' ? formats.time(distBoost) : 'No Boost'}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>BST INT ({translate('SHIP')})</span>
                    <span className='label-abbr'>BST INT(S)</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_SHIP_BOOST_INTERVAL', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {ship.boostInt && ship.boostInt !== 'undefined' ? formats.time(ship.boostInt) : 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Jump Range */}
          <div className='stat-table'>
            <div className='stat-table-header'>{translate('JUMP RANGE')}</div>
            <table>
              <colgroup>
                <col className='stat-label-col' />
                <col className='stat-value-col' />
              </colgroup>
              <tbody>
                <tr>
                  <td className='label'>
                    <span className='label-full'>MAX</span>
                    <span className='label-abbr'>MAX</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_MAX_SINGLE_JUMP', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {canJump ? <span>{f2(Calc.jumpRange(ship.unladenMass - ship.fuelCapacity + ship.standard[2].m.getMaxFuelPerJump(), ship.standard[2].m, ship.standard[2].m.getMaxFuelPerJump(), ship))}{u.LY}</span> : <span className='warning'>0 <Warning/></span>}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>UNLADEN</span>
                    <span className='label-abbr'>UNLADEN</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_UNLADEN_SINGLE_JUMP', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {canJump ? <span>{f2(Calc.jumpRange(ship.unladenMass, ship.standard[2].m, ship.fuelCapacity, ship))}{u.LY}</span> : <span className='warning'>0 <Warning/></span>}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>LADEN</span>
                    <span className='label-abbr'>LADEN</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_LADEN_SINGLE_JUMP', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {canJump ? <span>{f2(Calc.jumpRange(ship.unladenMass + ship.cargoCapacity, ship.standard[2].m, ship.fuelCapacity, ship))}{u.LY}</span> : <span className='warning'>0 <Warning/></span>}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('TOTAL UNL')}</span>
                    <span className='label-abbr'>TOTAL UNL</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_UNLADEN_TOTAL_JUMP', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {canJump ? <span>{f2(Calc.totalJumpRange(ship.unladenMass, ship.standard[2].m, ship.fuelCapacity, ship))}{u.LY}</span> : <span className='warning'>0 <Warning/></span>}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('TOTAL LDN')}</span>
                    <span className='label-abbr'>TOTAL LDN</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_LADEN_TOTAL_JUMP', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {canJump ? <span>{f2(Calc.totalJumpRange(ship.unladenMass + ship.cargoCapacity, ship.standard[2].m, ship.fuelCapacity, ship))}{u.LY}</span> : <span className='warning'>0 <Warning/></span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={cn('tab-group', 'tab-wpncap', { 'tab-active': activeTab === 'wpncap' })}>
          {/* Weapons */}
          <div className='stat-table'>
            <div className='stat-table-header'>{translate('WEAPONS')}</div>
            <table>
              <colgroup>
                <col className='stat-label-col' />
                <col className='stat-value-col' />
              </colgroup>
              <tbody>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('DPS')}</span>
                    <span className='label-abbr'>DPS</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_DPS', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {f1(ship.totalDps)}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('EPS')}</span>
                    <span className='label-abbr'>EPS</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_EPS', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {f1(ship.totalEps)}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('MAX TTD')}</span>
                    <span className='label-abbr'>MAX TTD</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_TTD', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {timeToDrain === Infinity ? '∞' : time(timeToDrain)}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>CURRENT TTD</span>
                    <span className='label-abbr'>Curr TTD</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_CURR_TTD', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {currTimeToDrain === Infinity ? '∞' : time(currTimeToDrain)}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('FIGHTERS')}</span>
                    <span className='label-abbr'>FIGHTERS</span>
                  </td>
                  <td className='value'>{canHaveFighters ? fighterBayCount : 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Capacity */}
          <div className='stat-table'>
            <div className='stat-table-header'>{translate('CAPACITY')}</div>
            <table>
              <colgroup>
                <col className='stat-label-col' />
                <col className='stat-value-col' />
              </colgroup>
              <tbody>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('CARGO')}</span>
                    <span className='label-abbr'>CARGO</span>
                  </td>
                  <td className='value'>{round(ship.cargoCapacity)}{u.T}</td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('FUEL')}</span>
                    <span className='label-abbr'>FUEL</span>
                  </td>
                  <td className='value'>{round(ship.fuelCapacity)}{u.T}</td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('PASSENGERS')}</span>
                    <span className='label-abbr'>PAX</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'passenger capacity', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {ship.passengerCapacity}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('CREW')}</span>
                    <span className='label-abbr'>CREW</span>
                  </td>
                  <td className='value'>{ship.crew}</td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('SRV')}</span>
                    <span className='label-abbr'>SRV</span>
                  </td>
                  <td className='value'>{srvBayCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={cn('tab-group', 'tab-massmisc', { 'tab-active': activeTab === 'massmisc' })}>
          {/* Mass */}
          <div className='stat-table'>
            <div className='stat-table-header'>{translate('MASS')}</div>
            <table>
              <colgroup>
                <col className='stat-label-col' />
                <col className='stat-value-col' />
              </colgroup>
              <tbody>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('HULL')}</span>
                    <span className='label-abbr'>HULL</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_HULL_MASS', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {int(ship.hullMass)}{u.T}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>DRY MASS</span>
                    <span className='label-abbr'>DRY MASS</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_DRY_MASS', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {int(Math.round(ship.dryMass))}{u.T}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('UNLADEN')}</span>
                    <span className='label-abbr'>UNLADEN</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_UNLADEN_MASS', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {int(ship.unladenMass)}{u.T}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('LADEN')}</span>
                    <span className='label-abbr'>LADEN</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_LADEN_MASS', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {int(ship.ladenMass)}{u.T}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('MASS LOCK')}</span>
                    <span className='label-abbr'>MASS LOCK</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, translate('MASS_LOCK_FACTOR'), { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {ship.masslock}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Misc Stats */}
          <div className='stat-table'>
            <div className='stat-table-header'>{translate('MISC')}</div>
            <table>
              <colgroup>
                <col className='stat-label-col' />
                <col className='stat-value-col' />
              </colgroup>
              <tbody>
                <tr>
                  <td className='label'>
                    <span className='label-full'>HEAT ({translate('BETA')})</span>
                    <span className='label-abbr'>HEAT ({translate('BETA')})</span>
                  </td>
                  <td className='value'>{formats.pct(restingHeat)}</td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>PWR RET</span>
                    <span className='label-abbr'>PWR RET</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_POWER_RETRACTED', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {f2(ship.powerRetracted)}{u.MW}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>PWR DEP</span>
                    <span className='label-abbr'>PWR DEP</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'TT_POWER_DEPLOYED', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {f2(ship.powerDeployed)}{u.MW}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>COST</span>
                    <span className='label-abbr'>COST</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, translate('TT_TOTAL_COST') + ': ' + int(ship.totalCost) + ' CR', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {compactCredits(ship.totalCost)}{u.CR}
                  </td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>INSURANCE</span>
                    <span className='label-abbr'>INS</span>
                  </td>
                  <td
                    className='value'
                    onMouseEnter={termtip.bind(null, 'Insurance cost: ' + int(ship.totalCost * Insurance[Persist.getInsurance()]) + ' CR', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {compactCredits(ship.totalCost * Insurance[Persist.getInsurance()])}{u.CR}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>

        {/* Shield and Armour Details */}
        <div className='defense-tables'>
        <div className={cn('tab-group', 'tab-shield', { 'tab-active': activeTab === 'shield' })}>
          {/* Shield */}
          <div className='defense-table'>
            <div className={cn('defense-header', shieldColour)}>
              {translate('SHIELD')}
            </div>
            <table>
              <colgroup>
                <col />
                <col className='col-abs-label' />
                <col className='col-abs-value' />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <tbody>
                <tr className='info-row alt-row'>
                  <td className='label'>{translate('TYPE')}</td>
                  <td className='value' colSpan={3}><span className='label-full'>{translate(shieldGenerator && shieldGenerator.m.grp || 'NO_SHIELD')}</span><span className='label-abbr'>{shieldTypeShort}</span></td>
                  <td className='label'>
                    <span className='label-full'>{translate('STRENGTH')}</span>
                    <span className='label-abbr'>STR</span>
                  </td>
                  <td
                    className={cn('value', sgClassNames)}
                    colSpan={4}
                    onMouseEnter={termtip.bind(null, sgTooltip, { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {int(ship.shield)}{u.MJ}
                  </td>
                </tr>
                <tr className='info-row-narrow alt-row'>
                  <td className='info-pair' colSpan={4}>
                    <span className='pair-label'>{translate('TYPE')}</span>
                    <span className='pair-value'>{shieldTypeShort}</span>
                  </td>
                  <td
                    className={cn('info-pair', sgClassNames)}
                    colSpan={5}
                    onMouseEnter={termtip.bind(null, sgTooltip, { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    <span className='pair-label'>STR</span>
                    <span className='pair-value'>{int(ship.shield)}{u.MJ}</span>
                  </td>
                </tr>
                <tr className='info-row'>
                  <td className='label'>
                    <span className='label-full'>{translate('RECOVERY')}</span>
                    <span className='label-abbr'>REC</span>
                  </td>
                  <td
                    className='value'
                    colSpan={3}
                    onMouseEnter={termtip.bind(null, 'PHRASE_SG_RECOVER', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {sgMetrics && sgMetrics.recover === Math.Inf ? translate('Never') : formats.time(sgMetrics.recover)}
                  </td>
                  <td className='label'>
                    <span className='label-full'>{translate('RECHARGE')}</span>
                    <span className='label-abbr'>RCHG</span>
                  </td>
                  <td
                    className='value'
                    colSpan={4}
                    onMouseEnter={termtip.bind(null, 'PHRASE_SG_RECHARGE', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {sgMetrics && sgMetrics.recharge === Math.Inf ? translate('Never') : formats.time(sgMetrics.recharge)}
                  </td>
                </tr>
                <tr className='info-row-narrow'>
                  <td
                    className='info-pair'
                    colSpan={4}
                    onMouseEnter={termtip.bind(null, 'PHRASE_SG_RECOVER', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    <span className='pair-label'>REC</span>
                    <span className='pair-value'>{sgMetrics && sgMetrics.recover === Math.Inf ? translate('Never') : formats.time(sgMetrics.recover)}</span>
                  </td>
                  <td
                    className='info-pair'
                    colSpan={5}
                    onMouseEnter={termtip.bind(null, 'PHRASE_SG_RECHARGE', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    <span className='pair-label'>RCHG</span>
                    <span className='pair-value'>{sgMetrics && sgMetrics.recharge === Math.Inf ? translate('Never') : formats.time(sgMetrics.recharge)}</span>
                  </td>
                </tr>
                <tr className='alt-row'>
                  <td className='label'>
                    <span className='label-full'>HP</span>
                    <span className='label-abbr'>HP</span>
                  </td>
                  <td className='res-label'>
                    <span className='res-label-full'>ABS</span>
                    <span className='res-label-abbr'>ABS</span>
                  </td>
                  <td className='res-value'>{int(ship && sgMetrics.summary > 0 ? sgMetrics.summary / sgMetrics.absolute.total : 0)}<span className='unit-narrow-hide'>{u.MJ}</span></td>
                  <td className='res-label'>
                    <span className='res-label-full'>EXPL</span>
                    <span className='res-label-abbr'>EXPL</span>
                  </td>
                  <td className='res-value'>{int(ship && sgMetrics.summary > 0 ? sgMetrics.summary / sgMetrics.explosive.total : 0)}<span className='unit-narrow-hide'>{u.MJ}</span></td>
                  <td className='res-label'>
                    <span className='res-label-full'>KIN</span>
                    <span className='res-label-abbr'>KIN</span>
                  </td>
                  <td className='res-value'>{int(ship && sgMetrics.summary ? sgMetrics.summary / sgMetrics.kinetic.total : 0)}<span className='unit-narrow-hide'>{u.MJ}</span></td>
                  <td className='res-label'>
                    <span className='res-label-full'>THRM</span>
                    <span className='res-label-abbr'>THRM</span>
                  </td>
                  <td className='res-value'>{int(ship && sgMetrics.summary ? sgMetrics.summary / sgMetrics.thermal.total : 0)}<span className='unit-narrow-hide'>{u.MJ}</span></td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('RESISTANCE')}</span>
                    <span className='label-abbr'>RES</span>
                  </td>
                  <td colSpan={2}></td>
                  <td className='res-label'>
                    <span className='res-label-full'>{translate('EXPLOSIVE')}</span>
                    <span className='res-label-abbr'>EXPL</span>
                  </td>
                  <td className='res-value'>{formats.pct1(ship.shieldExplRes)}</td>
                  <td className='res-label'>
                    <span className='res-label-full'>{translate('KINETIC')}</span>
                    <span className='res-label-abbr'>KIN</span>
                  </td>
                  <td className='res-value'>{formats.pct1(ship.shieldKinRes)}</td>
                  <td className='res-label'>
                    <span className='res-label-full'>{translate('THERMAL')}</span>
                    <span className='res-label-abbr'>THRM</span>
                  </td>
                  <td className='res-value'>{formats.pct1(ship.shieldThermRes)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={cn('tab-group', 'tab-armour', { 'tab-active': activeTab === 'armour' })}>
          {/* Armour */}
          <div className='defense-table'>
            <div className='defense-header'>
              {translate('ARMOUR')}
            </div>
            <table>
              <colgroup>
                <col />
                <col className='col-abs-label' />
                <col className='col-abs-value' />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <tbody>
                <tr className='info-row alt-row'>
                  <td className='label'>{translate('TYPE')}</td>
                  <td className='value' colSpan={5}><span className='label-full'>{translate(bulkheadName)}</span><span className='label-abbr'>{armourTypeShort}</span></td>
                  <td className='label'>
                    <span className='label-full'>{translate('INTEGRITY')}</span>
                    <span className='label-abbr'>INT</span>
                  </td>
                  <td
                    className='value'
                    colSpan={4}
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_INTEGRITY', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {int(ship.armour)}
                  </td>
                </tr>
                <tr className='info-row-narrow alt-row'>
                  <td className='info-pair' colSpan={5}>
                    <span className='pair-label'>{translate('TYPE')}</span>
                    <span className='pair-value'>{armourTypeShort}</span>
                  </td>
                  <td
                    className='info-pair'
                    colSpan={6}
                    onMouseEnter={termtip.bind(null, 'TT_SUMMARY_INTEGRITY', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    <span className='pair-label'>INT</span>
                    <span className='pair-value'>{int(ship.armour)}</span>
                  </td>
                </tr>
                <tr className='info-row'>
                  <td className='label'>
                    <span className='label-full'>{translate('HARDNESS')}</span>
                    <span className='label-abbr'>HARD</span>
                  </td>
                  <td
                    className='value'
                    colSpan={3}
                    onMouseEnter={termtip.bind(null, 'hull hardness', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {int(ship.hardness)}
                  </td>
                  <td className='label'>
                    <span className='label-full'>{translate('RAW')}</span>
                    <span className='label-abbr'>RAW</span>
                  </td>
                  <td
                    className='value'
                    colSpan={2}
                    onMouseEnter={termtip.bind(null, 'TT_MODULE_ARMOUR', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {int(armourMetrics.modulearmour)}
                  </td>
                  <td className='label'>
                    <span className='label-full'>{translate('INTERNAL')}</span>
                    <span className='label-abbr'>INTL</span>
                  </td>
                  <td
                    className='value'
                    colSpan={3}
                    onMouseEnter={termtip.bind(null, 'TT_MODULE_PROTECTION_INTERNAL', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    {int(armourMetrics.moduleprotection * 100) + '%'}
                  </td>
                </tr>
                <tr className='info-row-narrow'>
                  <td
                    className='info-pair'
                    colSpan={4}
                    onMouseEnter={termtip.bind(null, 'hull hardness', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    <span className='pair-label'>HARD</span>
                    <span className='pair-value'>{int(ship.hardness)}</span>
                  </td>
                  <td
                    className='info-pair'
                    colSpan={3}
                    onMouseEnter={termtip.bind(null, 'TT_MODULE_ARMOUR', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    <span className='pair-label'>RAW</span>
                    <span className='pair-value'>{int(armourMetrics.modulearmour)}</span>
                  </td>
                  <td
                    className='info-pair'
                    colSpan={4}
                    onMouseEnter={termtip.bind(null, 'TT_MODULE_PROTECTION_INTERNAL', { cap: 0 })}
                    onMouseLeave={hide}
                  >
                    <span className='pair-label'>INTL</span>
                    <span className='pair-value'>{int(armourMetrics.moduleprotection * 100) + '%'}</span>
                  </td>
                </tr>
                <tr className='alt-row'>
                  <td className='label'>
                    <span className='label-full'>HP</span>
                    <span className='label-abbr'>HP</span>
                  </td>
                  <td className='res-label'>
                    <span className='res-label-full'>ABS</span>
                    <span className='res-label-abbr'>ABS</span>
                  </td>
                  <td className='res-value'>{int(armourMetrics.total)}</td>
                  <td className='res-label'>
                    <span className='res-label-full'>EXPL</span>
                    <span className='res-label-abbr'>EXPL</span>
                  </td>
                  <td className='res-value'>{int(armourMetrics.total / armourMetrics.explosive.total)}</td>
                  <td className='res-label'>
                    <span className='res-label-full'>KIN</span>
                    <span className='res-label-abbr'>KIN</span>
                  </td>
                  <td className='res-value'>{int(armourMetrics.total / armourMetrics.kinetic.total)}</td>
                  <td className='res-label'>
                    <span className='res-label-full'>THRM</span>
                    <span className='res-label-abbr'>THRM</span>
                  </td>
                  <td className='res-value'>{int(armourMetrics.total / armourMetrics.thermal.total)}</td>
                  <td className='res-label'>
                    <span className='res-label-full'>CAUS</span>
                    <span className='res-label-abbr'>CAUS</span>
                  </td>
                  <td className='res-value'>{int(armourMetrics.total / armourMetrics.caustic.total)}</td>
                </tr>
                <tr>
                  <td className='label'>
                    <span className='label-full'>{translate('RESISTANCE')}</span>
                    <span className='label-abbr'>RES</span>
                  </td>
                  <td colSpan={2}></td>
                  <td className='res-label'>
                    <span className='res-label-full'>{translate('EXPLOSIVE')}</span>
                    <span className='res-label-abbr'>EXPL</span>
                  </td>
                  <td className='res-value'>{formats.pct1(ship.hullExplRes)}</td>
                  <td className='res-label'>
                    <span className='res-label-full'>{translate('KINETIC')}</span>
                    <span className='res-label-abbr'>KIN</span>
                  </td>
                  <td className='res-value'>{formats.pct1(ship.hullKinRes)}</td>
                  <td className='res-label'>
                    <span className='res-label-full'>{translate('THERMAL')}</span>
                    <span className='res-label-abbr'>THRM</span>
                  </td>
                  <td className='res-value'>{formats.pct1(ship.hullThermRes)}</td>
                  <td className='res-label'>
                    <span className='res-label-full'>{translate('CAUSTIC')}</span>
                    <span className='res-label-abbr'>CAUS</span>
                  </td>
                  <td className='res-value'>{formats.pct1(ship.hullCausRes)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>

        </div>}
      </div>
    );
  }
}
