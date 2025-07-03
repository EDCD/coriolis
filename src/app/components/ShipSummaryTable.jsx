import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import cn from 'classnames';
import { Warning } from './SvgIcons';
import * as Calc from '../shipyard/Calculations';

/**
 * Ship Summary Table / Stats
 */
export default class ShipSummaryTable extends TranslatedComponent {

  static propTypes = {
    ship: PropTypes.object.isRequired,
    cargo: PropTypes.number.isRequired,
    fuel: PropTypes.number.isRequired,
    marker: PropTypes.string.isRequired,
    pips: PropTypes.object.isRequired
  };

  /**
   * The ShipSummaryTable constructor
   * @param {Object} props The props
   */
  constructor(props) {
    super(props);
    this.didContextChange = this.didContextChange.bind(this);
    this.state = {
      shieldColour: 'blue'
    };
  }

  /**
   * Render the table
   * @return {React.Component} Summary table
   */
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
    const canThrust = ship.canThrust(cargo, ship.fuelCapacity);
    const speedTooltip = canThrust ? 'TT_SUMMARY_SPEED' : 'TT_SUMMARY_SPEED_NONFUNCTIONAL';
    const canBoost = ship.canBoost(cargo, ship.fuelCapacity);
    const boostTooltip = canBoost ? 'TT_SUMMARY_BOOST' : canThrust ? 'TT_SUMMARY_BOOST_NONFUNCTIONAL' : 'TT_SUMMARY_SPEED_NONFUNCTIONAL';
    const canJump = ship.getSlotStatus(ship.standard[2]) == 3;
    const sgMetrics = Calc.shieldMetrics(ship, pips.sys);
    const distBoost = canBoost ?  Calc.calcBoost(ship) : 'No Boost';
    //const shipBoost = ship.boostInterval(ship)
    const restingHeat = Math.sqrt(((ship.standard[0].m.pgen * ship.standard[0].m.eff) / ship.heatCapacity) / 0.2);
    const armourMetrics = Calc.armourMetrics(ship);
    let shieldColour = 'blue';
    if (shieldGenerator && shieldGenerator.m.grp === 'psg') {
      shieldColour = 'green';
    } else if (shieldGenerator && shieldGenerator.m.grp === 'bsg') {
      shieldColour = 'purple';
    }
    this.state = {
      shieldColour
    };
    return <div id='summary'>
      <div style={{display: "table", width: "100%"}}>
        <div style={{display: "table-row"}}>
          <table className={'summaryTable'}>
            <thead>
              <tr className='main'>
                <th rowSpan={2} className={ cn({ 'bg-warning-disabled': !canThrust }) }>{translate('speed')}</th>
                <th rowSpan={2} className={ cn({ 'bg-warning-disabled': !canBoost }) }>{translate('boost')}</th>
                <th onMouseEnter={termtip.bind(null, 'TT_SUMMARY_BOOST_INTERVALS', { cap: 0 })}colSpan={2} className={ cn({ 'bg-warning-disabled': !canBoost }) }>{translate('boost int')}</th>
                <th colSpan={5} className={ cn({ 'bg-warning-disabled': !canJump }) }>{translate('jump range')}</th>
                <th rowSpan={2}>{translate('shield')}</th>
                <th rowSpan={2}>{translate('integrity')}</th>
                <th rowSpan={2}>{translate('DPS')}</th>
                <th rowSpan={2}>{translate('EPS')}</th>
                <th rowSpan={2}>{translate('TTD')}</th>
                {/* <th onMouseEnter={termtip.bind(null, 'heat per second')} onMouseLeave={hide} rowSpan={2}>{translate('HPS')}</th> */}
                <th rowSpan={2}>{translate('cargo')}</th>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'passenger capacity', { cap: 0 })} onMouseLeave={hide}>{translate('pax')}</th>
                <th rowSpan={2}>{translate('fuel')}</th>
                <th colSpan={3}>{translate('mass')}</th>
                <th onMouseEnter={termtip.bind(null, 'hull hardness', { cap: 0 })} onMouseLeave={hide} rowSpan={2}>{translate('hrd')}</th>
                <th rowSpan={2}>{translate('crew')}</th>
                <th onMouseEnter={termtip.bind(null, 'mass lock factor', { cap: 0 })} onMouseLeave={hide} rowSpan={2}>{translate('MLF')}</th>
                <th rowSpan={2}>{translate('resting heat (Beta)')}</th>
              </tr>
              <tr>
                <th onMouseEnter={termtip.bind(null, 'TT_SUMMARY_BOOST_INTERVAL', { cap: 0 })} onMouseLeave={hide}>{translate('distro')}</th>
                <th onMouseEnter={termtip.bind(null, 'TT_SUMMARY_SHIP_BOOST_INTERVAL', { cap: 0 })} onMouseLeave={hide}>{translate('ship')}</th>
                <th className={ cn({ 'lft': true, 'bg-warning-disabled': !canJump }) }>{translate('max')}</th>
                <th className={ cn({ 'bg-warning-disabled': !canJump }) }>{translate('unladen')}</th>
                <th className={ cn({ 'bg-warning-disabled': !canJump }) }>{translate('laden')}</th>
                <th className={ cn({ 'bg-warning-disabled': !canJump }) }>{translate('total unladen')}</th>
                <th className={ cn({ 'bg-warning-disabled': !canJump }) }>{translate('total laden')}</th>
                <th className='lft'>{translate('hull')}</th>
                <th>{translate('unladen')}</th>
                <th>{translate('laden')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td onMouseEnter={termtip.bind(null, speedTooltip, { cap: 0 })} onMouseLeave={hide}>{ canThrust ? <span>{int(ship.calcSpeed(4, ship.fuelCapacity, 0, false))}{u['m/s']}</span> : <span className='warning'>0 <Warning/></span> }</td>
                <td onMouseEnter={termtip.bind(null, boostTooltip, { cap: 0 })} onMouseLeave={hide}>{ canBoost ? <span>{int(ship.calcSpeed(4, ship.fuelCapacity, 0, true))}{u['m/s']}</span> : <span className='warning'>0 <Warning/></span> }</td>
                <td>{distBoost !== 'No Boost' ? formats.time(distBoost) : 'No Boost'}</td>
                <td>{ship.boostInt && ship.boostInt !== 'undefined' ? formats.time(ship.boostInt) : 0 }</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_MAX_SINGLE_JUMP', { cap: 0 })} onMouseLeave={hide}>{ canJump ? <span>{ f2(Calc.jumpRange(ship.outfittedMass + ship.standard[2].m.getMaxFuelPerJump(), ship.standard[2].m, ship.standard[2].m.getMaxFuelPerJump(), ship))}{u.LY}</span> : <span className='warning'>0 <Warning/></span> }</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_UNLADEN_SINGLE_JUMP', { cap: 0 })} onMouseLeave={hide}>{ canJump ? <span>{f2(Calc.jumpRange(ship.unladenMass + ship.reserveFuelCapacity, ship.standard[2].m, ship.fuelCapacity, ship))}{u.LY}</span> : <span className='warning'>0 <Warning/></span> }</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_LADEN_SINGLE_JUMP', { cap: 0 })} onMouseLeave={hide}>{ canJump ? <span>{f2(Calc.jumpRange(ship.ladenMass, ship.standard[2].m, ship.fuelCapacity, ship))}{u.LY}</span> : <span className='warning'>0 <Warning/></span> }</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_UNLADEN_TOTAL_JUMP', { cap: 0 })} onMouseLeave={hide}>{ canJump ? <span>{f2(Calc.totalJumpRange(ship.unladenMass, ship.standard[2].m, ship.fuelCapacity, ship))}{u.LY}</span> : <span className='warning'>0 <Warning/></span> }</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_LADEN_TOTAL_JUMP', { cap: 0 })} onMouseLeave={hide}>{ canJump ? <span>{f2(Calc.totalJumpRange(ship.ladenMass, ship.standard[2].m, ship.fuelCapacity, ship))}{u.LY}</span> : <span className='warning'>0 <Warning/></span> }</td>
                <td className={sgClassNames} onMouseEnter={termtip.bind(null, sgTooltip, { cap: 0 })} onMouseLeave={hide}>{int(ship.shield)}{u.MJ}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_INTEGRITY', { cap: 0 })} onMouseLeave={hide}>{int(ship.armour)}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_DPS', { cap: 0 })} onMouseLeave={hide}>{f1(ship.totalDps)}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_EPS', { cap: 0 })} onMouseLeave={hide}>{f1(ship.totalEps)}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_TTD', { cap: 0 })} onMouseLeave={hide}>{timeToDrain === Infinity ? '∞' : time(timeToDrain)}</td>
                {/* <td>{f1(ship.totalHps)}</td> */}
                <td>{round(ship.cargoCapacity)}{u.T}</td>
                <td>{ship.passengerCapacity}</td>
                <td>{round(ship.fuelCapacity)}{u.T}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_HULL_MASS', { cap: 0 })} onMouseLeave={hide}>{int(ship.hullMass)}{u.T}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_UNLADEN_MASS', { cap: 0 })} onMouseLeave={hide}>{(ship.unladenMass + ship.reserveFuelCapacity).toFixed(1)}{u.T}</td>
                <td onMouseEnter={termtip.bind(null, 'TT_SUMMARY_LADEN_MASS', { cap: 0 })} onMouseLeave={hide}>{(ship.ladenMass + ship.reserveFuelCapacity).toFixed(1)}{u.T}</td>
                <td>{int(ship.hardness)}</td>
                <td>{ship.crew}</td>
                <td>{ship.masslock}</td>
                <td>{formats.pct(restingHeat)}</td>
              </tr>
            </tbody>
          </table>
          <table className={'summaryTable'}>
            <thead className={this.state.shieldColour}>
              <tr>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'shield', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('shield')}</th>
                <th colSpan={4} className='lft'>{translate('resistance')}</th>

                <th colSpan={5} onMouseEnter={termtip.bind(null, 'TT_SUMMARY_SHIELDS_SCB', { cap: 0 })} onMouseLeave={hide} className='lft'>{`${translate('HP')}`}</th>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'PHRASE_SG_RECOVER', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('recovery')}</th>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'PHRASE_SG_RECHARGE', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('recharge')}</th>
              </tr>
              <tr>
                <th>{`${translate('explosive')}`}</th>
                <th>{`${translate('kinetic')}`}</th>
                <th>{`${translate('thermal')}`}</th>
                <th></th>

                <th className={'bordered'}>{`${translate('absolute')}`}</th>
                <th>{`${translate('explosive')}`}</th>
                <th>{`${translate('kinetic')}`}</th>
                <th>{`${translate('thermal')}`}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
            <tr>
              <td>{translate(shieldGenerator && shieldGenerator.m.grp || 'No Shield')}</td>
              <td>{formats.pct1(ship.shieldExplRes)}</td>
              <td>{formats.pct1(ship.shieldKinRes)}</td>
              <td>{formats.pct1(ship.shieldThermRes)}</td>
              <td></td>

              <td>{int(ship && sgMetrics.summary > 0 ? sgMetrics.summary : 0)}{u.MJ}</td>
              <td>{int(ship && sgMetrics.summary > 0 ? sgMetrics.summary / sgMetrics.explosive.base : 0)}{u.MJ}</td>
              <td>{int(ship && sgMetrics.summary ? sgMetrics.summary / sgMetrics.kinetic.base : 0)}{u.MJ}</td>
              <td>{int(ship && sgMetrics.summary ? sgMetrics.summary / sgMetrics.thermal.base : 0)}{u.MJ}</td>
              <td></td>
              <td>{sgMetrics && sgMetrics.recover === Math.Inf ? translate('Never') : formats.time(sgMetrics.recover)}</td>
              <td>{sgMetrics && sgMetrics.recharge === Math.Inf ? translate('Never') : formats.time(sgMetrics.recharge)}</td>
            </tr>
            </tbody>
            <thead>
              <tr>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'armour', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('armour')}</th>
                <th colSpan={4} className='lft'>{translate('resistance')}</th>

                <th colSpan={5} onMouseEnter={termtip.bind(null, 'PHRASE_EFFECTIVE_ARMOUR', { cap: 0 })} onMouseLeave={hide} className='lft'>{`${translate('HP')}`}</th>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'TT_MODULE_ARMOUR', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('raw module armour')}</th>
                <th rowSpan={2} onMouseEnter={termtip.bind(null, 'TT_MODULE_PROTECTION_INTERNAL', { cap: 0 })} onMouseLeave={hide} className='lft'>{translate('internal protection')}</th>
              </tr>
              <tr>
              <th>{`${translate('explosive')}`}</th>
                <th>{`${translate('kinetic')}`}</th>
                <th>{`${translate('thermal')}`}</th>
                <th>{`${translate('caustic')}`}</th>

                <th className={'bordered'}>{`${translate('absolute')}`}</th>
                <th>{`${translate('explosive')}`}</th>
                <th>{`${translate('kinetic')}`}</th>
                <th>{`${translate('thermal')}`}</th>
                <th>{`${translate('caustic')}`}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{translate(ship && ship.bulkheads && ship.bulkheads.m && ship.bulkheads.m.name || 'No Armour')}</td>
                <td>{formats.pct1(ship.hullExplRes)}</td>
                <td>{formats.pct1(ship.hullKinRes)}</td>
                <td>{formats.pct1(ship.hullThermRes)}</td>
                <td>{formats.pct1(ship.hullCausRes)}</td>
                <td>{int(armourMetrics.total)}</td>
                <td>{int(armourMetrics.total / armourMetrics.explosive.total)}</td>
                <td>{int(armourMetrics.total/ armourMetrics.kinetic.total)}</td>
                <td>{int(armourMetrics.total / armourMetrics.thermal.total)}</td>
                <td>{int(armourMetrics.total/ armourMetrics.caustic.total)}</td>
                <td>{int(armourMetrics.modulearmour)}</td>
                <td>{int(armourMetrics.moduleprotection * 100) + '%'}</td>

              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>;
  }
}
