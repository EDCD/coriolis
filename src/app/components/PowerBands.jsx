import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import cn from 'classnames';
import TranslatedComponent from './TranslatedComponent';
import { wrapCtxMenu } from '../utils/UtilityFunctions';

/**
 * Round to avoid floating point precision errors
 * @param  {Boolean} selected Band selected
 * @param  {number} sum       Band power sum
 * @param  {number} avail     Total available power
 * @return {string}          CSS Class name
 */
function getClass(selected, sum, avail) {
  return selected ? 'secondary' : ((Math.round(sum * 100) / 100) >= avail) ? 'warning' : 'primary';
}

/**
 * Get the # label for a Priority band
 * @param  {number} val           Priority Band Watt value
 * @param  {number} index         Priority Band index
 * @param  {Function} wattScale   Watt Scale function
 * @return {number}               label / text
 */
function bandText(val, index, wattScale) {
  return (val > 0 && wattScale(val) > 13) ? index + 1 : null;
}

/**
 * Power Bands Component
 * Renders the SVG to simulate in-game power bands
 */
export default class PowerBands extends TranslatedComponent {
  static propTypes = {
    bands: PropTypes.array.isRequired,
    available: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    code: PropTypes.string,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);
    this.wattScale = d3.scaleLinear();
    this.pctScale = d3.scaleLinear().domain([0, 1]);
    this.wattAxis = d3.axisTop(this.wattScale).tickSizeOuter(0).tickFormat(context.language.formats.r2);
    this.pctAxis = d3.axisBottom(this.pctScale).tickSizeOuter(0).tickFormat(context.language.formats.rPct);

    this._updateDimensions = this._updateDimensions.bind(this);
    this._updateScales = this._updateScales.bind(this);
    this._selectNone = this._selectNone.bind(this);
    this._hidetip = () => this.context.tooltip();

    let maxBand = props.bands[props.bands.length - 1];

    this.state = {
      maxPwr: Math.max(props.available, maxBand.retractedSum, maxBand.deployedSum),
      ret: {},
      dep: {}
    };

