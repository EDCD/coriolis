import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import * as Calc from '../shipyard/Calculations';
import PieChart from './PieChart';
import VerticalBarChart from './VerticalBarChart';

/**
 * Defence information
 * Shield information consists of four panels:
 *   - textual information (time to lose shields etc.)
 *   - breakdown of shield sources (pie chart)
 *   - comparison of shield resistances (bar chart)
 *   - effective shield (bar chart)
 */
export default class Defence extends TranslatedComponent {
  static propTypes = {
    marker: PropTypes.string.isRequired,
    ship: PropTypes.object.isRequired,
    opponent: PropTypes.object.isRequired,
    engagementrange: PropTypes.number.isRequired,
    sys: PropTypes.number.isRequired,
    opponentWep: PropTypes.number.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);

    const { shield, armour, shielddamage, armourdamage } = Calc.defenceMetrics(props.ship, props.opponent, props.sys, props.opponentWep, props.engagementrange);
    this.state = { shield, armour, shielddamage, armourdamage };
  }

  /**
   * Update the state if our properties change
   * @param  {Object} nextProps   Incoming/Next properties
   * @return {boolean}            Returns true if the component should be rerendered
   */
  componentWillReceiveProps(nextProps) {
    if (this.props.marker != nextProps.marker || this.props.sys != nextProps.sys) {
      const { shield, armour, shielddamage, armourdamage } = Calc.defenceMetrics(nextProps.ship, nextProps.opponent, nextProps.sys, nextProps.opponentWep, nextProps.engagementrange);
      this.setState({ shield, armour, shielddamage, armourdamage });
    }
    return true;
  }

  /**
   * Render defence
   * @return {React.Component} contents
   */
  render() {
    const { opponent, sys, opponentWep } = this.props;
    const { language, tooltip, termtip } = this.context;
    const { formats, translate, units } = language;
    const { shield, armour, shielddamage, armourdamage } = this.state;

    const pd = opponent.standard[4].m;

    const shieldSourcesData = [];
    const effectiveShieldData = [];
    const shieldDamageTakenData = [];
    const shieldSourcesTt = [];
    const shieldDamageTakenAbsoluteTt = [];
    const shieldDamageTakenExplosiveTt = [];
    const shieldDamageTakenKineticTt = [];
    const shieldDamageTakenThermalTt = [];
    const effectiveShieldAbsoluteTt = [];
    const effectiveShieldExplosiveTt = [];
    const effectiveShieldKineticTt = [];
    const effectiveShieldThermalTt = [];
    let maxEffectiveShield = 0;
    if (shield.total) {
      shieldSourcesData.push({ value: Math.round(shield.generator), label: translate('generator') });
      shieldSourcesData.push({ value: Math.round(shield.boosters), label: translate('boosters') });
      shieldSourcesData.push({ value: Math.round(shield.cells), label: translate('cells') });
      shieldSourcesData.push({ value: Math.round(shield.addition), label: translate('shield addition') });

      if (shield.generator > 0) {
        shieldSourcesTt.push(<div key='generator'>{translate('generator') + ' ' + formats.int(shield.generator)}{units.MJ}</div>);
        effectiveShieldAbsoluteTt.push(<div key='generator'>{translate('generator') + ' ' + formats.int(shield.generator)}{units.MJ}</div>);
        effectiveShieldExplosiveTt.push(<div key='generator'>{translate('generator') + ' ' + formats.int(shield.generator)}{units.MJ}</div>);
        effectiveShieldKineticTt.push(<div key='generator'>{translate('generator') + ' ' + formats.int(shield.generator)}{units.MJ}</div>);
        effectiveShieldThermalTt.push(<div key='generator'>{translate('generator') + ' ' + formats.int(shield.generator)}{units.MJ}</div>);
        if (shield.boosters > 0) {
          shieldSourcesTt.push(<div key='boosters'>{translate('boosters') + ' ' + formats.int(shield.boosters)}{units.MJ}</div>);
          effectiveShieldAbsoluteTt.push(<div key='boosters'>{translate('boosters') + ' ' + formats.int(shield.boosters)}{units.MJ}</div>);
          effectiveShieldExplosiveTt.push(<div key='boosters'>{translate('boosters') + ' ' + formats.int(shield.boosters)}{units.MJ}</div>);
          effectiveShieldKineticTt.push(<div key='boosters'>{translate('boosters') + ' ' + formats.int(shield.boosters)}{units.MJ}</div>);
          effectiveShieldThermalTt.push(<div key='boosters'>{translate('boosters') + ' ' + formats.int(shield.boosters)}{units.MJ}</div>);
        }

        if (shield.cells > 0) {
          shieldSourcesTt.push(<div key='cells'>{translate('cells') + ' ' + formats.int(shield.cells)}{units.MJ}</div>);
          effectiveShieldAbsoluteTt.push(<div key='cells'>{translate('cells') + ' ' + formats.int(shield.cells)}{units.MJ}</div>);
          effectiveShieldExplosiveTt.push(<div key='cells'>{translate('cells') + ' ' + formats.int(shield.cells)}{units.MJ}</div>);
          effectiveShieldKineticTt.push(<div key='cells'>{translate('cells') + ' ' + formats.int(shield.cells)}{units.MJ}</div>);
          effectiveShieldThermalTt.push(<div key='cells'>{translate('cells') + ' ' + formats.int(shield.cells)}{units.MJ}</div>);
        }

        // Add effective shield from resistances
        const rawMj = shield.generator + shield.boosters + shield.cells;
        const explosiveMj = rawMj / (shield.explosive.base) - rawMj;
        if (explosiveMj != 0) effectiveShieldExplosiveTt.push(<div key='resistance'>{translate('resistance') + ' ' + formats.int(explosiveMj)}{units.MJ}</div>);
        const kineticMj = rawMj / (shield.kinetic.base) - rawMj;
        if (kineticMj != 0) effectiveShieldKineticTt.push(<div key='resistance'>{translate('resistance') + ' ' + formats.int(kineticMj)}{units.MJ}</div>);
        const thermalMj = rawMj / (shield.thermal.base) - rawMj;
        if (thermalMj != 0) effectiveShieldThermalTt.push(<div key='resistance'>{translate('resistance') + ' ' + formats.int(thermalMj)}{units.MJ}</div>);

        // Add effective shield from power distributor SYS pips
        if (shield.absolute.sys != 1) {
          effectiveShieldAbsoluteTt.push(<div key='power distributor'>{translate('power distributor') + ' ' + formats.int(rawMj / shield.absolute.total - rawMj)}{units.MJ}</div>);
          effectiveShieldExplosiveTt.push(<div key='power distributor'>{translate('power distributor') + ' ' + formats.int(rawMj / shield.explosive.total - rawMj / shield.explosive.base)}{units.MJ}</div>);
          effectiveShieldKineticTt.push(<div key='power distributor'>{translate('power distributor') + ' ' + formats.int(rawMj / shield.kinetic.total - rawMj / shield.kinetic.base)}{units.MJ}</div>);
          effectiveShieldThermalTt.push(<div key='power distributor'>{translate('power distributor') + ' ' + formats.int(rawMj / shield.thermal.total - rawMj / shield.thermal.base)}{units.MJ}</div>);
        }
      }

      shieldDamageTakenAbsoluteTt.push(<div key='generator'>{translate('generator') + ' ' + formats.pct1(shield.absolute.generator)}</div>);
      shieldDamageTakenAbsoluteTt.push(<div key='boosters'>{translate('boosters') + ' ' + formats.pct1(shield.absolute.boosters)}</div>);
      shieldDamageTakenAbsoluteTt.push(<div key='power distributor'>{translate('power distributor') + ' ' + formats.pct1(shield.absolute.sys)}</div>);

      shieldDamageTakenExplosiveTt.push(<div key='generator'>{translate('generator') + ' ' + formats.pct1(shield.explosive.generator)}</div>);
      shieldDamageTakenExplosiveTt.push(<div key='boosters'>{translate('boosters') + ' ' + formats.pct1(shield.explosive.boosters)}</div>);
      shieldDamageTakenExplosiveTt.push(<div key='power distributor'>{translate('power distributor') + ' ' + formats.pct1(shield.explosive.sys)}</div>);

      shieldDamageTakenKineticTt.push(<div key='generator'>{translate('generator') + ' ' + formats.pct1(shield.kinetic.generator)}</div>);
      shieldDamageTakenKineticTt.push(<div key='boosters'>{translate('boosters') + ' ' + formats.pct1(shield.kinetic.boosters)}</div>);
      shieldDamageTakenKineticTt.push(<div key='power distributor'>{translate('power distributor') + ' ' + formats.pct1(shield.kinetic.sys)}</div>);

      shieldDamageTakenThermalTt.push(<div key='generator'>{translate('generator') + ' ' + formats.pct1(shield.thermal.generator)}</div>);
      shieldDamageTakenThermalTt.push(<div key='boosters'>{translate('boosters') + ' ' + formats.pct1(shield.thermal.boosters)}</div>);
      shieldDamageTakenThermalTt.push(<div key='power distributor'>{translate('power distributor') + ' ' + formats.pct1(shield.thermal.sys)}</div>);

      const effectiveAbsoluteShield = shield.total / shield.absolute.total;
      effectiveShieldData.push({ value: Math.round(effectiveAbsoluteShield), label: translate('absolute'), tooltip: effectiveShieldAbsoluteTt });
      const effectiveExplosiveShield = shield.total / shield.explosive.total;
      effectiveShieldData.push({ value: Math.round(effectiveExplosiveShield), label: translate('explosive'), tooltip: effectiveShieldExplosiveTt });
      const effectiveKineticShield = shield.total / shield.kinetic.total;
      effectiveShieldData.push({ value: Math.round(effectiveKineticShield), label: translate('kinetic'), tooltip: effectiveShieldKineticTt });
      const effectiveThermalShield = shield.total / shield.thermal.total;
      effectiveShieldData.push({ value: Math.round(effectiveThermalShield), label: translate('thermal'), tooltip: effectiveShieldThermalTt });

      shieldDamageTakenData.push({ value: Math.round(shield.absolute.total * 100), label: translate('absolute'), tooltip: shieldDamageTakenAbsoluteTt });
      shieldDamageTakenData.push({ value: Math.round(shield.explosive.total * 100), label: translate('explosive'), tooltip: shieldDamageTakenExplosiveTt });
      shieldDamageTakenData.push({ value: Math.round(shield.kinetic.total * 100), label: translate('kinetic'), tooltip: shieldDamageTakenKineticTt });
      shieldDamageTakenData.push({ value: Math.round(shield.thermal.total * 100), label: translate('thermal'), tooltip: shieldDamageTakenThermalTt });

      maxEffectiveShield = Math.max(shield.total / shield.absolute.max, shield.total / shield.explosive.max, shield.total / shield.kinetic.max, shield.total / shield.thermal.max);
    }

    const armourSourcesData = [];
    armourSourcesData.push({ value: Math.round(armour.bulkheads), label: translate('bulkheads') });
    armourSourcesData.push({ value: Math.round(armour.reinforcement), label: translate('reinforcement') });

    const armourSourcesTt = [];
    const effectiveArmourAbsoluteTt = [];
    const effectiveArmourExplosiveTt = [];
    const effectiveArmourKineticTt = [];
    const effectiveArmourThermalTt = [];
    const effectiveArmourCausticTt = [];
    if (armour.bulkheads > 0) {
      armourSourcesTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.int(armour.bulkheads)}</div>);
      effectiveArmourAbsoluteTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.int(armour.bulkheads)}</div>);
      effectiveArmourExplosiveTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.int(armour.bulkheads)}</div>);
      effectiveArmourKineticTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.int(armour.bulkheads)}</div>);
      effectiveArmourThermalTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.int(armour.bulkheads)}</div>);
      effectiveArmourCausticTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.int(armour.bulkheads)}</div>);
      if (armour.reinforcement > 0) {
        armourSourcesTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.int(armour.reinforcement)}</div>);
        effectiveArmourAbsoluteTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.int(armour.reinforcement)}</div>);
        effectiveArmourExplosiveTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.int(armour.reinforcement)}</div>);
        effectiveArmourKineticTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.int(armour.reinforcement)}</div>);
        effectiveArmourThermalTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.int(armour.reinforcement)}</div>);
        effectiveArmourCausticTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.int(armour.reinforcement)}</div>);
      }
    }

    const rawArmour = armour.bulkheads + armour.reinforcement;

    const armourDamageTakenTt = [];
    armourDamageTakenTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.pct1(armour.absolute.bulkheads)}</div>);
    armourDamageTakenTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.pct1(armour.absolute.reinforcement)}</div>);

    const armourDamageTakenExplosiveTt = [];
    armourDamageTakenExplosiveTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.pct1(armour.explosive.bulkheads)}</div>);
    armourDamageTakenExplosiveTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.pct1(armour.explosive.reinforcement)}</div>);
    if (armour.explosive.total != 1) effectiveArmourExplosiveTt.push(<div key='resistance'>{translate('resistance') + ' ' + formats.int(rawArmour / armour.explosive.total - rawArmour)}</div>);

    const armourDamageTakenKineticTt = [];
    armourDamageTakenKineticTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.pct1(armour.kinetic.bulkheads)}</div>);
    armourDamageTakenKineticTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.pct1(armour.kinetic.reinforcement)}</div>);
    if (armour.kinetic.total != 1) effectiveArmourKineticTt.push(<div key='resistance'>{translate('resistance') + ' ' + formats.int(rawArmour / armour.kinetic.total - rawArmour)}</div>);

    const armourDamageTakenThermalTt = [];
    armourDamageTakenThermalTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.pct1(armour.thermal.bulkheads)}</div>);
    armourDamageTakenThermalTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.pct1(armour.thermal.reinforcement)}</div>);
    if (armour.thermal.total != 1) effectiveArmourThermalTt.push(<div key='resistance'>{translate('resistance') + ' ' + formats.int(rawArmour / armour.thermal.total - rawArmour)}</div>);

    const armourDamageTakenCausticTt = [];
    armourDamageTakenCausticTt.push(<div key='bulkheads'>{translate('bulkheads') + ' ' + formats.pct1(armour.caustic.bulkheads)}</div>);
    armourDamageTakenCausticTt.push(<div key='reinforcement'>{translate('reinforcement') + ' ' + formats.pct1(armour.caustic.reinforcement)}</div>);
    if (armour.thermal.total != 1) effectiveArmourCausticTt.push(<div key='resistance'>{translate('resistance') + ' ' + formats.int(rawArmour / armour.caustic.total - rawArmour)}</div>);

    const effectiveArmourData = [];
    const effectiveAbsoluteArmour = armour.total / armour.absolute.total;
    effectiveArmourData.push({ value: Math.round(effectiveAbsoluteArmour), label: translate('absolute'), tooltip: effectiveArmourAbsoluteTt });
    const effectiveExplosiveArmour = armour.total / armour.explosive.total;
    effectiveArmourData.push({ value: Math.round(effectiveExplosiveArmour), label: translate('explosive'), tooltip: effectiveArmourExplosiveTt });
    const effectiveKineticArmour = armour.total / armour.kinetic.total;
    effectiveArmourData.push({ value: Math.round(effectiveKineticArmour), label: translate('kinetic'), tooltip: effectiveArmourKineticTt });
    const effectiveThermalArmour = armour.total / armour.thermal.total;
    effectiveArmourData.push({ value: Math.round(effectiveThermalArmour), label: translate('thermal'), tooltip: effectiveArmourThermalTt });
    const effectiveCausticArmour = armour.total / armour.caustic.total;
    effectiveArmourData.push({ value: Math.round(effectiveCausticArmour), label: translate('caustic'), tooltip: effectiveArmourCausticTt });

    const armourDamageTakenData = [];
    armourDamageTakenData.push({ value: Math.round(armour.absolute.total * 100), label: translate('absolute'), tooltip: armourDamageTakenTt });
    armourDamageTakenData.push({ value: Math.round(armour.explosive.total * 100), label: translate('explosive'), tooltip: armourDamageTakenExplosiveTt });
    armourDamageTakenData.push({ value: Math.round(armour.kinetic.total * 100), label: translate('kinetic'), tooltip: armourDamageTakenKineticTt });
    armourDamageTakenData.push({ value: Math.round(armour.thermal.total * 100), label: translate('thermal'), tooltip: armourDamageTakenThermalTt });
    armourDamageTakenData.push({ value: Math.round(armour.caustic.total * 100), label: translate('caustic'), tooltip: armourDamageTakenCausticTt });

    return (
      <span id='defence'>
        {shield.total ? <span>
          <div className='group quarter'>
            <h2>{translate('shield metrics')}</h2>
            <br/>
            <h2 onMouseOver={termtip.bind(null, <div>{shieldSourcesTt}</div>)} onMouseOut={tooltip.bind(null, null)} className='summary'>{translate('raw shield strength')}<br/>{formats.int(shield.total)}{units.MJ}</h2>
            <h2 onMouseOver={termtip.bind(null, translate('TT_TIME_TO_LOSE_SHIELDS'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_LOSE_SHIELDS')}<br/>{shielddamage.totalsdps == 0 ? translate('ever') : formats.time(Calc.timeToDeplete(shield.total, shielddamage.totalsdps, shielddamage.totalseps, pd.getWeaponsCapacity(), pd.getWeaponsRechargeRate() * opponentWep / 4))}</h2>
            <h2 onMouseOver={termtip.bind(null, translate('PHRASE_SG_RECOVER'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_RECOVER_SHIELDS')}<br/>{shield.recover === Math.Inf ? translate('never') : formats.time(shield.recover)}</h2>
            <h2 onMouseOver={termtip.bind(null, translate('PHRASE_SG_RECHARGE'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_RECHARGE_SHIELDS')}<br/>{shield.recharge === Math.Inf ? translate('never') : formats.time(shield.recharge)}</h2>
          </div>
          <div className='group quarter'>
            <h2 onMouseOver={termtip.bind(null, translate('PHRASE_SHIELD_SOURCES'))} onMouseOut={tooltip.bind(null, null)}>{translate('shield sources')}</h2>
            <PieChart data={shieldSourcesData} />
          </div>
          <div className='group quarter'>
            <h2 onMouseOver={termtip.bind(null, translate('PHRASE_DAMAGE_TAKEN'))} onMouseOut={tooltip.bind(null, null)}>{translate('damage taken')}(%)</h2>
            <VerticalBarChart data={shieldDamageTakenData} yMax={140} />
          </div>
          <div className='group quarter'>
            <h2 onMouseOver={termtip.bind(null, translate('PHRASE_EFFECTIVE_SHIELD'))} onMouseOut={tooltip.bind(null, null)}>{translate('effective shield')}(MJ)</h2>
            <VerticalBarChart data={effectiveShieldData} yMax={maxEffectiveShield}/>
          </div>
        </span> : null }

        <div className='group quarter'>
          <h2>{translate('armour metrics')}</h2>
          <h2 onMouseOver={termtip.bind(null, <div>{armourSourcesTt}</div>)} onMouseOut={tooltip.bind(null, null)} className='summary'>{translate('raw armour strength')}<br/>{formats.int(armour.total)}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_TIME_TO_LOSE_ARMOUR'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_LOSE_ARMOUR')}<br/>{armourdamage.totalsdps == 0 ? translate('ever') : formats.time(Calc.timeToDeplete(armour.total, armourdamage.totalsdps, armourdamage.totalseps, pd.getWeaponsCapacity(), pd.getWeaponsRechargeRate() * opponentWep / 4))}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_MODULE_ARMOUR'))} onMouseOut={tooltip.bind(null, null)}>{translate('raw module armour')}<br/>{formats.int(armour.modulearmour)}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_MODULE_PROTECTION_EXTERNAL'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_MODULE_PROTECTION_EXTERNAL')}<br/>{formats.pct1(armour.moduleprotection / 2)}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_MODULE_PROTECTION_INTERNAL'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_MODULE_PROTECTION_INTERNAL')}<br/>{formats.pct1(armour.moduleprotection)}</h2>
          <br/>
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_ARMOUR_SOURCES'))} onMouseOut={tooltip.bind(null, null)}>{translate('armour sources')}</h2>
          <PieChart data={armourSourcesData} />
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_DAMAGE_TAKEN'))} onMouseOut={tooltip.bind(null, null)}>{translate('damage taken')}(%)</h2>
          <VerticalBarChart data={armourDamageTakenData} yMax={100} />
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_EFFECTIVE_ARMOUR'))} onMouseOut={tooltip.bind(null, null)}>{translate('effective armour')}</h2>
          <VerticalBarChart data={effectiveArmourData} />
        </div>
      </span>);
  }
}
