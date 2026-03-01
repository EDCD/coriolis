import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import * as Calc from '../shipyard/Calculations';
import PieChart from './PieChart';
import { nameComparator } from '../utils/SlotFunctions';
import { MountFixed, MountGimballed, MountTurret } from './SvgIcons';

/**
 * Generates an internationalization friendly weapon comparator that will
 * sort by specified property (if provided) then by name/group, class, rating
 * @param  {function} translate       Translation function
 * @param  {function} propComparator  Optional property comparator
 * @param  {boolean} desc             Use descending order
 * @return {function}                 Comparator function for names
 */
export function weaponComparator(translate, propComparator, desc) {
  return (a, b) => {
    if (!desc) {  // Flip A and B if ascending order
      let t = a;
      a = b;
      b = t;
    }

    // If a property comparator is provided use it first
    let diff = propComparator ? propComparator(a, b) : nameComparator(translate, a, b);

    if (diff) {
      return diff;
    }

    // Property matches so sort by name / group, then class, rating
    if (a.name === b.name && a.grp === b.grp) {
      if(a.class == b.class) {
        return a.rating > b.rating ? 1 : -1;
      }
      return a.class - b.class;
    }

    return nameComparator(translate, a, b);
  };
}

/**
 * Creates a tooltip that shows damage by type.
 * @param {function} translate    Translation function
 * @param {Object} formats        Object that holds format functions
 * @param {Calc.SDps} sdpsObject  Object that holds sdps split up by type
 * @returns {Array} Tooltip
 */
function getSDpsTooltip(translate, formats, sdpsObject) {
  return Object.keys(sdpsObject).filter(key => sdpsObject[key])
    .map(key => {
      return (
        <div key={key}>
          {translate(key) + ' ' + formats.f1(sdpsObject[key])}
        </div>
      );
    });
}

/**
 * Returns a data object used by {@link PieChart} that shows damage by type.
 * @param {function} translate    Translation function
 * @param {Calc.SDps} sdpsObject  Object that holds sdps split up by type
 * @returns {Object}              Data object
 */
function getSDpsData(translate, sdpsObject) {
  return Object.keys(sdpsObject).map(key => {
    return {
      value: Math.round(sdpsObject[key]),
      label: translate(key)
    };
  });
}

/**
 * Adds all damage of `add` onto `addOn`.
 * @param {Calc.SDps} addOn Object that holds sdps split up by type (will be mutated)
 * @param {Calc.SDps} add   Object that holds sdps split up by type
 */
function addSDps(addOn, add) {
  Object.keys(addOn).map(k => addOn[k] += (add[k] ? add[k] : 0));
}

/**
 * Calculates the overall sdps of an sdps object.
 * @param {Calc.SDps} sdpsObject Object that holds sdps spluit up by type
 */
function sumSDps(sdpsObject) {
  if (sdpsObject.total) {
    return sdpsObject.total;
  }

  return Object.keys(sdpsObject).reduce(
    (acc, k) => acc + (sdpsObject[k] ? sdpsObject[k] : 0),
    0
  );
}

/**
 * Offence information
 * Offence information consists of four panels:
 *   - textual information (time to drain cap, time to take down shields etc.)
 *   - breakdown of damage sources (pie chart)
 *   - comparison of shield resistances (table chart)
 *   - effective sustained DPS of weapons (bar chart)
 */
export default class Offence extends TranslatedComponent {
  static propTypes = {
    marker: PropTypes.string.isRequired,
    ship: PropTypes.object.isRequired,
    opponent: PropTypes.object.isRequired,
    engagementrange: PropTypes.number.isRequired,
    wep: PropTypes.number.isRequired,
    opponentSys: PropTypes.number.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);

    this._sort = this._sort.bind(this);

