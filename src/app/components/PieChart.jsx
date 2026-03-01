import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ResponsiveWrapper from './ResponsiveWrapper';
import * as d3 from 'd3';

const CORIOLIS_COLOURS = ['#FF8C0D', '#1FB0FF', '#71A052', '#D5D54D'];
const LABEL_COLOUR = '#000000';

/**
 * A pie chart
 */
export default class PieChart extends Component {

  static propTypes = {
    data : PropTypes.array.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);

    this.pie = d3.pie().value((d) => d.value);
    this.colors = CORIOLIS_COLOURS;
    this.arc = d3.arc();
    this.arc.innerRadius(0);
  }


  /**
   * Generate a slice of the pie chart
   * @param {Object} d     the data for this slice
   * @param {number} i     the index of this slice
   * @param {number} width the current width of the parent container
   * @returns {Object}     the SVG for the slice
   */
  sliceGenerator(d, i, width) {
    if (!d || d.value == 0) {
      // Ignore 0 values
      return null;
    }

    const { data } = this.props;

    // Push the labels further out from the centre of the slice
    let [labelX, labelY] = this.arc.centroid(d);
    const labelTranslate = `translate(${labelX * 1.5}, ${labelY * 1.5})`;

    // Put the keys in a line with equal spacing
    const nonZeroItems = data.filter(d => d.value != 0).length;
    const thisItemIndex = data.slice(0, i + 1).filter(d => d.value != 0).length - 1;
    const keyX = -width / 2 + (width / nonZeroItems) * (thisItemIndex + 0.5);
    const keyTranslate = `translate(${keyX}, ${width * 0.45})`;

    return (
      <g key={`group-${i}`}>
        <path key={`arc-${i}`} d={this.arc(d)} style={{ fill: this.colors[i] }} />
        <text key={`label-${i}`} transform={labelTranslate} style={{ strokeWidth: '0px', fill: LABEL_COLOUR }} textAnchor='middle'>{d.value}</text>
        <text key={`key-${i}`} transform={keyTranslate} style={{ strokeWidth:'0px', fill: this.colors[i] }} textAnchor='middle'>{d.data.label}</text>
      </g>
    );
  }

  /**
   * Render the component
   * @returns {object} Markup
   */
  render() {
    return (
      <ResponsiveWrapper>
        { ({ width }) => {
          const chartHeight = width * 0.9; // Calculate height from width
          const pie = this.pie(this.props.data),
              translate = `translate(${width / 2}, ${width * 0.4})`;

          this.arc.outerRadius(width * 0.4);
          return (
            <div style={{ width: '100%', height: chartHeight }}>
              <svg style={{ stroke: 'None' }} width={width} height={chartHeight}>
                <g transform={translate}>
                  {pie.map((d, i) => this.sliceGenerator(d, i, width))}
                </g>
              </svg>
            </div>
          );
        }}
      </ResponsiveWrapper>
    );
  }
}
