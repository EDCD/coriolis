import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import LineChart from '../components/LineChart';
import * as Calc from '../shipyard/Calculations';

/**
 * FSD profile for a given ship
 */
export default class FSDProfile extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired,
    cargo: PropTypes.number.isRequired,
    fuel: PropTypes.number.isRequired,
    marker: PropTypes.string.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context   React Component context
   */
  constructor(props, context) {
    super(props);

    const ship = this.props.ship;

    this.state = {
      calcMaxRangeFunc: this._calcMaxRange.bind(this, ship, this.props.fuel)
    };
  }

  /**
   * Update the state if our ship changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next conext
   * @return {boolean}            Returns true if the component should be rerendered
   */
  componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.marker != this.props.marker) {
      this.setState({ calcMaxRangeFunc: this._calcMaxRange.bind(this, nextProps.ship, nextProps.fuel) });
    }
    return true;
  }

  /**
   * Calculate the maximum range for this ship across its applicable mass
   * @param  {Object}  ship          The ship
   * @param  {Object}  fuel          The fuel on the ship
   * @param  {Object}  mass          The mass at which to calculate the maximum range
   * @return {number}                The maximum range
   */
  _calcMaxRange(ship, fuel, mass) {
    // Obtain the maximum range
    return Calc.jumpRange(mass, ship.standard[2].m, Math.min(fuel, ship.standard[2].m.getMaxFuelPerJump()), ship);
  }

  /**
   * Render FSD profile
   * @return {React.Component} contents
   */
  render() {
    const { language, onWindowResize, sizeRatio, tooltip, termtip } = this.context;
    const { formats, translate, units } = language;
    const { ship, cargo, fuel } = this.props;


    // Calculate bounds for our line chart - use thruster info for X
    const thrusters = ship.standard[1].m;
    const fsd = ship.standard[2].m;
    const minMass = ship.calcLowestPossibleMass({ th: thrusters });
    const maxMass = thrusters.getMaxMass();
    const mass = ship.outfittedMass + fuel + cargo;
    const minRange = 0;
    const maxRange = Calc.jumpRange(minMass + fsd.getMaxFuelPerJump(), fsd, fsd.getMaxFuelPerJump(), ship);
    // Add a mark at our current mass
    const mark = Math.min(mass, maxMass);

    const code = ship.name + ship.toString() + '.' + fuel;

    return (
      <LineChart
        xMin={minMass}
        xMax={maxMass}
        yMin={minRange}
        yMax={maxRange}
        xMark={mark}
        xLabel={translate('mass')}
        xUnit={translate('T')}
        yLabel={translate('maximum range')}
        yUnit={translate('LY')}
        func={this.state.calcMaxRangeFunc}
        points={200}
        code={code}
        aspect={0.7}
      />
    );
  }
}
