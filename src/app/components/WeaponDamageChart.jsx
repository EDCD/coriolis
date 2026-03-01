import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import LineChart from '../components/LineChart';
import * as Calc from '../shipyard/Calculations';

const DAMAGE_DEALT_COLORS = ['#FFFFFF', '#FF0000', '#00FF00', '#7777FF', '#FFFF00', '#FF00FF', '#00FFFF', '#777777'];

/**
 * Weapon damage chart
 */
export default class WeaponDamageChart extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired,
    opponent: PropTypes.object.isRequired,
    hull: PropTypes.bool.isRequired,
    engagementRange: PropTypes.number.isRequired,
    opponentSys: PropTypes.number.isRequired,
    marker: PropTypes.string.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context   React Component context
   */
  constructor(props, context) {
    super(props);
  }

  /**
   * Set the initial weapons state
   */
  UNSAFE_componentWillMount() {
    const weaponNames = this._weaponNames(this.props.ship, this.context);
    const opponentShields = Calc.shieldMetrics(this.props.opponent, this.props.opponentSys);
    const opponentArmour = Calc.armourMetrics(this.props.opponent);
    const maxRange = this._calcMaxRange(this.props.ship);
    const maxDps = this._calcMaxSDps(this.props.ship, this.props.opponent, opponentShields, opponentArmour);

    this.setState({ maxRange, maxDps, weaponNames, opponentShields, opponentArmour, calcSDpsFunc: this._calcSDps.bind(this, this.props.ship, weaponNames, this.props.opponent, opponentShields, opponentArmour, this.props.hull) });
  }

  /**
   * Set the updated weapons state if our ship changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next conext
   * @return {boolean}            Returns true if the component should be rerendered
   */
  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.marker != this.props.marker) {
      const weaponNames = this._weaponNames(nextProps.ship, nextContext);
      const opponentShields = Calc.shieldMetrics(nextProps.opponent, nextProps.opponentSys);
      const opponentArmour = Calc.armourMetrics(nextProps.opponent);
      const maxRange = this._calcMaxRange(nextProps.ship);
      const maxDps = this._calcMaxSDps(nextProps.ship, nextProps.opponent, opponentShields, opponentArmour);
      this.setState({ weaponNames,
        opponentShields,
        opponentArmour,
        maxRange,
        maxDps,
        calcSDpsFunc: this._calcSDps.bind(this, nextProps.ship, weaponNames, nextProps.opponent, opponentShields, opponentArmour, nextProps.hull)
      });
    }
    return true;
  }

  /**
   * Calculate the maximum range of a ship's weapons
   * @param   {Object}  ship     The ship
   * @returns {int}              The maximum range, in metres
   */
  _calcMaxRange(ship) {
    let maxRange = 1000; // Minimum
    for (let i = 0; i < ship.hardpoints.length; i++) {
      if (ship.hardpoints[i].maxClass > 0 && ship.hardpoints[i].m && ship.hardpoints[i].enabled) {
        const thisRange = ship.hardpoints[i].m.getRange();
        if (thisRange > maxRange) {
          maxRange = thisRange;
        }
      }
    }

    return maxRange;
  }

  /**
   * Calculate the maximum sustained single-weapon DPS for this ship
   * @param  {Object}  ship             The ship
   * @param  {Object}  opponent         The opponent ship
   * @param  {Object}  opponentShields  The opponent's shields
   * @param  {Object}  opponentArmour   The opponent's armour
   * @return {number}                   The maximum sustained single-weapon DPS
   */
  _calcMaxSDps(ship, opponent, opponentShields, opponentArmour) {
    // Additional information to allow effectiveness calculations
    let maxSDps = 0;
    for (let i = 0; i < ship.hardpoints.length; i++) {
      if (ship.hardpoints[i].maxClass > 0 && ship.hardpoints[i].m && ship.hardpoints[i].enabled) {
        const m = ship.hardpoints[i].m;

        const sustainedDps = Calc._weaponSustainedDps(m, opponent, opponentShields, opponentArmour, 0);
        const thisSDps = sustainedDps.damage.armour.total > sustainedDps.damage.shields.total ? sustainedDps.damage.armour.total : sustainedDps.damage.shields.total;
        if (thisSDps > maxSDps) {
          maxSDps = thisSDps;
        }
      }
    }
    return maxSDps;
  }

  /**
   * Obtain the weapon names for this ship
   * @param  {Object}  ship      The ship
   * @param  {Object}  context   The context
   * @return {array}             The weapon names
   */
  _weaponNames(ship, context) {
    const translate = context.language.translate;
    let names = [];
    let num = 1;
    for (let i = 0; i < ship.hardpoints.length; i++) {
      if (ship.hardpoints[i].maxClass > 0 && ship.hardpoints[i].m && ship.hardpoints[i].enabled) {
        const m = ship.hardpoints[i].m;
        let name = '' + num++ + ': ' + m.class + m.rating + (m.missile ? '/' + m.missile : '') + ' ' + translate(m.name || m.grp);
        let engineering;
        if (m.blueprint && m.blueprint.name) {
          engineering = translate(m.blueprint.name) + ' ' + translate('grade') + ' ' + m.blueprint.grade;
          if (m.blueprint.special && m.blueprint.special.id) {
            engineering += ', ' + translate(m.blueprint.special.name);
          }
        }
        if (engineering) {
          name = name + ' (' + engineering + ')';
        }
        names.push(name);
      }
    }
    return names;
  }

  /**
   * Calculate the per-weapon sustained DPS for this ship against another ship at a given range
   * @param  {Object}  ship            The ship
   * @param  {Object}  weaponNames     The names of the weapons for which to calculate DPS
   * @param  {Object}  opponent        The target
   * @param  {Object}  opponentShields The opponent's shields
   * @param  {Object}  opponentArmour  The opponent's armour
   * @param  {bool}    hull            true if to calculate against hull, false if to calculate against shields
   * @param  {Object}  engagementRange The engagement range
   * @return {array}                   The array of weapon DPS
   */
  _calcSDps(ship, weaponNames, opponent, opponentShields, opponentArmour, hull, engagementRange) {
    let results = {};
    let weaponNum = 0;
    for (let i = 0; i < ship.hardpoints.length; i++) {
      if (ship.hardpoints[i].maxClass > 0 && ship.hardpoints[i].m && ship.hardpoints[i].enabled) {
        const m = ship.hardpoints[i].m;
        const sustainedDps = Calc._weaponSustainedDps(m, opponent, opponentShields, opponentArmour, engagementRange);
        results[weaponNames[weaponNum++]] = hull ? sustainedDps.damage.armour.total : sustainedDps.damage.shields.total;
      }
    }
    return results;
  }

  /**
   * Render damage dealt
   * @return {React.Component} contents
   */
  render() {
    const { language, onWindowResize, sizeRatio, tooltip, termtip } = this.context;
    const { formats, translate, units } = language;
    const { maxRange } = this.state;
    const { ship, opponent, engagementRange } = this.props;

    const sortOrder = this._sortOrder;
    const onCollapseExpand = this._onCollapseExpand;

    const code = `${ship.toString()}:${opponent.toString()}`;

    return (
      <div>
        <LineChart
          xMax={maxRange}
          yMax={this.state.maxDps}
          xLabel={translate('range')}
          xUnit={translate('m')}
          yLabel={translate('sdps')}
          series={this.state.weaponNames}
          xMark={this.props.engagementRange}
          colors={DAMAGE_DEALT_COLORS}
          func={this.state.calcSDpsFunc}
          points={200}
          code={code}
        />
      </div>
    );
  }
}
