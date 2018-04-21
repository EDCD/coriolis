import React from 'react';
import PropTypes from 'prop-types';

const MARGIN_LR = 8; // Left/ Right margin

/**
 * Horizontal Slider
 */
export default class Slider extends React.Component {

  static defaultProps = {
    axis: false,
    min: 0,
    max: 1,
    scale: 1  // SVG render scale
  };

  static propTypes = {
    axis: PropTypes.bool,
    axisUnit: PropTypes.string,
    max: PropTypes.number,
    min: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    onResize: PropTypes.func,
    percent: PropTypes.number.isRequired,
    scale: PropTypes.number
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    this._down = this._down.bind(this);
    this._move = this._move.bind(this);
    this._up = this._up.bind(this);
    this._updatePercent = this._updatePercent.bind(this);
    this._updateDimensions = this._updateDimensions.bind(this);

    this.state = { width: 0 };
  }

  /**
   * On Mouse/Touch down handler
   * @param  {SyntheticEvent} event Event
   */
  _down(event) {
    let rect = event.currentTarget.getBoundingClientRect();
    this.left = rect.left;
    this.width = rect.width;
    this._move(event);
  }

  /**
   * Update the slider percentage on move
   * @param  {SyntheticEvent} event Event
   */
  _move(event) {
    if(this.width !== null && this.left != null) {
      let clientX = event.touches ? event.touches[0].clientX : event.clientX;
      event.preventDefault();
      this._updatePercent(clientX - this.left, this.width);
    }
  }

  /**
   * On Mouse/Touch up handler
   * @param  {Event} event  DOM Event
   */
  _up(event) {
    /*
    console.log("event key: " + event.key);
    console.log("svgElement? %O", this.node);
    this.node.focus();
    alert("slider has focus");
    */
    event.preventDefault();
    this.left = null;
    this.width = null;
  }

  /**
   * Determine if the user is still dragging
   * @param  {SyntheticEvent} event Event
   */
  _enter(event) {
    if(event.buttons !== 1) {
      this.left = null;
      this.width = null;
    }
  }

  /**
   * Update the slider percentage
   * @param  {number} pos   Slider drag position
   * @param  {number} width Slider width
   * @param  {Event} event  DOM Event
   */
  _updatePercent(pos, width) {
    this.props.onChange(Math.min(Math.max(pos / width, 0), 1));
  }

  /**
   * Update dimenions from rendered DOM
   */
  _updateDimensions() {
    this.setState({
      outerWidth: this.node.getBoundingClientRect().width
    });
  }

  /**
   * Add listeners when about to mount
   */
  componentWillMount() {
    if (this.props.onResize) {
      this.resizeListener = this.props.onResize(this._updateDimensions);
    }
  }

  /**
   * Trigger DOM updates on mount
   */
  componentDidMount() {
    console.log("slider? %O", this.node);

    this._updateDimensions();
  }

  /**
   * Remove listeners on unmount
   */
  componentWillUnmount() {
    if (this.resizeListener) {
      this.resizeListener.remove();
    }
  }

  /**
   * Render the slider
   * @return {React.Component} The slider
   */
  render() {
    let outerWidth = this.state.outerWidth;
    let { axis, axisUnit, min, max, scale } = this.props;

    let style = {
      width: '100%',
      height: axis ? '2.5em' : '1.5em',
      boxSizing: 'border-box'
    };

    if (!outerWidth) {
      return <svg style={style} ref={node => this.node = node} />;
    }

    let margin = MARGIN_LR * scale;
    let width = outerWidth - (margin * 2);
    let pctPos = width * this.props.percent;

    return <svg 
      onMouseUp={this._up} onMouseEnter={this._enter.bind(this)} onMouseMove={this._move} onTouchEnd={this._up} onKeyUp={this._up} style={style} ref={node => this.node = node} tabIndex="0">
      <rect className='primary' style={{ opacity: 0.3 }} x={margin} y='0.25em' rx='0.3em' ry='0.3em' width={width} height='0.7em' />
      <rect className='primary-disabled' x={margin} y='0.45em' rx='0.15em' ry='0.15em' width={pctPos} height='0.3em' />
      <circle className='primary' r={margin} cy='0.6em' cx={pctPos + margin} />
      <rect x={margin} width={width} height='100%' fillOpacity='0' style={{ cursor: 'col-resize' }} onMouseDown={this._down} onTouchMove={this._move} onTouchStart={this._down} />
      {axis && <g style={{ fontSize: '.7em' }}>
        <text className='primary-disabled' y='3em' x={margin} style={{ textAnchor: 'middle' }}>{min + axisUnit}</text>
        <text className='primary-disabled' y='3em' x='50%' style={{ textAnchor: 'middle' }}>{(min + max / 2) + axisUnit}</text>
        <text className='primary-disabled' y='3em' x='100%' style={{ textAnchor: 'end' }}>{max + axisUnit}</text>
      </g>}
    </svg>;
  }
}
