import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import TranslatedComponent from './TranslatedComponent';

const MARGIN = { top: 15, right: 20, bottom: 40, left: 150 };
const BAR_HEIGHT = 30;

/**
 * Get ship and build name
 * @param  {Object} build Ship build
 * @return {string}       name and build name
 */
function bName(build) {
  return build.buildName + '\n' + build.name;
}

/**
 * Replace a SVG text element's content with
 * tspans that wrap on newline
 * @param  {string} d Data point
 */
function insertLinebreaks(d) {
  let el = d3.select(this);
  let lines = d.split('\n');
  el.text('').attr('y', -6);
  for (let i = 0; i < lines.length; i++) {
    let tspan = el.append('tspan').text(lines[i].length > 18 ? lines[i].substring(0, 15) + '...' : lines[i]);
    if (i > 0) {
      tspan.attr('x', -9).attr('dy', '1em');
    } else {
      tspan.attr('class', 'primary');
    }
  }
}

/**
 * Bar Chart
 */
export default class BarChart extends TranslatedComponent {
  static defaultProps = {
    colors: ['#7b6888', '#6b486b', '#3182bd', '#a05d56', '#d0743c'],
    labels: null,
    unit: ''
  };

  static propTypes = {
    colors: PropTypes.array,
    data: PropTypes.array.isRequired,
    desc: PropTypes.bool,
    format: PropTypes.string.isRequired,
    labels: PropTypes.array,
    predicate: PropTypes.string,
    properties: PropTypes.array,
    title: PropTypes.string.isRequired,
    unit: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);

    this._updateDimensions = this._updateDimensions.bind(this);
    this._hideTip = this._hideTip.bind(this);

    let scale = d3.scaleLinear();
    let y0 = d3.scaleBand();
    let y1 = d3.scaleBand();

    this.xAxis = d3.axisBottom(scale).ticks(5).tickSizeOuter(0).tickFormat(context.language.formats.s2);
    this.yAxis = d3.axisLeft(y0).tickSizeOuter(0);
    this.state = { scale, y0, y1, color: d3.scaleOrdinal().range(props.colors) };
  }

  /**
   * Generate and Show tooltip
   * @param  {Object} build           Ship build
   * @param  {string} property        Property to display
   * @param  {number} propertyIndex   Property Label index
   */
  _showTip(build, property, propertyIndex) {
    let { unit, format, labels } = this.props;
    let { scale, y0, y1 } = this.state;
    let { translate, formats } = this.context.language;
    let fontSize = parseFloat(window.getComputedStyle(document.getElementById('coriolis')).getPropertyValue('font-size') || 16);
    let val = build[property];
    let lblStr = labels ? translate(labels[propertyIndex]) + ': ' : '';
    let valStr = formats[format](val) + ' ' + unit;
    let valMidPoint = scale(val) / 2;
    let y = y0(bName(build)) + y1(property) - fontSize - 5;
    let width = ((lblStr.length + valStr.length) / 1.8) * fontSize;
    let midPoint = width / 2;

    let tooltip = <g>
      <g transform={`translate(${Math.max(0, valMidPoint - midPoint)},${y})`}>
        <rect className='primary-disabled' height={fontSize} width={width} />
        <text x={midPoint} y={fontSize} dy={fontSize / -4} style={{ textAnchor: 'middle', fontSize: '0.7em' }}>
          <tspan style={{ textTransform: 'capitalize' }}>{lblStr}</tspan>
          <tspan>{valStr}</tspan>
        </text>
      </g>
      <path className='primary-disabled' d='M0,0L5,5L10,0Z' dy='1em' transform={`translate(${Math.max(0, valMidPoint - 5)},${y + fontSize})`} />
    </g>;
    this.setState({ tooltip });
  }

  /**
   * Hide tooltip
   */
  _hideTip() {
    this.setState({ tooltip: null });
  }

  /**
   * Update dimensions based on properties and scale
   * @param  {Object} props   React Component properties
   * @param  {number} scale  size ratio / scale
   */
  _updateDimensions(props, scale) {
    let { width, data, properties } = props;
    let innerWidth = width - MARGIN.left - MARGIN.right;
    let barHeight = Math.round(BAR_HEIGHT * scale);
    let dataSize = data.length;
    let innerHeight = barHeight *  dataSize;
    let outerHeight = innerHeight + MARGIN.top + MARGIN.bottom;
    let max = data.reduce((max, build) => (properties.reduce(((m, p) => (m > build[p] ? m : build[p])), max)), 0);

    this.state.scale.range([0, innerWidth]).domain([0, max]);
    this.state.y0.domain(data.map(bName)).range([0, innerHeight], 0.3).padding(0.4);
    this.state.y1.domain(properties).range([0, this.state.y0.bandwidth()]).padding(0.1);

    this.setState({
      barHeight,
      dataSize,
      innerWidth,
      outerHeight,
      innerHeight
    });
  }

  /**
   * Update dimensions based on props and context.
   */
  UNSAFE_componentWillMount() {
    this._updateDimensions(this.props, this.context.sizeRatio);
  }

  /**
   * Update state based on property and context changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next conext
   */
  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    let { data, width, predicate, desc } = nextProps;
    let props = this.props;

    if (width != props.width || this.context.sizeRatio != nextContext.sizeRatio || data != props.data) {
      this._updateDimensions(nextProps, nextContext.sizeRatio);
    }

    if (this.context.language != nextContext.language) {
      this.xAxis.tickFormat(nextContext.language.formats.s2);
    }

    if (predicate != props.predicate || desc != props.desc) {
      this.state.y0.domain(data.map(bName));
    }
  }

  /**
   * Render the chart
   * @return {React.Component} Chart SVG
   */
  render() {
    if (!this.props.width) {
      return null;
    }

    let { title, unit, width, data, properties } = this.props;
    let { innerWidth, outerHeight, innerHeight, y0, y1, scale, color, tooltip } = this.state;

    let bars = data.map((build, i) =>
      <g key={i} transform={`translate(0,${y0(bName(build))})`}>
        { properties.map((p, propIndex) =>
          <rect
            key={p}
            x={0}
            y={y1(p)}
            width={scale(build[p])}
            height={y1.bandwidth()}
            fill={color(p)}
            onMouseOver={this._showTip.bind(this, build, p, propIndex)}
            onMouseOut={this._hideTip}
          />
        )}
      </g>
    );

    return <svg style={{ width, height: outerHeight }}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {bars}
        {tooltip}
        <g className='x axis' ref={(elem) => d3.select(elem).call(this.xAxis)} transform={`translate(0,${innerHeight})`}>
          <text className='cap' y='30' dy='.1em' x={innerWidth / 2} style={{ textAnchor: 'middle' }}>
            <tspan>{title}</tspan>
            { unit ? <tspan className='metric'> ({unit})</tspan> : null }
          </text>
        </g>
        <g className='y axis' ref={(elem) => { let e = d3.select(elem); e.call(this.yAxis); e.selectAll('text').each(insertLinebreaks); }} />
      </g>
    </svg>;
  }
}
