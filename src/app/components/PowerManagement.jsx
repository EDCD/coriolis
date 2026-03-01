import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import TranslatedComponent from './TranslatedComponent';
import PowerBands from './PowerBands';
import { slotName, slotComparator } from '../utils/SlotFunctions';
import { Power, NoPower } from './SvgIcons';

const POWER = [
  null,
  null,
  <NoPower className='icon warning' />,
  <Power className='secondary-disabled' />
];

/**
 * Power Management Section
 */
export default class PowerManagement extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired,
    code: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    this._renderPowerRows = this._renderPowerRows.bind(this);
    this._updateWidth = this._updateWidth.bind(this);
    this._sort = this._sort.bind(this);

    this.state = {
      predicate: 'pwr',
      desc: false,
      width: 0
    };
  }

  /**
   * Set the sort order and sort
   * @param  {string} predicate Sort predicate
   */
  _sortOrder(predicate) {
    let desc = this.state.desc;

    if (predicate == this.state.predicate) {
      desc = !desc;
    } else {
      desc = true;
    }

    this._sort(this.props.ship, predicate, desc);
    this.setState({ predicate, desc });
  }

  /**
   * Sorts the power list
   * @param  {Ship} ship          Ship instance
   * @param  {string} predicate   Sort predicate
   * @param  {Boolean} desc       Sort order descending
   */
  _sort(ship, predicate, desc) {
    let powerList = ship.powerList;
    let comp = slotComparator.bind(null, this.context.language.translate);

    switch (predicate) {
      case 'n': comp = comp(null, desc); break;
      case 't': comp = comp((a, b) => a.type.localeCompare(b.type), desc); break;
      case 'pri': comp = comp((a, b) => a.priority - b.priority, desc); break;
      case 'pwr': comp = comp((a, b) => a.m.getPowerUsage() - b.m.getPowerUsage(), desc); break;
      case 'r': comp = comp((a, b) => ship.getSlotStatus(a) - ship.getSlotStatus(b), desc); break;
      case 'd': comp = comp((a, b) => ship.getSlotStatus(a, true) - ship.getSlotStatus(b, true), desc); break;
    }

    powerList.sort(comp);
  }

  /**
   * Update slot priority
   * @param  {Object} slot Slot model
   * @param  {number} inc  increment / decrement
   */
  _priority(slot, inc) {
    if (this.props.ship.setSlotPriority(slot, slot.priority + inc)) {
      this.props.onChange();
    }
  }

  /**
   * Toggle slot active/inactive
   * @param  {Object} slot Slot model
   */
  _toggleEnabled(slot) {
    this.props.ship.setSlotEnabled(slot, !slot.enabled);
    this.props.onChange();
  }

  /**
   * Generate/Render table rows
   * @param  {Ship} ship          Ship instance
   * @param  {Function} translate Translate function
   * @param  {Function} pwr       Localized Power formatter
   * @param  {Function} pct       Localized Percent formatter
   * @return {Array}              Array of React.Component table rows
   */
  _renderPowerRows(ship, translate, pwr, pct) {
    let powerRows = [];

    for (let i = 0, l = ship.powerList.length; i < l; i++) {
      let slot = ship.powerList[i];

      if (slot.m && slot.m.getPowerUsage() > 0) {
        let m = slot.m;
        let toggleEnabled = this._toggleEnabled.bind(this, slot);
        let retractedElem = null, deployedElem = null;

        if (slot.enabled) {
          retractedElem = <td className='ptr upp' onClick={toggleEnabled}>{POWER[ship.getSlotStatus(slot, false)]}</td>;
          deployedElem = <td className='ptr upp' onClick={toggleEnabled}>{POWER[ship.getSlotStatus(slot, true)]}</td>;
        } else {
          retractedElem = <td className='ptr disabled upp' colSpan='2' onClick={toggleEnabled}>{translate('disabled')}</td>;
        }

        // If this is a Guardian Shield Reinforcement Package or Guardian Hull Reinforcement Package, or Guardian Module Reinforcement Package, it cannot change priority
        let priorityField;
        if (m.symbol) {
          if (m.symbol.match(/GuardianShield/i) || m.symbol.match(/GuardianHull/i) || m.symbol.match(/GuardianModule/i)) {
            priorityField = <td>1</td>;
          } else {
            priorityField = <td>
            <span className='flip ptr btn' onClick={this._priority.bind(this, slot, -1)}>&#9658;</span>
            {' ' + (slot.priority + 1) + ' '}
            <span className='ptr btn' onClick={this._priority.bind(this, slot, 1)}>&#9658;</span>
          </td>;
          }
        }
        else {
          priorityField = <td>
          <span className='flip ptr btn' onClick={this._priority.bind(this, slot, -1)}>&#9658;</span>
          {' ' + (slot.priority + 1) + ' '}
          <span className='ptr btn' onClick={this._priority.bind(this, slot, 1)}>&#9658;</span>
        </td>;
        }
        powerRows.push(<tr key={i} className={cn('highlight', { disabled: !slot.enabled })}>
          <td className='ptr' style={{ width: '1em' }} onClick={toggleEnabled}>{m.class + m.rating}</td>
          <td className='ptr le shorten cap' onClick={toggleEnabled}>{slotName(translate, slot)}</td>
          <td className='ptr' onClick={toggleEnabled}><u>{translate(slot.type)}</u></td>
          {priorityField}
          <td className='ri ptr' style={{ width: '3.25em' }} onClick={toggleEnabled}>{pwr(m.getPowerUsage())}</td>
          <td className='ri ptr' style={{ width: '3em' }} onClick={toggleEnabled}><u>{pct(m.getPowerUsage() / ship.powerAvailable)}</u></td>
          {retractedElem}
          {deployedElem}
        </tr>);
      }
    }
    return powerRows;
  }

  /**
   * Update power bands width from DOM
   */
  _updateWidth() {
    this.setState({ width: this.node.offsetWidth });
  }

  /**
   * Add listeners when about to mount and sort power list
   */
  UNSAFE_componentWillMount() {
    this._sort(this.props.ship, this.state.predicate, this.state.desc);
    this.resizeListener = this.context.onWindowResize(this._updateWidth);
  }

  /**
   * Trigger DOM updates on mount
   */
  componentDidMount() {
    this._updateWidth();
  }

  /**
   * Sort power list if the ship instance has changed
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextState   Incoming/Next state
   */
  UNSAFE_componentWillUpdate(nextProps, nextState) {
    if (this.props.ship != nextProps.ship) {
      this._sort(nextProps.ship, nextState.predicate, nextState.desc);
    }
  }

  /**
   * Remove listeners on unmount
   */
  componentWillUnmount() {
    this.resizeListener.remove();
  }

  /**
   * Render power management section
   * @return {React.Component} contents
   */
  render() {
    let { ship, code } = this.props;
    let { translate, formats } = this.context.language;
    let pwr = formats.f2;
    let pp = ship.standard[0].m;
    let sortOrder = this._sortOrder;

    return (
      <div ref={node => this.node = node} className='group half' id='componentPriority'>
        <table style={{ width: '100%' }}>
          <thead>
            <tr className='main'>
              <th colSpan='2' className='sortable le' onClick={sortOrder.bind(this, 'n')} >{translate('module')}</th>
              <th style={{ width: '3em' }} className='sortable' onClick={sortOrder.bind(this, 't')} >{translate('type')}</th>
              <th style={{ width: '4em' }} className='sortable' onClick={sortOrder.bind(this, 'pri')} >{translate('pri')}</th>
              <th colSpan='2' className='sortable' onClick={sortOrder.bind(this, 'pwr')} >{translate('PWR')}</th>
              <th style={{ width: '3em' }} className='sortable' onClick={sortOrder.bind(this, 'r')} >{translate('ret')}</th>
              <th style={{ width: '3em' }} className='sortable' onClick={sortOrder.bind(this, 'd')} >{translate('dep')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{pp.class + pp.rating}</td>
              <td className='le shorten cap' >{translate('pp')}</td>
              <td><u >{translate('SYS')}</u></td>
              <td>1</td>
              <td className='ri'>{pwr(pp.getPowerGeneration())}</td>
              <td className='ri'><u>100%</u></td>
              <td></td>
              <td></td>
            </tr>
            <tr><td style={{ lineHeight:0 }} colSpan='8'><hr style={{ margin: '0 0 3px', background: '#ff8c0d', border: 0, height: 1 }} /></td></tr>
            {this._renderPowerRows(ship, translate, pwr, formats.pct1)}
          </tbody>
        </table>
        <PowerBands width={this.state.width} code={code} available={pp.getPowerGeneration()} bands={ship.priorityBands} />
      </div>
    );
  }
}
