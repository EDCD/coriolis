import TranslatedComponent from './TranslatedComponent';
import React from 'react';
import PropTypes from 'prop-types';
import ContainerDimensions from 'react-container-dimensions';
import { BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';

const CORIOLIS_COLOURS = ['#FF8C0D', '#1FB0FF', '#71A052', '#D5D54D'];
const LABEL_COLOUR = '#000000';
const AXIS_COLOUR = '#C06400';

const ASPECT = 1;

const merge = function(one, two) {
  return Object.assign({}, one, two);
};

/**
 * A vertical bar chart
 */
export default class VerticalBarChart extends TranslatedComponent {
  static propTypes = {
    data : PropTypes.array.isRequired,
    yMax : PropTypes.number
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);

    this._termtip = this._termtip.bind(this);
  }

  /**
   * Render the bar chart
   * @returns {Object} the markup
   */
  render() {
    const { tooltip, termtip } = this.context;

    // Calculate maximum for Y
    let dataMax = Math.max(...this.props.data.map(d => d.value));
    if (dataMax == -Infinity) dataMax = 0;
    let yMax = this.props.yMax ? Math.round(this.props.yMax) : 0;
    const localMax = Math.max(dataMax, yMax);

    return (
      <ContainerDimensions>
        { ({ width }) => (
          <div width='100%'>
            <BarChart width={width} height={width * ASPECT} data={this.props.data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis interval={0} fontSize='0.8em' stroke={AXIS_COLOUR} dataKey='label' />
              <YAxis interval={'preserveStart'} tickCount={11} fontSize='0.8em' stroke={AXIS_COLOUR} type='number' domain={[0, localMax]}/>
              <Bar dataKey='value' fill={CORIOLIS_COLOURS[0]} isAnimationActive={false} onMouseOver={this._termtip} onMouseOut={tooltip.bind(null, null)}>
                <LabelList dataKey='value' position='insideTop'/>
              </Bar>
            </BarChart>
          </div>
        )}
      </ContainerDimensions>
    );
  }

  /**
   * Generate a term tip
   * @param {Object} d the data
   * @param {number} i the index
   * @param {Object} e the event
   * @returns {Object} termtip markup
   */
  _termtip(d, i, e) {
    if (this.props.data[i].tooltip) {
      return this.context.termtip(this.props.data[i].tooltip, e);
    } else {
      return null;
    }
  }
}
