import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import LineChart from '../components/LineChart';
import Slider from '../components/Slider';
import * as Calc from '../shipyard/Calculations';

/**
 * Jump range for a given ship
 */
export default class JumpRange extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired,
    code: PropTypes.string.isRequired
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
      fuelLevel: 1,
      calcJumpRangeFunc: this._calcJumpRange.bind(this, ship)
    };
  }

  /**
   * Update the state if our ship changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next conext
   * @return {boolean}            Returns true if the component should be rerendered
   */
  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    if (nextProps.code != this.props.code) {
      this.setState({ fuelLevel: 1,
        calcJumpRangeFunc: this._calcJumpRange.bind(this, nextProps.ship) });
    }
    return true;
  }

  /**
   * Calculate the jump range this ship at a given cargo
   * @param  {Object}  ship          The ship
   * @param  {Object}  cargo         The cargo
   * @return {number}                The jump range
   */
  _calcJumpRange(ship, cargo) {
    // Obtain the FSD for this ship
    const fsd = ship.standard[2].m;

    const fuel = this.state.fuelLevel * ship.fuelCapacity;

    // Obtain the jump range
    return Calc.jumpRange(ship.unladenMass + cargo, fsd, fuel, ship);
  }

  /**
   * Update fuel level
   * @param  {number} fuelLevel Fuel level 0 - 1
   */
  _fuelChange(fuelLevel) {
    this.setState({
      fuelLevel,
    });
  }

  /**
   * Render engine profile
   * @return {React.Component} contents
   */
  render() {
    const { language, onWindowResize, sizeRatio, tooltip, termtip } = this.context;
    const { formats, translate, units } = language;
    const { ship } = this.props;
    const { fuelLevel } = this.state;

    const code = ship.toString() + '.' + ship.getModificationsString() + '.' + fuelLevel;

    return (
      <span>
        <h1>{translate('jump range')}</h1>
        <LineChart
          xMax={ship.cargoCapacity}
          yMax={ship.unladenRange}
          xLabel={translate('cargo')}
          xUnit={translate('T')}
          yLabel={translate('jump range')}
          yUnit={translate('LY')}
          func={this.state.calcJumpRangeFunc}
          points={200}
          code={code}
        />
        <h3>{translate('fuel carried')}: {formats.f2(fuelLevel * ship.fuelCapacity)}{units.T}</h3>
        <table style={{ width: '100%', lineHeight: '1em', backgroundColor: 'transparent' }}>
          <tbody >
            <tr>
              <td>
                <Slider
                  axis={true}
                  onChange={this._fuelChange.bind(this)}
                  axisUnit={translate('T')}
                  percent={fuelLevel}
                  max={ship.fuelCapacity}
                  scale={sizeRatio}
                  onResize={onWindowResize}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </span>
    );
  }
}
