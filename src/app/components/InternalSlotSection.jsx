import React from 'react';
import cn from 'classnames';
import SlotSection from './SlotSection';
import InternalSlot from './InternalSlot';
import * as ModuleUtils from '../shipyard/ModuleUtils';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import { canMount } from '../utils/SlotFunctions';

/**
 * Internal slot section
 */
export default class InternalSlotSection extends SlotSection {

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props, context, 'internal', 'optional internal');

    this._empty = this._empty.bind(this);
    this._fillWithCargo = this._fillWithCargo.bind(this);
    this._fillWithCells = this._fillWithCells.bind(this);
    this._fillWithArmor = this._fillWithArmor.bind(this);
    this._fillWithModuleReinforcementPackages = this._fillWithModuleReinforcementPackages.bind(this);
    this._fillWithFuelTanks = this._fillWithFuelTanks.bind(this);
    this._fillWithLuxuryCabins = this._fillWithLuxuryCabins.bind(this);
    this._fillWithFirstClassCabins = this._fillWithFirstClassCabins.bind(this);
    this._fillWithBusinessClassCabins = this._fillWithBusinessClassCabins.bind(this);
    this._fillWithEconomyClassCabins = this._fillWithEconomyClassCabins.bind(this);
  }

  /**
   * Empty all slots
   */
  _empty() {
    this.props.ship.emptyInternal();
    this.props.onChange();
    this._close();
  }

  /**
   * Fill all slots with cargo racks
   * @param  {SyntheticEvent} event Event
   */
  _fillWithCargo(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'cr')) {
        ship.use(slot, ModuleUtils.findInternal('cr', slot.maxClass, 'E'));
      }
    });
    this.props.onChange();
    this._close();
  }

  /**
   * Fill all slots with fuel tanks
   * @param  {SyntheticEvent} event Event
   */
  _fillWithFuelTanks(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'ft')) {
        ship.use(slot, ModuleUtils.findInternal('ft', slot.maxClass, 'C'));
      }
    });
    this.props.onChange();
    this._close();
  }

  /**
   * Fill all slots with luxury passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithLuxuryCabins(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'pcq')) {
        ship.use(slot, ModuleUtils.findInternal('pcq', Math.min(slot.maxClass, 6), 'B')); // Passenger cabins top out at 6
      }
    });
    this.props.onChange();
    this._close();
  }

  /**
   * Fill all slots with first class passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithFirstClassCabins(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'pcm')) {
        ship.use(slot, ModuleUtils.findInternal('pcm', Math.min(slot.maxClass, 6), 'C')); // Passenger cabins top out at 6
      }
    });
    this.props.onChange();
    this._close();
  }

  /**
   * Fill all slots with business class passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithBusinessClassCabins(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'pci')) {
        ship.use(slot, ModuleUtils.findInternal('pci', Math.min(slot.maxClass, 6), 'D')); // Passenger cabins top out at 6
      }
    });
    this.props.onChange();
    this._close();
  }

  /**
   * Fill all slots with economy class passenger cabins
   * @param  {SyntheticEvent} event Event
   */
  _fillWithEconomyClassCabins(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'pce')) {
        ship.use(slot, ModuleUtils.findInternal('pce', Math.min(slot.maxClass, 6), 'E')); // Passenger cabins top out at 6
      }
    });
    this.props.onChange();
    this._close();
  }

  /**
   * Fill all slots with Shield Cell Banks
   * @param  {SyntheticEvent} event Event
   */
  _fillWithCells(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    let chargeCap = 0; // Capacity of single activation
    ship.internal.forEach(function(slot) {
      if ((clobber && !(slot.m && ModuleUtils.isShieldGenerator(slot.m.grp)) || !slot.m) && canMount(ship, slot, 'scb')) {
        ship.use(slot, ModuleUtils.findInternal('scb', slot.maxClass, 'A'));
        ship.setSlotEnabled(slot, chargeCap <= ship.shieldStrength); // Don't waste cell capacity on overcharge
        chargeCap += slot.m.recharge;
      }
    });
    this.props.onChange();
    this._close();
  }

  /**
   * Fill all slots with Hull Reinforcement Packages
   * @param  {SyntheticEvent} event Event
   */
  _fillWithArmor(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'hr')) {
        ship.use(slot, ModuleUtils.findInternal('hr', Math.min(slot.maxClass, 5), 'D')); // Hull reinforcements top out at 5D
      }
    });
    this.props.onChange();
    this._close();
  }

  /**
   * Fill all slots with Module Reinforcement Packages
   * @param  {SyntheticEvent} event Event
   */
  _fillWithModuleReinforcementPackages(event) {
    let clobber = event.getModifierState('Alt');
    let ship = this.props.ship;
    ship.internal.forEach((slot) => {
      if ((clobber || !slot.m) && canMount(ship, slot, 'mrp')) {
        ship.use(slot, ModuleUtils.findInternal('mrp', Math.min(slot.maxClass, 5), 'D')); // Module reinforcements top out at 5D
      }
    });
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
    let slots = [];
    let { currentMenu, ship } = this.props;
    let { originSlot, targetSlot } = this.state;
    let { internal, fuelCapacity } = ship;
    let availableModules = ship.getAvailableModules();

    for (let i = 0, l = internal.length; i < l; i++) {
      let s = internal[i];

      slots.push(<InternalSlot
        key={i}
        maxClass={s.maxClass}
        availableModules={() => availableModules.getInts(ship, s.maxClass, s.eligible)}
        onOpen={this._openMenu.bind(this,s)}
	onChange={this.props.onChange}
        onSelect={this._selectModule.bind(this, s)}
        selected={currentMenu == s}
        eligible={s.eligible}
        m={s.m}
        drag={this._drag.bind(this, s)}
        dragOver={this._dragOverSlot.bind(this, s)}
        drop={this._drop}
        dropClass={this._dropClass(s, originSlot, targetSlot)}
        fuel={fuelCapacity}
        ship={ship}
        enabled={s.enabled ? true : false}
      />);
    }

    return slots;
  }

  /**
   * Generate the section drop-down menu
   * @param  {Function} translate Translate function
   * @param  {Function} ship      The ship
   * @return {React.Component}    Section menu
   */
  _getSectionMenu(translate, ship) {
    return <div className='select' onClick={e => e.stopPropagation()} onContextMenu={stopCtxPropagation}>
      <ul>
        <li className='lc' onClick={this._empty}>{translate('empty all')}</li>
        <li className='lc' onClick={this._fillWithCargo}>{translate('cargo')}</li>
        <li className='lc' onClick={this._fillWithCells}>{translate('scb')}</li>
        <li className='lc' onClick={this._fillWithArmor}>{translate('hr')}</li>
        <li className='lc' onClick={this._fillWithModuleReinforcementPackages}>{translate('mrp')}</li>
        <li className='lc' onClick={this._fillWithFuelTanks}>{translate('ft')}</li>
        <li className='lc' onClick={this._fillWithEconomyClassCabins}>{translate('pce')}</li>
        <li className='lc' onClick={this._fillWithBusinessClassCabins}>{translate('pci')}</li>
        <li className='lc' onClick={this._fillWithFirstClassCabins}>{translate('pcm')}</li>
	{ ship.luxuryCabins ? <li className='lc' onClick={this._fillWithLuxuryCabins}>{translate('pcq')}</li> : ''}
        <li className='optional-hide' style={{ textAlign: 'center', marginTop: '1em' }}>{translate('PHRASE_ALT_ALL')}</li>
      </ul>
    </div>;
  }

}
