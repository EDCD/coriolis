import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import cn from 'classnames';
import NumberEditor from 'react-number-editor';

/**
 * Modification
 */
export default class Modification extends TranslatedComponent {

  static propTypes = {
    ship: PropTypes.object.isRequired,
    m: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    modItems: PropTypes.array.isRequired,
    handleModChange: PropTypes.func.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);
    this.state = {};
    this.state.value = props.value;
  }

  /**
   * Update modification given a value.
   * @param {Number} value The value to set.  This comes in as a string and must be stored in state as a string,
   *                       because it needs to allow illegal 'numbers' ('-', '1.', etc) when the user is typing
   *                       in a value by hand
   */
  _updateValue(value) {
    const name = this.props.name;
    let scaledValue = Math.round(Number(value) * 100);
    // Limit to +1000% / -99.99%
    if (scaledValue > 100000) {
      scaledValue = 100000;
      value = 1000;
    }
    if (scaledValue < -9999) {
      scaledValue = -9999;
      value = -99.99;
    }

    let m = this.props.m;
    let ship = this.props.ship;
    ship.setModification(m, name, scaledValue, true);

    this.setState({ value });
  }

  /**
   * Triggered when an update to slider value is finished i.e. when losing focus
   * 
   * pnellesen (24/05/2018): added value check below - this should prevent experimental effects from being recalculated 
   * with each onBlur event, even when no change has actually been made to the field. 
   */
  _updateFinished() {
    if (this.props.value != this.state.value) {
      this.props.handleModChange(true);
      this.props.onChange();
    }
  }

  /**
   * Render the modification
   * @return {React.Component} modification
   */
  render() {
    let translate = this.context.language.translate;
    let { m, name } = this.props;

    if (name === 'damagedist') {
      // We don't show damage distribution
      return null;
    }

    let symbol;
    if (name === 'jitter') {
      symbol = '°';
    } else if (name !== 'burst' && name != 'burstrof') {
      symbol = '%';
    }
    if (symbol) {
      symbol = ' (' + symbol + ')';
    }

    return (
      <div onBlur={this._updateFinished.bind(this)} className={'cb'} key={name} ref={ modItem => this.props.modItems[name] = modItem }>
        <div className={'cb'}>{translate(name, m.grp)}{symbol}</div>
        <NumberEditor className={'cb'} style={{ width: '90%', textAlign: 'center' }} step={0.01} stepModifier={1} decimals={2} value={this.state.value} onValueChange={this._updateValue.bind(this)} onKeyDown={ this.props.onKeyDown } />
      </div>
    );
  }
}
