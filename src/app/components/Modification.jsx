import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import cn from 'classnames';
import NumberEditor from 'react-number-editor';
import { isChangeValueBeneficial } from '../utils/BlueprintFunctions';
import { Modifications } from 'coriolis-data/dist';

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
    this.setState({ value });
    let reCast = String(Number(value));
    if (reCast.endsWith(value) || reCast.startsWith(value)) {
      let { m, name, ship } = this.props;
      value = Math.max(Math.min(value, 50000), -50000);
      ship.setModification(m, name, value, true, true);
    }
  }

  /**
   * Triggered when a key is pressed down with focus on the number editor.
   * @param {SyntheticEvent} event Key down event
   */
  _keyDown(event) {
    if (event.key == 'Enter') {
      this._updateFinished();
    }
    this.props.onKeyDown(event);
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
    let { translate, formats, units } = this.context.language;
    let { m, name } = this.props;
    let modValue = m.getChange(name);
    let isOverwrite = Modifications.modifications[name].method === 'overwrite';

    if (name === 'damagedist') {
      // We don't show damage distribution
      return null;
    }

    let inputClassNames = {
      'cb': true,
      'greyed-out': !this.props.highlight
    };

    return (
      <div onBlur={this._updateFinished.bind(this)} key={name}
        className={cn('cb', 'modification-container')}
        ref={ modItem => this.props.modItems[name] = modItem }>
        <span className={'cb'}>{translate(name, m.grp)}</span>
        <span className={'header-adjuster'}></span>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td className={'input-container'}>
                <span>
                  {this.props.editable ?
                    <NumberEditor className={cn(inputClassNames)} value={this.state.value}
                      decimals={2} style={{ textAlign: 'right' }} step={0.01}
                      stepModifier={1} onKeyDown={this._keyDown.bind(this)}
                      onValueChange={this._updateValue.bind(this)} /> :
                    <input type="text" value={formats.f2(this.state.value)}
                      disabled className={cn('number-editor', 'greyed-out')}
                      style={{ textAlign: 'right', cursor: 'inherit' }}/>
                  }
                  <span className={'unit-container'}>
                    {units[m.getStoredUnitFor(name)]}
                  </span>
                </span>
              </td>
              <td style={{ textAlign: 'center' }} className={
                modValue ?
                  isChangeValueBeneficial(name, modValue) ? 'secondary' : 'warning' :
                  ''
              }>
                {formats.f2(modValue / 100) || 0}{isOverwrite ? '' : '%'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
