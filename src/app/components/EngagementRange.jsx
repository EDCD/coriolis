import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import { Ships } from 'coriolis-data/dist';
import Slider from '../components/Slider';

/**
 * Engagement range slider
 * Requires an onChange() function of the form onChange(range), providing the range in metres, which is triggered on range change
 */
export default class EngagementRange extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired,
    engagementRange: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context   React Component context
   */
  constructor(props, context) {
    super(props);
    this._rangeChange = this._rangeChange.bind(this);

    const { ship } = props;
    const maxRange = this._calcMaxRange(ship);

    this.state = {
      maxRange
    };
  }

  componentWillReceiveProps(nextProps) {
    const { ship } = nextProps;
    const maxRange = this._calcMaxRange(ship);

    this.setState({
      maxRange
    });
  }

  /**
   * Calculate the maximum range of a ship's weapons
   * @param   {Object}  ship     The ship
   * @returns {int}              The maximum range, in metres
   */
  _calcMaxRange(ship) {
    return ship.hardpoints.reduce((maxRange, hardpoint) => {
      if(hardpoint.maxClass > 0 && hardpoint.m && hardpoint.enabled) {
        const hardpointRange = hardpoint.m.getRange();
        return (hardpointRange > maxRange) ? hardpointRange : maxRange;
      }
      return maxRange;
    }, 1000);
  }

  /**
   * Update range
   * @param  {number} rangeLevel percentage level from 0 to 1
   */
  _rangeChange(rangeLevel) {
    const { maxRange } = this.state;

    // We round the range to an integer value
    const range = Math.round(rangeLevel * maxRange);

    if (range !== this.props.engagementRange) {
      this.props.onChange(range);
    }
  }

  /**
   * Render range slider
   * @return {React.Component} contents
   */
  render() {
    const { language, onWindowResize, sizeRatio, tooltip, termtip } = this.context;
    const { formats, translate, units } = language;
    const { engagementRange } = this.props;
    const { maxRange } = this.state;

    return (
      <span>
        <h3>{translate('engagement range')}: {formats.int(engagementRange)}{translate('m')}</h3>
        <table style={{ width: '100%', lineHeight: '1em', backgroundColor: 'transparent' }}>
          <tbody >
            <tr>
              <td>
                <Slider
                  axis={true}
                  onChange={this._rangeChange}
                  axisUnit={translate('m')}
                  percent={engagementRange / maxRange}
                  max={maxRange}
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
