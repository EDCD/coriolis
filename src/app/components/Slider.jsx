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
    axisUnit: PropTypes.string,// units (T, M, etc.)
    max: PropTypes.number,
    min: PropTypes.number,
    onChange: PropTypes.func.isRequired,// function which determins percent value
    onResize: PropTypes.func,
    percent: PropTypes.number.isRequired,// value of slider
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
    this._keyup = this._keyup.bind(this);
    this._keydown = this._keydown.bind(this);
    this._touchstart = this._touchstart.bind(this);
    this._touchend = this._touchend.bind(this);

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
    this.touchStartTimer = setTimeout(() => this.sliderInputBox._setDisplay('block'), 1500);
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
    this.sliderInputBox.sliderVal.focus();
    clearTimeout(this.touchStartTimer);
    event.preventDefault();
    this.left = null;
    this.width = null;
  }


  /**
   * Key up handler for keyboard.
   * display the number field then set focus to it
   * when "Enter" key is pressed
   * @param {Event} event Keyboard event
   */
  _keyup(event) {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.sliderInputBox._setDisplay('block');
        return;
      default:
        return;
    }
  }
  /**
   * Key down handler
   * increment slider position by +/- 1 when right/left arrow key is pressed or held
   * @param {Event} event Keyboard even
   */
  _keydown(event) {
    let newVal = this.props.percent * this.props.max;
    switch (event.key) {
      case 'ArrowRight':
        newVal += 1;
        if (newVal <= this.props.max) this.props.onChange(newVal / this.props.max);
        return;
      case 'ArrowLeft':
        newVal -= 1;
        if (newVal >= 0) this.props.onChange(newVal / this.props.max);
        return;
      default:
        return;
    }
  }

  /**
   * Touch start handler
   * @param  {Event} event  DOM Event
   * 
   */
  _touchstart(event) {
    this.touchStartTimer = setTimeout(() => this.sliderInputBox._setDisplay('block'), 1500);
  }
  
  /**
   * Touch end handler
   * @param  {Event} event  DOM Event
   * 
   */
  _touchend(event) {
    this.sliderInputBox.sliderVal.focus();
    clearTimeout(this.touchStartTimer);
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
    return <div><svg 
      onMouseUp={this._up} onMouseEnter={this._enter.bind(this)} onMouseMove={this._move} onKeyUp={this._keyup} onKeyDown={this._keydown} style={style} ref={node => this.node = node} tabIndex="0">
      <rect className='primary' style={{ opacity: 0.3 }} x={margin} y='0.25em' rx='0.3em' ry='0.3em' width={width} height='0.7em' />
      <rect className='primary-disabled' x={margin} y='0.45em' rx='0.15em' ry='0.15em' width={pctPos} height='0.3em' />
      <circle className='primary' r={margin} cy='0.6em' cx={pctPos + margin} />
      <rect x={margin} width={width} height='100%' fillOpacity='0' style={{ cursor: 'col-resize' }} onMouseDown={this._down} onTouchMove={this._move} onTouchStart={this._down} onTouchEnd={this._touchend} />
      {axis && <g style={{ fontSize: '.7em' }}>
        <text className='primary-disabled' y='3em' x={margin} style={{ textAnchor: 'middle' }}>{min + axisUnit}</text>
        <text className='primary-disabled' y='3em' x='50%' style={{ textAnchor: 'middle' }}>{(min + max / 2) + axisUnit}</text>
        <text className='primary-disabled' y='3em' x='100%' style={{ textAnchor: 'end' }}>{max + axisUnit}</text>
      </g>}
    </svg>
    <TextInputBox ref={(tb) => this.sliderInputBox = tb}
      onChange={this.props.onChange}
      percent={this.props.percent}
      axisUnit={this.props.axisUnit}
      scale={this.props.scale}
      max={this.props.max}
    />
   </div>;
  }
}
/**
 * New component to add keyboard support for sliders - works on all devices (desktop, iOS, Android)
 **/
