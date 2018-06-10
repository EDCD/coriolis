import React from 'react';
import cn from 'classnames';
import SlotSection from './SlotSection';
import HardpointSlot from './HardpointSlot';
import { stopCtxPropagation } from '../utils/UtilityFunctions';

/**
 * Utility Slot Section
 */
export default class UtilitySlotSection extends SlotSection {

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props, context, 'utility', 'utility mounts');
    this._empty = this._empty.bind(this);
    this.selectedRefId = null;
    this.firstRefId = 'emptyall';
    this.lastRefId = 'po';
  }
  /**
   * Handle focus if the component updates
   * @param {Object} prevProps React Component properties
   */
  componentDidUpdate(prevProps) {
    this._handleSectionFocus(prevProps,this.firstRefId, this.lastRefId);
  }

  /**
   * Empty all utility slots and close the menu
   */
  _empty() {
    this.selectedRefId = this.firstRefId;
    this.props.ship.emptyUtility();
    this.props.onChange();
    this._close();
  }

  /**
   * Mount module in utility slot, replace all if Alt is held
   * @param  {string} group  Module Group name
   * @param  {string} rating Module Rating
   * @param  {string} name   Module name
   * @param  {Synthetic} event  Event
   */
  _use(group, rating, name, event) {
    this.selectedRefId = group;
    if (rating !== null) this.selectedRefId += '-' + rating;

    this.props.ship.useUtility(group, rating, name, event.getModifierState('Alt'));
    this.props.onChange();
    this._close();
  }

  /**
   * Empty all utility slots on right-click
   */
  _contextMenu() {
    this._empty();
  }

  /**
   * Create all HardpointSlots (React component) for the slots
   * @return {Array} Array of HardpointSlots
   */
  _getSlots() {
    let slots = [];
    let { ship, currentMenu } = this.props;
    let hardpoints = ship.hardpoints;
    let { originSlot, targetSlot } = this.state;
    let availableModules = ship.getAvailableModules();

    for (let i = 0, l = hardpoints.length; i < l; i++) {
      let h = hardpoints[i];
      if (h.maxClass === 0) {
        slots.push(<HardpointSlot
          key={i}
          maxClass={h.maxClass}
          availableModules={() => availableModules.getHps(h.maxClass)}
          onOpen={this._openMenu.bind(this,h)}
          onSelect={this._selectModule.bind(this, h)}
          onChange={this.props.onChange}
          selected={currentMenu == h}
          drag={this._drag.bind(this, h)}
          dragOver={this._dragOverSlot.bind(this, h)}
          drop={this._drop}
          dropClass={this._dropClass(h, originSlot, targetSlot)}
          ship={ship}
          m={h.m}
          enabled={h.enabled ? true : false}
        />);
      }
    }

    return slots;
  }

  /**
   * Generate the section menu
   * @param  {Function} translate Translate function
   * @return {React.Component}   Section menu
   */
  _getSectionMenu(translate) {
    let _use = this._use;

    return <div className='select' onClick={(e) => e.stopPropagation()} onContextMenu={stopCtxPropagation}>
      <ul>
        <li className='lc' tabIndex='0' onClick={this._empty} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['emptyall'] = smRef}>{translate('empty all')}</li>
        <li className='optional-hide' style={{ textAlign: 'center', marginTop: '1em' }}>{translate('PHRASE_ALT_ALL')}</li>
      </ul>
      <div className='select-group cap'>{translate('sb')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_use.bind(this, 'sb', 'A', null)} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['sb-A'] = smRef}>A</li>
        <li className='c' tabIndex='0' onClick={_use.bind(this, 'sb', 'B', null)} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['sb-B'] = smRef}>B</li>
        <li className='c' tabIndex='0' onClick={_use.bind(this, 'sb', 'C', null)} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['sb-C'] = smRef}>C</li>
        <li className='c' tabIndex='0' onClick={_use.bind(this, 'sb', 'D', null)} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['sb-D'] = smRef}>D</li>
        <li className='c' tabIndex='0' onClick={_use.bind(this, 'sb', 'E', null)} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['sb-E'] = smRef}>E</li>
      </ul>
      <div className='select-group cap'>{translate('hs')}</div>
      <ul>
        <li className='lc' tabIndex='0' onClick={_use.bind(this, 'hs', null, 'Heat Sink Launcher')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['hs'] = smRef}>{translate('Heat Sink Launcher')}</li>
      </ul>
      <div className='select-group cap'>{translate('ch')}</div>
      <ul>
        <li className='lc' tabIndex='0' onClick={_use.bind(this, 'ch', null, 'Chaff Launcher')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['ch'] = smRef}>{translate('Chaff Launcher')}</li>
      </ul>
      <div className='select-group cap'>{translate('po')}</div>
      <ul>
        <li className='lc' tabIndex='0' onClick={_use.bind(this, 'po', null, 'Point Defence')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['po'] = smRef}>{translate('Point Defence')}</li>
      </ul>
    </div>;
  }

}
