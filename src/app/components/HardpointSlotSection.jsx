import React from 'react';
import SlotSection from './SlotSection';
import HardpointSlot from './HardpointSlot';
import cn from 'classnames';
import { MountFixed, MountGimballed, MountTurret } from '../components/SvgIcons';
import { stopCtxPropagation } from '../utils/UtilityFunctions';

/**
 * Hardpoint slot section
 */
export default class HardpointSlotSection extends SlotSection {

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props, context, 'hardpoints', 'hardpoints');
    this._empty = this._empty.bind(this);
    this.selectedRefId = null;
    this.firstRefId = 'emptyall';
    this.lastRefId = 'nl-F';
  }

  /**
   * Handle focus when component updates
   * @param {Object} prevProps React Component properties
   */
  componentDidUpdate(prevProps) {
    this._handleSectionFocus(prevProps,this.firstRefId, this.lastRefId);
  }

  /**
   * Empty all slots
   */
  _empty() {
    this.selectedRefId = 'emptyall';
    this.props.ship.emptyWeapons();
    this.props.onChange();
    this._close();
  }

  /**
   * Fill slots with specified module
   * @param  {string} group           Group name
   * @param  {string} mount           Mount Type - F, G, T
   * @param  {SyntheticEvent} event   Event
   */
  _fill(group, mount, event) {
    this.selectedRefId = group + '-' + mount;
    this.props.ship.useWeapon(group, mount, null, event.getModifierState('Alt'));
    this.props.onChange();
    this._close();
  }

  /**
   * Empty all on section header right click
   */
  _contextMenu() {
    this._empty();
  }

  /**
   * Generate the slot React Components
   * @return {Array} Array of Slots
   */
  _getSlots() {
    let { ship, currentMenu } = this.props;
    let { originSlot, targetSlot } = this.state;
    let slots = [];
    let hardpoints = ship.hardpoints;
    let availableModules = ship.getAvailableModules();

    for (let i = 0, l = hardpoints.length; i < l; i++) {
      let h = hardpoints[i];
      if (h.maxClass) {
        slots.push(<HardpointSlot
          key={i}
          maxClass={h.maxClass}
          availableModules={() => availableModules.getHps(h.maxClass)}
          onOpen={this._openMenu.bind(this, h)}
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
   * Generate the section drop-down menu
   * @param  {Function} translate Translate function
   * @return {React.Component}    Section menu
   */
  _getSectionMenu(translate) {
    let _fill = this._fill;

    return <div className='select hardpoint' onClick={(e) => e.stopPropagation()} onContextMenu={stopCtxPropagation}>
      <ul>
        <li className='lc' tabIndex='0' onClick={this._empty} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['emptyall'] = smRef}>{translate('empty all')}</li>
        <li className='optional-hide' style={{ textAlign: 'center', marginTop: '1em' }}>{translate('PHRASE_ALT_ALL')}</li>
      </ul>
      <div className='select-group cap'>{translate('pl')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'pl', 'F')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['pl-F'] = smRef}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'pl', 'G')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['pl-G'] = smRef}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'pl', 'T')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['pl-T'] = smRef}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('ul')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'ul', 'F')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['ul-F'] = smRef}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'ul', 'G')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['ul-G'] = smRef}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'ul', 'T')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['ul-T'] = smRef}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('bl')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'bl', 'F')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['bl-F'] = smRef}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'bl', 'G')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['bl-G'] = smRef}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'bl', 'T')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['bl-T'] = smRef}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('mc')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'mc', 'F')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['mc-F'] = smRef}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'mc', 'G')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['mc-G'] = smRef}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'mc', 'T')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['mc-T'] = smRef}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('c')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'c', 'F')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['c-F'] = smRef}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'c', 'G')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['c-G'] = smRef}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'c', 'T')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['c-T'] = smRef}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('fc')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'fc', 'F')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['fc-F'] = smRef}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'fc', 'G')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['fc-G'] = smRef}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'fc', 'T')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['fc-T'] = smRef}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('pa')}</div>
      <ul>
        <li className='lc' tabIndex='0'  onClick={_fill.bind(this, 'pa', 'F')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['pa-F'] = smRef}>{translate('pa')}</li>
      </ul>
      <div className='select-group cap'>{translate('nl')}</div>
      <ul>
        <li className='lc' tabIndex='0' onClick={_fill.bind(this, 'nl', 'F')} onKeyDown={this._keyDown} ref={smRef => this.sectionRefArr['nl-F'] = smRef}>{translate('nl')}</li>
      </ul>
    </div>;
  }

}
