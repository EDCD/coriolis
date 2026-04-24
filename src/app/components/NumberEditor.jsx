import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * A number editor component compatible with React 19
 * Replacement for react-number-editor which uses deprecated findDOMNode
 */
export default class NumberEditor extends Component {
  static propTypes = {
    value: PropTypes.number.isRequired,
    decimals: PropTypes.number,
    step: PropTypes.number,
    stepModifier: PropTypes.number,
    onValueChange: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
  };

  static defaultProps = {
    decimals: 0,
    step: 1,
    stepModifier: 1,
    className: '',
    style: {}
  };

  constructor(props) {
    super(props);
    this.state = {
      value: this.formatValue(props.value),
      isDragging: false,
      dragStartY: 0,
      dragStartValue: 0
    };
    this.inputRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value && !this.inputRef.current?.matches(':focus')) {
      this.setState({ value: this.formatValue(this.props.value) });
    }
  }

  formatValue(value) {
    const { decimals } = this.props;
    if (decimals > 0) {
      return Number(value).toFixed(decimals);
    }
    return String(value);
  }

  parseValue(value) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  handleChange = (e) => {
    const value = e.target.value;
    this.setState({ value });

    // Only call onValueChange if it's a valid number
    const parsed = this.parseValue(value);
    if (!isNaN(parsed)) {
      this.props.onValueChange(parsed);
    }
  };

  handleKeyDown = (e) => {
    const { step, stepModifier } = this.props;
    let newValue = this.parseValue(this.state.value);
    let changed = false;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newValue += e.shiftKey ? step * stepModifier : step;
      changed = true;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newValue -= e.shiftKey ? step * stepModifier : step;
      changed = true;
    }

    if (changed) {
      const formatted = this.formatValue(newValue);
      this.setState({ value: formatted });
      this.props.onValueChange(newValue);
    }

    if (this.props.onKeyDown) {
      this.props.onKeyDown(e);
    }
  };

  handleMouseDown = (e) => {
    // Track potential drag start, but don't preventDefault yet —
    // that would block the input from receiving focus on click
    if (e.button === 0) { // Left mouse button only
      this.setState({
        isDragging: false,
        dragStartY: e.clientY,
        dragStartValue: this.parseValue(this.state.value),
        dragPending: true
      });
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
    }
  };

  handleMouseMove = (e) => {
    if (!this.state.dragPending && !this.state.isDragging) return;

    const { step, stepModifier } = this.props;
    const { dragStartY, dragStartValue } = this.state;

    const pixelsMoved = dragStartY - e.clientY;

    // Only start dragging after a minimum threshold to distinguish from clicks
    if (!this.state.isDragging) {
      if (Math.abs(pixelsMoved) < 3) return;
      // Now we know it's a drag — blur the input and start
      if (this.inputRef.current) this.inputRef.current.blur();
      this.setState({ isDragging: true, dragPending: false });
    }

    // Calculate change based on vertical mouse movement
    const steps = Math.round(pixelsMoved / 5);
    const modifier = e.shiftKey ? stepModifier : 1;
    const newValue = dragStartValue + (steps * step * modifier);

    const formatted = this.formatValue(newValue);
    this.setState({ value: formatted });
    this.props.onValueChange(newValue);
  };

  handleMouseUp = () => {
    this.setState({ isDragging: false, dragPending: false });
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  componentWillUnmount() {
    // Clean up event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  render() {
    const { className, style } = this.props;
    const { value, isDragging } = this.state;

    return (
      <input
        ref={this.inputRef}
        type="text"
        className={`number-editor ${className} ${isDragging ? 'dragging' : ''}`}
        style={{ ...style, cursor: isDragging ? 'ns-resize' : 'text' }}
        value={value}
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
        onMouseDown={this.handleMouseDown}
      />
    );
  }
}