    if (props.width) {
      this._updateDimensions(props, context.sizeRatio);
    }
  }

  /**
   * Update dimensions based on properties and scale
   * @param  {Object} props   React Component properties
   * @param  {number} scale  size ratio / scale
   */
  _updateDimensions(props, scale) {
    let barHeight = Math.round(20 * scale);
    let innerHeight = (barHeight * 2) + 2;
    let mTop = Math.round(25 * scale);
    let mBottom = Math.round(25 * scale);
    let mLeft = Math.round(45 * scale);
    let mRight = Math.round(140 * scale);
    let innerWidth = props.width - mLeft - mRight;

    this._updateScales(innerWidth, this.state.maxPwr, props.available);

    this.setState({
      barHeight,
      innerHeight,
      mTop,
      mBottom,
      mLeft,
      mRight,
      innerWidth,
      height: innerHeight + mTop + mBottom,
      retY: (barHeight / 2),
      depY: (barHeight * 1.5) - 1
    });
  }

  /**
   * Select no bands
   */
  _selectNone() {
    this.setState({
      ret : {},
      dep: {}
    });
  }

  /**
   * Select a retracted band
   * @param  {number} index Band index
   */
  _selectRet(index) {
    let ret = this.state.ret;
    if(ret[index]) {
      delete ret[index];
    } else {
      ret[index] = 1;
    }

    this.setState({ ret: Object.assign({}, ret) });
  }

  /**
   * Select a deployed band
   * @param  {number} index Band index
   */
  _selectDep(index) {
    let dep = this.state.dep;

    if(dep[index]) {
      delete dep[index];
    } else {
      dep[index] = 1;
    }

    this.setState({ dep: Object.assign({}, dep) });
  }

  /**
   * Update scale
   * @param  {number} innerWidth  SVG innerwidth
   * @param  {number} maxPwr      Maximum power level MJ (deployed or available)
   * @param  {number} available   Available power MJ
   */
  _updateScales(innerWidth, maxPwr, available) {
    this.wattScale.range([0, innerWidth]).domain([0, maxPwr]).clamp(true);
    this.pctScale.range([0, innerWidth]).domain([0, maxPwr / available]).clamp(true);
  }

  /**
   * Update state based on property and context changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next context
   */
  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    let { innerWidth, maxPwr } = this.state;
    let { language, sizeRatio } = this.context;
    let maxBand = nextProps.bands[nextProps.bands.length - 1];
    let nextMaxPwr = Math.max(nextProps.available, maxBand.retractedSum, maxBand.deployedSum);

    if (language !== nextContext.language) {
      this.wattAxis.tickFormat(nextContext.language.formats.r2);
      this.pctAxis.tickFormat(nextContext.language.formats.rPct);
    }

    if (maxPwr != nextMaxPwr) { // Update Axes if max power has changed
      this._updateScales(innerWidth, nextMaxPwr, nextProps.available);
      this.setState({ maxPwr: nextMaxPwr });
    } else if (nextProps.width != this.props.width || sizeRatio != nextContext.sizeRatio) {
      this._updateDimensions(nextProps, nextContext.sizeRatio);
    }
  }

  /**
   * Render the power bands
   * @return {React.Component} Power bands
   */
  render() {
    if (!this.props.width) {
      return null;
    }

    let { wattScale, pctScale, context, props, state } = this;
    let { translate, formats } = context.language;
    let { f2, pct1 } = formats; // wattFmt, pctFmt
    let { available, bands } = props;
    let { innerWidth, ret, dep } = state;
    let pwrWarningClass = cn('threshold', { exceeded: bands[0].retractedSum > available * 0.4 });
    let deployed = [];
    let retracted = [];
    let retSelected = Object.keys(ret).length > 0;
    let depSelected = Object.keys(dep).length > 0;
    let retSum = 0;
    let depSum = 0;

    for (let i = 0; i < bands.length; i++) {
      let b = bands[i];
      retSum += (!retSelected || ret[i]) ? b.retracted : 0;
      depSum += (!depSelected || dep[i]) ? b.deployed + b.retracted : 0;

      if (b.retracted > 0) {
        let retLbl = bandText(b.retracted, i, wattScale);

        retracted.push(<rect
          key={'rB' + i}
          width={Math.ceil(Math.max(wattScale(b.retracted), 0))}
          height={state.barHeight}
          x={Math.floor(Math.max(wattScale(b.retractedSum) - wattScale(b.retracted), 0))}
          y={1}
          onClick={this._selectRet.bind(this, i)}
          className={getClass(ret[i], b.retractedSum, available)}
        />);

        if (retLbl) {
          retracted.push(<text
            key={'rT' + i}
            dy='0.5em'
            textAnchor='middle'
            height={state.barHeight}
            x={wattScale(b.retractedSum) - (wattScale(b.retracted) / 2)}
            y={state.retY}
            onClick={this._selectRet.bind(this, i)}
            className='primary-bg'>{retLbl}</text>
          );
        }
      }

      if (b.retracted > 0 || b.deployed > 0) {
        let depLbl = bandText(b.deployed + b.retracted, i, wattScale);

        deployed.push(<rect
          key={'dB' + i}
          width={Math.ceil(Math.max(wattScale(b.deployed + b.retracted), 0))}
          height={state.barHeight}
          x={Math.floor(Math.max(wattScale(b.deployedSum) - wattScale(b.retracted) - wattScale(b.deployed), 0))}
          y={state.barHeight + 1}
          onClick={this._selectDep.bind(this, i)}
          className={getClass(dep[i], b.deployedSum, available)}
        />);

        if (depLbl) {
          deployed.push(<text
            key={'dT' + i}
            dy='0.5em'
            textAnchor='middle'
            height={state.barHeight}
            x={wattScale(b.deployedSum) - ((wattScale(b.retracted) + wattScale(b.deployed)) / 2)}
            y={state.depY}
            onClick={this._selectDep.bind(this, i)}
            className='primary-bg'>{depLbl}</text>
          );
        }
      }
    }

    return (
      <svg style={{ marginTop: '1em', width: '100%', height: state.height }} onContextMenu={wrapCtxMenu(this._selectNone)}>
        <g transform={`translate(${state.mLeft},${state.mTop})`}>
          <g className='power-band'>{retracted}</g>
          <g className='power-band'>{deployed}</g>
          <g ref={ (elem) => d3.select(elem).call(this.wattAxis) } className='watt axis'></g>
          <g ref={ (elem) => {
            let axis = d3.select(elem);
            axis.call(this.pctAxis);
            axis.select('g:nth-child(6)').selectAll('line, text').attr('class', pwrWarningClass);
          }} className='pct axis' transform={`translate(0,${state.innerHeight})`}></g>
          <line x1={pctScale(0.4)} x2={pctScale(0.4)} y1='0' y2={state.innerHeight} className={pwrWarningClass} />
          <text dy='0.5em' x='-3' y={state.retY} className='primary upp' textAnchor='end' onMouseOver={this.context.termtip.bind(null, 'retracted')} onMouseLeave={this._hidetip}>{translate('ret')}</text>
          <text dy='0.5em' x='-3' y={state.depY} className='primary upp' textAnchor='end' onMouseOver={this.context.termtip.bind(null, 'deployed', { orientation: 's', cap: 1 })} onMouseLeave={this._hidetip}>{translate('dep')}</text>
          <text dy='0.5em' x={innerWidth + 5} y={state.retY} className={getClass(retSelected, retSum, available)}>{f2(Math.max(0, retSum))} ({pct1(Math.max(0, retSum / available))})</text>
          <text dy='0.5em' x={innerWidth + 5} y={state.depY} className={getClass(depSelected, depSum, available)}>{f2(Math.max(0, depSum))} ({pct1(Math.max(0, depSum / available))})</text>
        </g>
      </svg>
    );
  }
}