    const damage = Calc.offenceMetrics(props.ship, props.opponent, props.wep, props.opponentSys, props.engagementrange);
    this.state = {
      predicate: 'n',
      desc: true,
      damage
    };
  }

  /**
   * Update the state if our properties change
   * @param  {Object} nextProps   Incoming/Next properties
   * @return {boolean}            Returns true if the component should be rerendered
   */
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.marker != nextProps.marker || this.props.eng != nextProps.eng) {
      const damage = Calc.offenceMetrics(nextProps.ship, nextProps.opponent, nextProps.wep, nextProps.opponentSys, nextProps.engagementrange);
      this.setState({ damage });
    }
    return true;
  }

  /**
   * Set the sort order and sort
   * @param  {string} predicate Sort predicate
   */
  _sortOrder(predicate) {
    let desc = this.state.desc;

    if (predicate == this.state.predicate) {
      desc = !desc;
    } else {
      desc = true;
    }

    this._sort(predicate, desc);
    this.setState({ predicate, desc });
  }

  /**
   * Sorts the weapon list
   * @param  {string} predicate   Sort predicate
   * @param  {Boolean} desc       Sort order descending
   */
  _sort(predicate, desc) {
    let comp = weaponComparator.bind(null, this.context.language.translate);

    switch (predicate) {
      case 'n': comp = comp(null, desc); break;
      case 'esdpss': comp = comp((a, b) => a.sdps.shields.total - b.sdps.shields.total, desc); break;
      case 'es': comp = comp((a, b) => a.effectiveness.shields.total - b.effectiveness.shields.total, desc); break;
      case 'esdpsh': comp = comp((a, b) => a.sdps.armour.total - b.sdps.armour.total, desc); break;
      case 'eh': comp = comp((a, b) => a.effectiveness.armour.total - b.effectiveness.armour.total, desc); break;
    }

    this.state.damage.sort(comp);
  }

  /**
   * Render offence
   * @return {React.Component} contents
   */
  render() {
    const { ship, opponent, wep, engagementrange } = this.props;
    const { language, tooltip, termtip } = this.context;
    const { formats, translate, units } = language;
    const { damage } = this.state;
    const sortOrder = this._sortOrder;

    const pd = ship.standard[4].m;

    const opponentShields = Calc.shieldMetrics(opponent, 4);
    const opponentArmour = Calc.armourMetrics(opponent);

    const timeToDrain = Calc.timeToDrainWep(ship, wep);


    let totalSEps = 0;
    let totalSDpsObject = { 'absolute': 0, 'explosive': 0, 'kinetic': 0, 'thermal': 0 };
    let shieldsSDpsObject = { 'absolute': 0, 'explosive': 0, 'kinetic': 0, 'thermal': 0 };
    let armourSDpsObject = { 'absolute': 0, 'explosive': 0, 'kinetic': 0, 'thermal': 0 };

    const rows = [];
    for (let i = 0; i < damage.length; i++) {
      const weapon = damage[i];

      totalSEps += weapon.seps;
      addSDps(totalSDpsObject, weapon.sdps.base);
      addSDps(shieldsSDpsObject, weapon.sdps.shields);
      addSDps(armourSDpsObject, weapon.sdps.armour);

      const baseSDpsTooltipDetails = getSDpsTooltip(translate, formats, weapon.sdps.base);

      const effectivenessShieldsTooltipDetails = [];
      effectivenessShieldsTooltipDetails.push(<div key='range'>{translate('range') + ' ' + formats.pct1(weapon.effectiveness.shields.range)}</div>);
      effectivenessShieldsTooltipDetails.push(<div key='resistance'>{translate('resistance') + ' ' + formats.pct1(weapon.effectiveness.shields.resistance)}</div>);
      effectivenessShieldsTooltipDetails.push(<div key='power distributor'>{translate('power distributor') + ' ' + formats.pct1(weapon.effectiveness.shields.sys)}</div>);

      const effectiveShieldsSDpsTooltipDetails = getSDpsTooltip(translate, formats, weapon.sdps.armour);

      const effectivenessArmourTooltipDetails = [];
      effectivenessArmourTooltipDetails.push(<div key='range'>{translate('range') + ' ' + formats.pct1(weapon.effectiveness.armour.range)}</div>);
      effectivenessArmourTooltipDetails.push(<div key='resistance'>{translate('resistance') + ' ' + formats.pct1(weapon.effectiveness.armour.resistance)}</div>);
      effectivenessArmourTooltipDetails.push(<div key='hardness'>{translate('hardness') + ' ' + formats.pct1(weapon.effectiveness.armour.hardness)}</div>);

      const effectiveArmourSDpsTooltipDetails = getSDpsTooltip(translate, formats, weapon.sdps.armour);

      rows.push(
        <tr key={weapon.id}>
          <td className='ri'>
            {weapon.mount == 'F' ? <span onMouseOver={termtip.bind(null, 'fixed')} onMouseOut={tooltip.bind(null, null)}><MountFixed className='icon'/></span> : null}
            {weapon.mount == 'G' ? <span onMouseOver={termtip.bind(null, 'gimballed')} onMouseOut={tooltip.bind(null, null)}><MountGimballed /></span> : null}
            {weapon.mount == 'T' ? <span onMouseOver={termtip.bind(null, 'turreted')} onMouseOut={tooltip.bind(null, null)}><MountTurret /></span> : null}
            {weapon.classRating} {translate(weapon.name)}
            {weapon.engineering ? ' (' + weapon.engineering + ')' : null }
          </td>
          <td className='ri'><span onMouseOver={termtip.bind(null, baseSDpsTooltipDetails)} onMouseOut={tooltip.bind(null, null)}>{formats.f1(weapon.sdps.base.total)}</span></td>
          <td className='ri'><span onMouseOver={termtip.bind(null, effectiveShieldsSDpsTooltipDetails)} onMouseOut={tooltip.bind(null, null)}>{formats.f1(weapon.sdps.shields.total)}</span></td>
          <td className='ri'><span onMouseOver={termtip.bind(null, effectivenessShieldsTooltipDetails)} onMouseOut={tooltip.bind(null, null)}>{formats.pct1(weapon.effectiveness.shields.total)}</span></td>

          <td className='ri'><span>{formats.f1(weapon.effectiveness.shields.dpe)}</span></td>

          <td className='ri'><span onMouseOver={termtip.bind(null, effectiveArmourSDpsTooltipDetails)} onMouseOut={tooltip.bind(null, null)}>{formats.f1(weapon.sdps.armour.total)}</span></td>
          <td className='ri'><span onMouseOver={termtip.bind(null, effectivenessArmourTooltipDetails)} onMouseOut={tooltip.bind(null, null)}>{formats.pct1(weapon.effectiveness.armour.total)}</span></td>

          <td className='ri'><span>{formats.f1(weapon.effectiveness.armour.dpe)}</span></td>
        </tr>);
    }

    const totalSDps = sumSDps(totalSDpsObject);
    const totalSDpsTooltipDetails = getSDpsTooltip(translate, formats, totalSDpsObject);
    const totalSDpsData = getSDpsData(translate, totalSDpsObject);

    const totalShieldsSDps = sumSDps(shieldsSDpsObject);
    const totalShieldsSDpsTooltipDetails = getSDpsTooltip(translate, formats, shieldsSDpsObject);
    const shieldsSDpsData = getSDpsData(translate, shieldsSDpsObject);

    const totalArmourSDps = sumSDps(armourSDpsObject);
    const totalArmourSDpsTooltipDetails = getSDpsTooltip(translate, formats, armourSDpsObject);
    const armourSDpsData = getSDpsData(translate, armourSDpsObject);

    const timeToDepleteShields = Calc.timeToDeplete(opponentShields.total, totalShieldsSDps, totalSEps, pd.getWeaponsCapacity(), pd.getWeaponsRechargeRate() * (wep / 4));
    const timeToDepleteArmour = Calc.timeToDeplete(opponentArmour.total, totalArmourSDps, totalSEps, pd.getWeaponsCapacity(), pd.getWeaponsRechargeRate() * (wep / 4));

    return (
      <span id='offence'>
        <div className='group full'>
          <table>
            <thead>
              <tr className='main'>
                <th rowSpan='2' className='sortable' onClick={sortOrder.bind(this, 'n')}>{translate('weapon')}</th>
                <th colSpan='1'>{translate('overall')}</th>
                <th colSpan='3'>{translate('opponent\'s shields')}</th>
                <th colSpan='3'>{translate('opponent\'s armour')}</th>
              </tr>
              <tr>
                <th className='lft sortable' onMouseOver={termtip.bind(null, 'TT_EFFECTIVE_SDPS_SHIELDS')} onMouseOut={tooltip.bind(null, null)} onClick={sortOrder.bind(this, 'esdpss')}>{'sdps'}</th>
                <th className='lft sortable' onMouseOver={termtip.bind(null, 'TT_EFFECTIVE_SDPS_SHIELDS')} onMouseOut={tooltip.bind(null, null)} onClick={sortOrder.bind(this, 'esdpss')}>{'sdps'}</th>
                <th className='sortable' onMouseOver={termtip.bind(null, 'TT_EFFECTIVENESS_SHIELDS')} onMouseOut={tooltip.bind(null, null)}onClick={sortOrder.bind(this, 'es')}>{'eft'}</th>

                <th className='sortable'>{'dpe'}</th>

                <th className='lft sortable' onMouseOver={termtip.bind(null, 'TT_EFFECTIVE_SDPS_ARMOUR')} onMouseOut={tooltip.bind(null, null)}onClick={sortOrder.bind(this, 'esdpsh')}>{'sdps'}</th>
                <th className='sortable' onMouseOver={termtip.bind(null, 'TT_EFFECTIVENESS_ARMOUR')} onMouseOut={tooltip.bind(null, null)}onClick={sortOrder.bind(this, 'eh')}>{'eft'}</th>

                <th className='sortable'>{'dpe'}</th> 
              </tr>
            </thead>
            <tbody>
              {rows}
              {rows.length > 0 &&
                <tr>
                  <td></td>
                  <td className='ri'><span onMouseOver={termtip.bind(null, totalSDpsTooltipDetails)} onMouseOut={tooltip.bind(null, null)}>={formats.f1(totalSDps)}</span></td>
                  <td className='ri'><span onMouseOver={termtip.bind(null, totalShieldsSDpsTooltipDetails)} onMouseOut={tooltip.bind(null, null)}>={formats.f1(totalShieldsSDps)}</span></td>
                  <td></td>
                  <td></td>
                  <td className='ri'><span onMouseOver={termtip.bind(null, totalArmourSDpsTooltipDetails)} onMouseOut={tooltip.bind(null, null)}>={formats.f1(totalArmourSDps)}</span></td>
                  <td></td>
                  <td></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div className='group quarter'>
          <h2>{translate('offence metrics')}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_TIME_TO_DRAIN_WEP'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_DRAIN_WEP')}<br/>{timeToDrain === Infinity ? translate('never') : formats.time(timeToDrain)}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_EFFECTIVE_SDPS_SHIELDS'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_EFFECTIVE_SDPS_SHIELDS')}<br/>{formats.f1(totalShieldsSDps)}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_TIME_TO_REMOVE_SHIELDS'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_REMOVE_SHIELDS')}<br/>{timeToDepleteShields === Infinity ? translate('never') : formats.time(timeToDepleteShields)}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_EFFECTIVE_SDPS_ARMOUR'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_EFFECTIVE_SDPS_ARMOUR')}<br/>{formats.f1(totalArmourSDps)}</h2>
          <h2 onMouseOver={termtip.bind(null, translate('TT_TIME_TO_REMOVE_ARMOUR'))} onMouseOut={tooltip.bind(null, null)}>{translate('PHRASE_TIME_TO_REMOVE_ARMOUR')}<br/>{timeToDepleteArmour === Infinity ? translate('never') : formats.time(timeToDepleteArmour)}</h2>
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_OVERALL_DAMAGE'))} onMouseOut={tooltip.bind(null, null)}>{translate('overall damage')}</h2>
          <PieChart data={totalSDpsData} />
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_SHIELD_DAMAGE'))} onMouseOut={tooltip.bind(null, null)}>{translate('shield damage sources')}</h2>
          <PieChart data={shieldsSDpsData} />
        </div>
        <div className='group quarter'>
          <h2 onMouseOver={termtip.bind(null, translate('PHRASE_ARMOUR_DAMAGE'))} onMouseOut={tooltip.bind(null, null)}>{translate('armour damage sources')}</h2>
          <PieChart data={armourSDpsData} />
        </div>
      </span>);
  }
}
