import React from 'react';
import PropTypes from 'prop-types';
import ResponsiveWrapper from './ResponsiveWrapper';
import * as d3 from 'd3';
import TranslatedComponent from './TranslatedComponent';

const MARGIN = { top: 15, right: 20, bottom: 35, left: 60 };

/**
 * Line Chart
 */
export default class LineChart extends TranslatedComponent {

  static defaultProps = {
    code: '',
    xMin: 0,
    yMin: 0,
    points: 20,
    colors: ['#ff8c0d'],
    aspect: 0.5
  };

  static propTypes = {
    func: PropTypes.func.isRequired,
    xLabel: PropTypes.string.isRequired,
    xMin: PropTypes.number,
    xMax: PropTypes.number.isRequired,
    xUnit: PropTypes.string.isRequired,
    xMark: PropTypes.number,
    yLabel: PropTypes.string.isRequired,
    yMin: PropTypes.number,
    yMax: PropTypes.number.isRequired,
    yUnit: PropTypes.string,
    series: PropTypes.array,
    colors: PropTypes.array,
    points: PropTypes.number,
    aspect: PropTypes.number,
    code: PropTypes.string,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);

    this._updateDimensions = this._updateDimensions.bind(this);
    this._updateSeries = this._updateSeries.bind(this);
    this._tooltip = this._tooltip.bind(this);
    this._showTip = this._showTip.bind(this);
    this._hideTip = this._hideTip.bind(this);
    this._moveTip = this._moveTip.bind(this);

    const series = props.series;

    let xScale = d3.scaleLinear();
    let yScale = d3.scaleLinear();
    let xAxisScale = d3.scaleLinear();

    this.xAxis = d3.axisBottom(xAxisScale).tickSizeOuter(0);
    this.yAxis = d3.axisLeft(yScale).ticks(6).tickSizeOuter(0);