class TextInputBox extends React.Component {
  static propTypes = {
    axisUnit: PropTypes.string,// units (T, M, etc.)
    max: PropTypes.number,
    onChange: PropTypes.func.isRequired,// function which determins percent value
    percent: PropTypes.number.isRequired,// value of slider
    scale: PropTypes.number
  };
  /**
   * Determine if the user is still dragging
   * @param  {Object} props React Component properties
   */
  constructor(props) {
    super(props);
    this._handleFocus = this._handleFocus.bind(this);
    this._handleBlur = this._handleBlur.bind(this);
    this._handleChange = this._handleChange.bind(this);
    this._keyup = this._keyup.bind(this);
    this.state = this._getInitialState();
  }
  /**
   * Update input value if slider changes will change props/state
   * @param  {Object} nextProps React Component properites
   * @param  {Object} nextState React Component state values
   */
  componentWillReceiveProps(nextProps, nextState) {
    let nextValue = nextProps.percent * nextProps.max;
    // See https://stackoverflow.com/questions/32414308/updating-state-on-props-change-in-react-form
    if (nextValue !== this.state.inputValue && nextValue <= nextProps.max) {
      this.setState({ inputValue: nextValue });
    }
  }
    /**
   * Update slider textbox visibility/values if changes are made to slider
   * @param  {Object} prevProps React Component properites
   * @param  {Object} prevState React Component state values
   */
  componentDidUpdate(prevProps, prevState) {
    if (prevState.divStyle.display == 'none' && this.state.divStyle.display == 'block') {
      this.enterTimer = setTimeout(() => this.sliderVal.focus(), 10);  
    }
    if (prevProps.max !== this.props.max && this.state.inputValue > this.props.max) {
      // they chose a different module
      this.setState({ inputValue: this.props.max });
    }
    if (this.state.inputValue != prevState.inputValue && prevProps.max == this.props.max) {
      this.props.onChange(this.state.inputValue / this.props.max);
    }
  }
  /**
   * Set initial state for the textbox. 
   * We may want to rethink this to 
   * try and make it a stateless component
   * @returns {object} React state object with initial values set
   */
  _getInitialState() {
    return {
      divStyle: { display:'none' }, 
      inputStyle: { width:'4em' },
      labelStyle: { marginLeft: '.1em' },
      maxLength:5,
      size:5,
      min:0,
      tabIndex:-1,
      type:'number',
      readOnly: true,
      inputValue: this.props.percent * this.props.max
    };
  }
  /**
   * 
   * @param {string} val block or none
   */
  _setDisplay(val) {
    this.setState({
      divStyle: { display:val }
    });
  }
  /**
   * Update the input value
   * when textbox gets focus
   */
  _handleFocus() {
    this.setState({
      inputValue:this._getValue()
    });
  }
  /**
   * Update inputValue when textbox loses focus
   */
  _handleBlur() {
    this._setDisplay('none');
    if (this.state.inputValue !== '') {
      this.props.onChange(this.state.inputValue / this.props.max);
    } else {
      this.setState({
        inputValue: this.props.percent * this.props.max
      });
    }
  }
  /**
   * Get the value in the text box
   * @returns {number} inputValue Value of the input box 
   */
  _getValue() {
    return this.state.inputValue;
  }
  /**
   * Update and set limits on input box
   * values depending on what user
   * has selected
   * 
   * @param {SyntheticEvent} event ReactJs onChange event
   */
  _handleChange(event) {
    if (event.target.value < 0) {
      this.setState({ inputValue: 0 });
    } else if (event.target.value <= this.props.max)  {
      this.setState({ inputValue: event.target.value });
    } else {
      this.setState({ inputValue: this.props.max });
    }
  }
  /**
   * Key up handler for input field.
   * If user hits Enter key, blur/close the input field
   * @param {Event} event Keyboard event
   */
  _keyup(event) {
    switch (event.key) {
      case 'Enter':
        this.sliderVal.blur();
        return;
      default:
        return;
    }
  }
  /**
   * Get the value in the text box
   * @return {React.Component} Text Input component for Slider
   */
  render() {
    let {  axisUnit, onChange, percent, scale } = this.props;
    return <div style={this.state.divStyle}><input style={this.state.inputStyle} value={this._getValue()} min={this.state.min} max={this.props.max} onChange={this._handleChange} onKeyUp={this._keyup} tabIndex={this.state.tabIndex} maxLength={this.state.maxLength} size={this.state.size} onBlur={() => {this._handleBlur();}} onFocus={() => {this._handleFocus();}} type={this.state.type} ref={(ip) => this.sliderVal = ip}/><text className="primary upp" style={this.state.labelStyle}>{this.props.axisUnit}</text></div>;
  }
}

