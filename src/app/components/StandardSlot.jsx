import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import Persist from '../stores/Persist';
import TranslatedComponent from './TranslatedComponent';
import { diffDetails } from '../utils/SlotFunctions';
import AvailableModulesMenu from './AvailableModulesMenu';
import ModificationsMenu from './ModificationsMenu';
import * as ModuleUtils from '../shipyard/ModuleUtils';
import { ListModifications, Modified } from './SvgIcons';
import { Modifications } from 'coriolis-data/dist';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import { getBlueprint, blueprintTooltip } from '../utils/BlueprintFunctions';

/**
 * Standard Slot
 */
export default class StandardSlot extends TranslatedComponent {

  static propTypes = {
    slot: PropTypes.object,
    modules: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    ship: PropTypes.object.isRequired,
    selected: PropTypes.bool,
    warning: PropTypes.func,
  };

  /**
   * Construct the slot
   * @param {object} props Object properties
   */
  constructor(props) {
    super(props);
    this._modificationsSelected = false;
    this._keyDown = this._keyDown.bind(this);
    this._eligible = this._eligible.bind(this);
    this.modButton = null;
    this.slotDiv = null;
  }

  /**
   * Check if a module is eligible for this slot
   * @param {object} module The module to check
   * @return {boolean} Whether the module can be mounted
   */
  _eligible(module) {
    // For standard slots, check if the module class fits
    if (!module) return true;
    return module.class <= this.props.slot.maxClass;
  }

  /**
   * Handle Enter key
   * @param {SyntheticEvent} event KeyDown event
   */
  _keyDown(event) {
    if (event.key == 'Enter') {
      if(event.target.className == 'r') {
        this._toggleModifications();
      }
      this.props.onOpen(event);
    }
  }