    this.state = {
      xScale,
      xAxisScale,
      yScale,
      tipHeight: 2 + (1.2 * (series ? series.length : 0.8)),
    };
  }

  /**
   * Update tooltip content
   * @param  {number} xPos x coordinate
   * @param {number} width current container width
   */
  _tooltip(xPos, width) {
    let { xLabel, yLabel, xUnit, yUnit, func, series } = this.props;
    let { xScale, yScale } = this.state;
    let { formats, translate } = this.context.language;
    let x0 = xScale.invert(xPos),
        y0 = func(x0),
        tips = this.tipContainer,
        yTotal = 0,
        flip = (xPos / width > 0.50),
        tipWidth = 0,
        tipHeightPx = tips.selectAll('rect').node().getBoundingClientRect().height;


    xPos = xScale(x0); // Clamp xPos

    tips.selectAll('text.text-tip.y').text(function(d, i) {
      let yVal = series ? y0[series[i]] : y0;
      yTotal += yVal;
      return (series ? translate(series[i]) : '') + ' ' + formats.f2(yVal);
    }).append('tspan').attr('class', 'metric').text(yUnit ? ' ' + yUnit : '');

    tips.selectAll('text').each(function() {
      if (this.getBBox().width > tipWidth) {
        tipWidth = Math.ceil(this.getBBox().width);
      }
    });

    let tipY = Math.floor(yScale(yTotal / (series ? series.length : 1)) - (tipHeightPx / 2));

    tipWidth += 8;
    tips.attr('transform', 'translate(' + xPos + ',' + tipY + ')');
    tips.selectAll('text.text-tip').attr('x', flip ? -12 : 12).style('text-anchor', flip ? 'end' : 'start');
    tips.selectAll('text.text-tip.x').text(formats.f2(x0)).append('tspan').attr('class', 'metric').text(' ' + xUnit);
    tips.selectAll('rect').attr('width', tipWidth + 4).attr('x', flip ? -tipWidth - 12 : 8).attr('y', 0).style('text-anchor', flip ? 'end' : 'start');
    this.markersContainer.selectAll('circle').attr('cx', xPos).attr('cy', (d, i) => yScale(series ? y0[series[i]] : y0));
  }

  /**
   * Update dimensions based on properties and scale
   * @param  {Object} props  React Component properties
   * @param  {number} scale  size ratio / scale
   * @param {number} width   current width of the container
   * @returns {Object}       calculated dimensions
   */
  _updateDimensions(props, scale, width) {
    const { xMax, xMin, yMin, yMax } = props;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const outerHeight = Math.round(width * props.aspect);
    const innerHeight = outerHeight - MARGIN.top - MARGIN.bottom;

    this.state.xScale.range([0, innerWidth]).domain([xMin, xMax || 1]).clamp(true);
    this.state.xAxisScale.range([0, innerWidth]).domain([xMin, xMax]).clamp(true);
    this.state.yScale.range([innerHeight, 0]).domain([yMin, yMax + (yMax - yMin) * 0.1]); // 10% higher than maximum value for tooltip visibility
    return { innerWidth, outerHeight, innerHeight };
  }

  /**
   * Show tooltip
   * @param  {SyntheticEvent} e Event
   */
  _showTip(e) {
    e.preventDefault();
    this.tipContainer.style('display', null);
    this.markersContainer.style('display', null);
    this._moveTip(e);
  }

  /**
   * Move and update tooltip
   * @param  {SyntheticEvent} e Event
   * @param {number} width current container width
   */
  _moveTip(e, width) {
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    this._tooltip(Math.round(clientX - e.currentTarget.getBoundingClientRect().left), width);
  }

  /**
   * Hide tooltip
   * @param  {SyntheticEvent} e Event
   */
  _hideTip(e) {
    e.preventDefault();
    this.tipContainer.style('display', 'none');
    this.markersContainer.style('display', 'none');
  }

  /**
   * Update series generated from props
   * @param   {Object} props   React Component properties
   * @param   {Object} state   React Component state
   */
  _updateSeries(props, state) {
    let { func, xMin, xMax, series, points } = props;
    let delta = (xMax - xMin) / points;
    let seriesData = new Array(points);

    if (delta) {
      seriesData = new Array(points);
      for (let i = 0, x = xMin; i < points; i++) {
        seriesData[i] = [x, func(x)];
        x += delta;
      }
      seriesData[points - 1] = [xMax, func(xMax)];
    } else {
      let yVal = func(xMin);
      seriesData = [[0, yVal], [1, yVal]];
    }

    const markerElems = [];
    const detailElems = [<text key='lbl' className='text-tip x' y='1.25em'/>];
    const seriesLines = [];
    for (let i = 0, l = series ? series.length : 1; i < l; i++) {
      const yAccessor = series ? function(d) { return state.yScale(d[1][this]); }.bind(series[i]) : (d) => state.yScale(d[1]);
      seriesLines.push(d3.line().x((d, i) => this.state.xScale(d[0])).y(yAccessor));
      detailElems.push(<text key={i} className='text-tip y' strokeWidth={0} fill={props.colors[i]} y={1.25 * (i + 2) + 'em'}/>);
      markerElems.push(<circle key={i} className='marker' r='4' />);
    }

    const tipHeight = 2 + (1.2 * (seriesLines ? seriesLines.length : 0.8));

    this.setState({ markerElems, detailElems, seriesLines, seriesData, tipHeight });
  }

  /**
   * Update dimensions and series data based on props and context.
   */
  UNSAFE_componentWillMount() {
    this._updateSeries(this.props, this.state);
  }

  /**
   * Update state based on property and context changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next conext
   */
  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    const props = this.props;

    if (props.code != nextProps.code) {
      this._updateSeries(nextProps, this.state);
    }
  }

  /**
   * Render the chart
   * @return {React.Component} Chart SVG
   */
  render() {
    return (
      <ResponsiveWrapper>
        { ({ width, height }) => {
          // Provide default height if not available
          const chartHeight = height || 300;
          const { innerWidth, outerHeight, innerHeight } = this._updateDimensions(this.props, this.context.sizeRatio, width, chartHeight);
          const { xMin, xMax, xLabel, yLabel, xUnit, yUnit, xMark, colors } = this.props;
          const { tipHeight, detailElems, markerElems, seriesData, seriesLines } = this.state;
          const lines = seriesLines.map((line, i) => <path key={i} className='line' fill='none' stroke={colors[i]} strokeWidth='1' d={line(seriesData)} />).reverse();

          const markX = xMark ? innerWidth * (xMark - xMin) / (xMax - xMin) : 0;
          const xmark = xMark ? <path key={'mark'} className='line' fill='none' strokeDasharray='5,5' stroke={'#ff8c0d'} strokeWidth='1' d={'M ' + markX + ' ' + innerHeight + ' L ' + markX + ' 0'} /> : '';
          return (
            <div style={{ width: '100%', height: outerHeight }}>
              <svg style={{ width: '100%', height: outerHeight }}>
                <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                  <g>{xmark}</g>
                  <g>{lines}</g>
                  <g className='x axis' ref={(elem) => d3.select(elem).call(this.xAxis)} transform={`translate(0,${innerHeight})`}>
                    <text className='cap' y='30' dy='.1em' x={innerWidth / 2} style={{ textAnchor: 'middle' }}>
                      <tspan>{xLabel}</tspan>
                      <tspan className='metric'> ({xUnit})</tspan>
                    </text>
                  </g>
                  <g className='y axis' ref={(elem) => d3.select(elem).call(this.yAxis)}>
                    <text className='cap' transform='rotate(-90)' y='-50' dy='.1em' x={innerHeight / -2} style={{ textAnchor: 'middle' }}>
                      <tspan>{yLabel}</tspan>
                      { yUnit && <tspan className='metric'> ({yUnit})</tspan> }
                    </text>
                  </g>
                  <g ref={(g) => this.tipContainer = d3.select(g)} style={{ display: 'none' }}>
                    <rect className='tooltip' height={tipHeight + 'em'}></rect>
                    {detailElems}
                  </g>
                  <g ref={(g) => this.markersContainer = d3.select(g)} style={{ display: 'none' }}>
                    {markerElems}
                  </g>
                  <rect
                    fillOpacity='0'
                    height={innerHeight}
                    width={innerWidth + 1}
                    onMouseEnter={this._showTip}
                    onTouchStart={this._showTip}
                    onMouseLeave={this._hideTip}
                    onTouchEnd={this._hideTip}
                    onMouseMove={e => this._moveTip(e, width)}
                    onTouchMove={e => this._moveTip(e, width)}
                  />
                </g>
              </svg>
            </div>
          );
        }}
      </ResponsiveWrapper>
    );
  }
}
