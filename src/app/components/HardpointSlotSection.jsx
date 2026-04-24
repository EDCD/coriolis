import React from 'react';
import SlotSection from './SlotSection';
import HardpointSlot from './HardpointSlot';
import { MountFixed, MountGimballed, MountTurret } from '../components/SvgIcons';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import CategoryMenu from './CategoryMenu';
import AvailableModulesMenu from './AvailableModulesMenu';
import ModificationsMenu from './ModificationsMenu';
import * as ModuleUtils from '../shipyard/ModuleUtils';

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
    this.state = {
      selectedCategory: null,
      originSlot: null,
      targetSlot: null
    };
    this._onCategorySelect = this._onCategorySelect.bind(this);
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
    this._close();
    this.props.ship.emptyWeapons();
    this.props.onChange();
  }

  /**
   * Fill slots with specified module
   * @param  {string} group           Group name
   * @param  {string} mount           Mount Type - F, G, T
   * @param  {SyntheticEvent} event   Event
   */
  _fill(group, mount, event) {
    this.selectedRefId = group + '-' + mount;
    let alt = event.getModifierState && event.getModifierState('Alt');
    this._close();
    this.props.ship.useWeapon(group, mount, null, alt);
    this.props.onChange();
  }

  /**
   * Empty all on section header right click
   */
  _contextMenu() {
    this._empty();
  }

  /**
   * Open a menu for a slot and reset the selected category
   * @param  {Object} slot    The slot object
   * @param  {Object} event   The event
   */
  _openMenu(slot, event) {
    event.stopPropagation();
    event.persist();

    // Don't reset state if this is the same slot being re-selected
    if (this.props.currentMenu === slot) {
      super._openMenu(slot, event);
    } else {
      // Reset state when opening a different slot
      this.setState({
        selectedCategory: null
      }, () => {
        super._openMenu(slot, event);
      });
    }
  }

  /**
   * Generate the menu for a given slot
   * @param  {Object} slot             Slot model
   * @param  {Function} onSelect       Select callback
   * @param  {Function} warningFunc    Warning function
   * @param  {ModuleSet} availableModules Available modules
   * @return {React.Component} The menu component
   */
  _getMenu(slot, onSelect, warningFunc, availableModules) {
    const { ship } = this.props;
    const { selectedCategory } = this.state;
    const availableModuleGroups = availableModules.getHps(slot.maxClass);

    if (slot.m === null && selectedCategory === null) {
      const categoriesForSlot = ModuleUtils.getHpCategoriesForSlot(slot);
      return <CategoryMenu
        className='hardpoint'
        categories={categoriesForSlot}
        onSelect={this._onCategorySelect.bind(this, onSelect)}
        onClose={this._close}
      />;
    } else {
      return <AvailableModulesMenu
        ship={ship}
        slot={slot}
        m={slot.m}
        modules={availableModuleGroups}
        onSelect={onSelect}
        activeSlotId={slot.id}
        warning={warningFunc}
        onClose={this._close}
        selectedCategory={selectedCategory}
      />;
    }
  }

  /**
   * Set the selected category
   * @param {Function} onSelect The onSelect function from the parent Slot
   * @param {string} category The selected category
   */
  _onCategorySelect(onSelect, category) {
    this.setState({ selectedCategory: category });
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

      if (h.maxClass) { // Only show hardpoints, not utility mounts
        slots.push(<HardpointSlot
          key={i}
          maxClass={h.maxClass}
          availableModules={() => availableModules.getHps(ship, h.maxClass, h.eligible)}
          onOpen={this._openMenu.bind(this, h)}
          onSelect={this._selectModule.bind(this, h)}
          onChange={this.props.onChange}
          selected={currentMenu == h}
          eligible={!!h.eligible}
          slot={h}
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
        <li className='lc' tabIndex='0' onClick={this._empty} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('emptyall', smRef);
          }
        }}>{translate('empty all')}</li>
        <li className='optional-hide' style={{ textAlign: 'center', marginTop: '1em' }}>{translate('PHRASE_ALT_ALL')}</li>
      </ul>
      <div className='select-group cap'>{translate('pl')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'pl', 'F')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('pl-F', smRef);
          }
        }}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'pl', 'G')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('pl-G', smRef);
          }
        }}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'pl', 'T')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('pl-T', smRef);
          }
        }}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('ul')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'ul', 'F')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('ul-F', smRef);
          }
        }}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'ul', 'G')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('ul-G', smRef);
          }
        }}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'ul', 'T')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('ul-T', smRef);
          }
        }}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('bl')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'bl', 'F')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('bl-F', smRef);
          }
        }}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'bl', 'G')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('bl-G', smRef);
          }
        }}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'bl', 'T')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('bl-T', smRef);
          }
        }}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('mc')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'mc', 'F')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('mc-F', smRef);
          }
        }}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'mc', 'G')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('mc-G', smRef);
          }
        }}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'mc', 'T')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('mc-T', smRef);
          }
        }}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('c')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'c', 'F')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('c-F', smRef);
          }
        }}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'c', 'G')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('c-G', smRef);
          }
        }}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'c', 'T')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('c-T', smRef);
          }
        }}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('fc')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'fc', 'F')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('fc-F', smRef);
          }
        }}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'fc', 'G')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('fc-G', smRef);
          }
        }}><MountGimballed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'fc', 'T')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('fc-T', smRef);
          }
        }}><MountTurret className='lg'/></li>
      </ul>
      <div className='select-group cap'>{translate('pa')}</div>
      <ul>
        <li className='lc' tabIndex='0'  onClick={_fill.bind(this, 'pa', 'F')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('pa-F', smRef);
          }
        }}>{translate('pa')}</li>
      </ul>
      <div className='select-group cap'>{translate('rg')}</div>
      <ul>
        <li className='lc' tabIndex='0'  onClick={_fill.bind(this, 'rg', 'F')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('rg-F', smRef);
          }
        }}>{translate('rg')}</li>
      </ul>
      <div className='select-group cap'>{translate('nl')}</div>
      <ul>
        <li className='lc' tabIndex='0' onClick={_fill.bind(this, 'nl', 'F')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('nl-F', smRef);
          }
        }}>{translate('nl')}</li>
      </ul>
      <div className='select-group cap'>{translate('rfl')}</div>
      <ul>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'rfl', 'F')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('rfl-F', smRef);
          }
        }}><MountFixed className='lg'/></li>
        <li className='c' tabIndex='0' onClick={_fill.bind(this, 'rfl', 'T')} onKeyDown={this._keyDown} ref={smRef => {
          if (smRef) {
            this.sectionRefMap.set('rfl-T', smRef);
          }
        }}><MountTurret className='lg'/></li>
      </ul>
    </div>;
  }

}
