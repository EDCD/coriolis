import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import LineChart from '../components/LineChart';
import * as Calc from '../shipyard/Calculations';

/**
 * Engine profile for a given ship
 */
export default class EngineProfile extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired,
    cargo: PropTypes.number.isRequired,
    fuel: PropTypes.number.isRequired,
    eng: PropTypes.number.isRequired,
    boost: PropTypes.bool.isRequired,
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
      calcMaxSpeedFunc: this.calcMaxSpeed.bind(this, ship, this.props.eng, this.props.boost)
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
      this.setState({ calcMaxSpeedFunc: this.calcMaxSpeed.bind(this, nextProps.ship, nextProps.eng, nextProps.boost) });
    }
    return true;
  }

  /**
   * Calculate the top speed for this ship given thrusters, mass and pips to ENG
   * @param  {Object}  ship          The ship
   * @param  {Object}  eng           The number of pips to ENG
   * @param  {Object}  boost         If boost is enabled
   * @param  {Object}  mass          The mass at which to calculate the top speed
   * @return {number}                The maximum speed
   */
  calcMaxSpeed(ship, eng, boost, mass) {
    // Obtain the top speed
    return Calc.calcSpeed(mass, ship.speed, ship.standard[1].m, ship.pipSpeed, eng, ship.boost / ship.speed, boost);
  }

  /**
   * Render engine profile
   * @return {React.Component} contents
   */
  render() {
    const { language, onWindowResize, sizeRatio, tooltip, termtip } = this.context;
    const { formats, translate, units } = language;
    const { ship, cargo, eng, fuel, boost } = this.props;

    // Calculate bounds for our line chart
    const thrusters = ship.standard[1].m;
    const minMass = ship.calcLowestPossibleMass({ th: thrusters });
    const maxMass = thrusters.getMaxMass();
    const mass = ship.outfittedMass + fuel + cargo;
    const minSpeed = Calc.calcSpeed(maxMass, ship.speed, thrusters, ship.pipSpeed, 0, ship.boost / ship.speed, false);
    const maxSpeed = Calc.calcSpeed(minMass, ship.speed, thrusters, ship.pipSpeed, 4, ship.boost / ship.speed, true);
    // Add a mark at our current mass
    const mark = Math.min(mass, maxMass);

    const code = `${ship.toString()}:${cargo}:${fuel}:${eng}:${boost}`;

    // This graph can have a precipitous fall-off so we use lots of points to make it look a little smoother
    return (
      <LineChart
        xMin={minMass}
        xMax={maxMass}
        yMin={minSpeed}
        yMax={maxSpeed}
        xMark={mark}
        xLabel={translate('mass')}
        xUnit={translate('T')}
        yLabel={translate('maximum speed')}
        yUnit={translate('m/s')}
        func={this.state.calcMaxSpeedFunc}
        points={1000}
        code={code}
        aspect={0.7}
      />
    );
  }
}