  /**
   * Render the slot
   * @return {React.Component} Slot component
   */
  render() {
    let { termtip, tooltip } = this.context;
    let { translate, formats, units } = this.context.language;
    let { modules, slot, selected, warning, onSelect, onChange, ship } = this.props;
    let m = slot.m;
    let classRating = m.class + m.rating;
    let menu;
    let validMods = m == null || !Modifications.modules[m.grp] ? [] : (Modifications.modules[m.grp].modifications || []);
    // Check if module has engineering disabled
    let canBeEngineered = m && m.engineering !== false && m.engineering !== 'False';
    if (m && m.name && m.name === 'Guardian Hybrid Power Plant') {
      validMods = [];
    }
    if (m && m.name && m.name === 'Guardian Power Distributor') {
      validMods = [];
    }
    let showModuleResistances = Persist.showModuleResistances();
    let mass = m.getMass() || m.cargo || m.fuel || 0;

    // Modifications tooltip shows blueprint and grade, if available
      let modTT = translate('modified');
      if (m && m.blueprint && m.blueprint.name) {
        if (m.preEngineered && m.preEngineered.blueprints) {
          const blueprintNames = _.split(m.preEngineered.blueprints, ',');
          const blueprints = blueprintNames.map(name => getBlueprint(name.trim(), m));
          const blueprintHeader = blueprints.map(bp => <div className='blueprintList' key={bp.name}>{`Blueprint: ${translate(bp.name)} ${translate('Grade:')} ${m.preEngineered.grade}`}</div>);

          if (m.blueprint.special && m.blueprint.special.id >= 0) {
            blueprintHeader.push(<div className='blueprintList' key={m.blueprint.special.name}>{`Experimental: ${translate(m.blueprint.special.name)}`}</div>);
          }
          const blueprintGrades = blueprints.map(bp => bp.grades[m.preEngineered.grade]);
          modTT = (
            <div>
              {blueprintHeader}
              {blueprintTooltip(translate, blueprintGrades, null, m.grp, m)}
            </div>
          );
        } else {
          const blueprintHeader = [];
          blueprintHeader.push(<div className='blueprintList' key={m.blueprint.name}>{`Blueprint: ${translate(m.blueprint.name)} ${translate('grade')} ${m.blueprint.grade}`}</div>);
          if (m.blueprint.special && m.blueprint.special.id >= 0) {
            blueprintHeader.push(<div className='blueprintList' key={m.blueprint.special.name}>{`Experimental: ${translate(m.blueprint.special.name)}`}</div>);
          }
          modTT = (
            <div>
              {blueprintHeader}
              {blueprintTooltip(translate, [m.blueprint.grades[m.blueprint.grade]], null, m.grp, m)}
            </div>
          );
        }
      }

    if (!selected) {
      // If not selected then sure that modifications flag is unset
      this._modificationsSelected = false;
    }

    // If this is a missing module, therefore has the 'info' field, set the warning value on the module to be true when loaded.
    if (m.info) {
      warning = () => true;
    }

    const modificationsMarker = JSON.stringify(m);

    if (selected) {
      if (this._modificationsSelected) {
        menu = <ModificationsMenu
          className='standard'
          onChange={onChange}
          ship={ship}
          m={m}
          marker={modificationsMarker}
          modButton = {this.modButton}
        />;
      } else {
        menu = <AvailableModulesMenu
          className='standard'
          modules={modules}
          m={m}
          ship={ship}
          onSelect={onSelect}
          warning={warning}
          diffDetails={diffDetails.bind(ship, this.context.language)}
          eligible={this._eligible}
          slot={slot} // Add this line to pass slot restriction info
          slotDiv = {this.slotDiv}
          activeSlotId={slot.id}
        />;
      }
    }

    return (
      <div className={cn('slot', { selected: this.props.selected })} onClick={this.props.onOpen} onKeyDown={this._keyDown} onContextMenu={stopCtxPropagation} tabIndex="0" ref={ slotDiv => this.slotDiv = slotDiv }>
        <div className={cn('details-container', { warning: warning && warning(slot.m), disabled: m.grp !== 'bh' && !slot.enabled })}>
          <div className={'sz'}>{m.grp == 'bh' ? m.name.charAt(0) : slot.maxClass}</div>
          <div>
            <div className={'l'}>{classRating} {m.getInfo() ? translate(m.ukName) : translate(m.name || m.grp)}{m.mods && Object.keys(m.mods).length > 0 ? <span className='r' onMouseOver={termtip.bind(null, modTT)} onMouseOut={tooltip.bind(null, null)}><Modified /></span> : null }</div>
            <div className={'r'}>{formats.round(mass)}{units.T}</div>
	    <div/>
            <div className={'cb'}>
                { m.getMinMass() ? <div className='l'>{translate('minmass')}: {formats.int(m.getMinMass())}{units.T}</div> : null }
                { m.getOptMass() ? <div className='l'>{translate('optmass')}: {formats.int(m.getOptMass())}{units.T}</div> : null }
                { m.getMaxMass() ? <div className='l'>{translate('maxmass')}: {formats.int(m.getMaxMass())}{units.T}</div> : null }
                { m.getOptMul() ? <div className='l'>{translate('optmul')}: {formats.rPct(m.getOptMul())}</div> : null }
                { m.getRange() ? <div className='l'>{translate('range', m.grp)}: {formats.f2(m.getRange())}{units.km}</div> : null }
                { m.time ? <div className='l'>{translate('time')}: {formats.time(m.time)}</div> : null }
                { m.getThermalEfficiency() ? <div className='l'>{translate('efficiency')}: {formats.f2(m.getThermalEfficiency())}</div> : null }
                { m.getPowerGeneration() > 0 ? <div className='l'>{translate('pgen')}: {formats.f1(m.getPowerGeneration())}{units.MW}</div> : null }
                { m.getMaxFuelPerJump() ? <div className='l'>{translate('max')} {translate('fuel')}: {formats.f1(m.getMaxFuelPerJump())}{units.T}</div> : null }
                { m.getWeaponsCapacity() ? <div className='l'>{translate('WEP')}: {formats.f1(m.getWeaponsCapacity())}{units.MJ} / {formats.f1(m.getWeaponsRechargeRate())}{units.MW}</div> : null }
                { m.getSystemsCapacity() ? <div className='l'>{translate('SYS')}: {formats.f1(m.getSystemsCapacity())}{units.MJ} / {formats.f1(m.getSystemsRechargeRate())}{units.MW}</div> : null }
                { m.getEnginesCapacity() ? <div className='l'>{translate('ENG')}: {formats.f1(m.getEnginesCapacity())}{units.MJ} / {formats.f1(m.getEnginesRechargeRate())}{units.MW}</div> : null }
                { showModuleResistances && m.getExplosiveResistance() ? <div className='l'>{translate('explres')}: {formats.pct(m.getExplosiveResistance())}</div> : null }
                { showModuleResistances && m.getKineticResistance() ? <div className='l'>{translate('kinres')}: {formats.pct(m.getKineticResistance())}</div> : null }
                { showModuleResistances && m.getThermalResistance() ? <div className='l'>{translate('thermres')}: {formats.pct(m.getThermalResistance())}</div> : null }
                { m.getIntegrity() ? <div className='l'>{translate('integrity')}: {formats.int(m.getIntegrity())}</div> : null }
                { m.getInfo() ? <div className='l'>{translate(m.getInfo())}</div> : null }
	        { m.getInfo() ? <div className='r'></div> : canBeEngineered && validMods.length > 0 ? <div className='r' tabIndex="0" ref={ modButton => this.modButton = modButton }><button  tabIndex="-1" onClick={(e) => this._toggleModifications(e)} onContextMenu={stopCtxPropagation} onMouseOver={termtip.bind(null, 'modifications')} onMouseOut={tooltip.bind(null, null)}><ListModifications /></button></div> : null }
            </div>
          </div>
        </div>
        <div className={cn('menu-section-wrapper', { open: selected && menu })}>
          {menu}
        </div>
      </div>
    );
  }

  /**
   * Toggle the modifications flag when selecting the modifications icon
   * @param {SyntheticEvent} event Event (optional)
   */
  _toggleModifications(event) {
    // Clear any lingering tooltip (e.g. from experimental effects)
    if (this.context.tooltip) {
      this.context.tooltip(null);
    }

    if (this.props.selected && this._modificationsSelected) {
      // Closing engineering menu — reset the flag and let the click
      // bubble up to onOpen, which will deselect the slot entirely
      this._modificationsSelected = false;
      return;
    }

    // Opening engineering menu
    this._modificationsSelected = true;

    // If slot is already selected, stop propagation and just force update
    // Otherwise let it bubble to select the slot first
    if (this.props.selected) {
      if (event) {
        event.stopPropagation();
      }
      this.forceUpdate();
    }
    // If not selected, let the event bubble so slot gets selected
    // and when it re-renders, _modificationsSelected will be true
  }
}
