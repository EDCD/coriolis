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
    axisUnit: PropTypes.string,//units (T, M, etc.)
    max: PropTypes.number,
    min: PropTypes.number,
    onChange: PropTypes.func.isRequired,// function which determins percent value
    onResize: PropTypes.func,
    percent: PropTypes.number.isRequired,//value of slider
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
    this.touchStartTimer = setTimeout(() => this.sliderInputBox._setDisplay('block'), 1500);
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
    clearTimeout(this.touchStartTimer);
    event.preventDefault();
    this.left = null;
    this.width = null;
  }

  /**
   * Touch start handler
   * @param  {Event} event  DOM Event
   * 
   */
  _touchstart(event) {
    //currently not working completely with iPhone - text box will appear, but cannot set focus to it. 
    // works perfectly on Android. May need some tricks in TextInputBox component
    this.touchStartTimer = setTimeout(() => this.sliderInputBox._setDisplay('block'), 1500);
  }

  _touchend(event) {
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
      onMouseUp={this._up} onMouseEnter={this._enter.bind(this)} onMouseMove={this._move} style={style} ref={node => this.node = node} tabIndex="0">
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
 * TODO: Add tap/hold check for keyboard and hold/drag check for slider
 **/
 class TextInputBox extends React.Component {
  static propTypes = {
    axisUnit: PropTypes.string,//units (T, M, etc.)
    max: PropTypes.number,
    onChange: PropTypes.func.isRequired,// function which determins percent value

    percent: PropTypes.number.isRequired,//value of slider
    scale: PropTypes.number
  };


  constructor(props) {
    super(props);
      this._handleFocus = this._handleFocus.bind(this);
      this._handleBlur = this._handleBlur.bind(this);
      this._handleChange = this._handleChange.bind(this);
      this.state = this._getInitialState();
      this.percent = this.props.percent;
      this.max = this.props.max;
      this.state.inputValue = this.percent * this.max;
    }

    componentWillReceiveProps(nextProps) {
      // See https://stackoverflow.com/questions/32414308/updating-state-on-props-change-in-react-form
      if (nextProps.percent !== this.state.percent) {
        this.setState({ inputValue: nextProps.percent * this.max });
      }
    }
    componentDidUpdate(prevProps,prevState) {
      if (this.state.divStyle.display == 'block' && prevState.divStyle.display == 'none') {
        this.sliderVal.focus();
        console.log("component updated. current display: " + this.state.divStyle.display + " - previous display value: " + prevState.divStyle.display);
      }
      
    }
    _getInitialState() {
      return {
        divStyle: {
          display:'none'
        },
        inputStyle: {
          width:'4em'
        },
        labelStyle: {
          marginLeft: '.1em',
        },
        maxLength:5,
        size:5,
        tabIndex:-1,
        type:'number',
        readOnly: true
      }
    }
    _setDisplay(val) {
      this.setState({divStyle:{display:val}});
    }
    _handleFocus() {
      this.setState({
        inputValue:this._getValue()
      });
    }
    _handleBlur() {
      this.setState(this._getInitialState());
      if (this.state.inputValue !== '') {
        this.props.onChange(this.state.inputValue/this.props.max);
      } else {
        this.state.inputValue = this.props.percent * this.props.max;
      }
      
    }
    _getValue() {
      return this.state.inputValue;
    }

    _handleChange(event) {
      
      if (event.target.value <= this.props.max)  {
        this.setState({inputValue: event.target.value});
      } else {
        this.setState({inputValue: this.props.max});
      }
        
      
    }
    render() {
      let {  axisUnit, onChange, percent, scale } = this.props;
      return <div style={this.state.divStyle}><input style={this.state.inputStyle} value={this._getValue()} onChange={this._handleChange} tabIndex={this.state.tabIndex} maxLength={this.state.maxLength} size={this.state.size} onBlur={() => {this._handleBlur()}} onFocus={() => {this._handleFocus()}} type={this.state.type} ref={(ip) => this.sliderVal = ip}/><text className="primary upp" style={this.state.labelStyle}>{this.props.axisUnit}</text></div>;
    }
 }

