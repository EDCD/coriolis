import React from 'react';
import cn from 'classnames';
import Slot from './Slot';
import Persist from '../stores/Persist';
import { ListModifications, Modified, CommunityGoalSmall, TechBrokerSmall, PowerPlaySmall } from './SvgIcons';
import { Modifications } from 'coriolis-data/dist';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import { getBlueprint, blueprintTooltip } from '../utils/BlueprintFunctions';
import * as _ from 'lodash';

/**
 * Internal Slot
 */
export default class InternalSlot extends Slot {

  /**
   * Get the availability icon for a module (CG, Tech Broker, or PowerPlay)
   * @param  {Object} mod The module
   * @return {React.Component} Icon component or null
   */
  _getAvailabilityIcon(mod) {
    if (!mod) return null;

    // Check for PowerPlay modules first
    if (mod.powerplay === 'True' || mod.powerplay === true) {
      return <PowerPlaySmall className='powerplay' />;
    }

    // Then check for pre-engineered modules (CG or Tech Broker)
    if (!mod.preEngineered) return null;

    if (mod.preEngineered.availability === 'CG') {
      return <CommunityGoalSmall className='community' />;
    }

    if (typeof mod.preEngineered.availability === 'undefined') {
      return <TechBrokerSmall className='techbroker' />;
    }

    return null;
  }

  /**
   * Generate the slot contents
   * @param  {Object} m             Mounted Module
   * @param  {Boolean} enabled      Slot enabled
   * @param  {Function} translate   Translate function
   * @param  {Object} formats       Localized Formats map
   * @param  {Object} u             Localized Units Map
   * @return {React.Component}      Slot contents
   */
  _getSlotDetails(m, enabled, translate, formats, u) {
    if (m) {
      let classRating = m.class + m.rating;
      let { drag, drop, ship } = this.props;
      let { termtip, tooltip } = this.context;
      let validMods = (Modifications.modules[m.grp] ? Modifications.modules[m.grp].modifications : []);
      let showModuleResistances = Persist.showModuleResistances();
      // Check if module has engineering disabled
      let canBeEngineered = m.engineering !== false && m.engineering !== 'False';
      // Show modifications button if there are available modifications OR if module has a blueprint/mods applied
      // But only if engineering is not explicitly disabled for this module
      let hasModifications = canBeEngineered && (validMods.length > 0 || (m.blueprint && m.blueprint.name) || (m.mods && Object.keys(m.mods).length > 0));

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

      let cgttip = '';
      // Get availability icon (CG, Tech Broker, or PowerPlay)
      const availabilityIcon = this._getAvailabilityIcon(m);
      if (m && (m.powerplay === 'True' || m.powerplay === true)) {
        cgttip = 'PowerPlay Module';
      }
      else if (m && m.preEngineered && m.preEngineered.availability === 'CG') {
        cgttip = 'Community Goal Module';
      }
      else if (m && m.preEngineered && m.preEngineered.availability === undefined) {
        cgttip = 'Tech Broker Module';
      }

      let mass = m.getMass() || m.get('cargo') || m.fuel || 0;
      if (m.cargo) mass = Math.floor(mass);  // Cargo capacity is always an integer
      const className = cn('details', enabled ? '' : 'disabled');

      return <div className={className} draggable='true' onDragStart={drag} onDragEnd={drop}>
        <div className={'cb'}>
          <div className={'l'}>
            {availabilityIcon ?  <span onMouseOver={termtip.bind(null, cgttip)}
                                               onMouseOut={tooltip.bind(null, null)}>{availabilityIcon}</span> : ''}{classRating} {translate(m.name || m.grp)}{m.mods && Object.keys(m.mods).length > 0 ? <span onMouseOver={termtip.bind(null, modTT)} onMouseOut={tooltip.bind(null, null)}><Modified />{m.blueprint && m.blueprint.grade ? <sub className='eng-grade'>{m.blueprint.grade}</sub> : null}</span> : ''}</div>
          <div className={'r'}>{formats.round(mass)}{u.T}</div>
        </div>
        <div className={'cb'}>
          { m.getOptMass() ? <div className={'l'}>{translate('optmass', 'sg')}: {formats.int(m.getOptMass())}{u.T}</div> : null }
          { m.getMaxMass() ? <div className={'l'}>{translate('maxmass', 'sg')}: {formats.int(m.getMaxMass())}{u.T}</div> : null }
          { m.bins ? <div className={'l'}>{m.bins} <u>{translate('bins')}</u></div> : null }
          { m.bays ? <div className={'l'}>{translate('bays')}: {m.bays}</div> : null }
          { m.rebuildsperbay ? <div className={'l'}>{translate('rebuildsperbay')}: {m.rebuildsperbay}</div> : null }
          { m.rate ? <div className={'l'}>{translate('rate')}: {m.rate}{u.kgs}&nbsp;&nbsp;&nbsp;{translate('refuel time')}: {formats.time(this.props.fuel * 1000 / m.rate)}</div> : null }
          { m.getAmmo() && m.grp !== 'scb' ? <div className={'l'}>{translate('ammunition')}: {formats.gen(m.getAmmo())}</div> : null }
          { m.getSpinup() ? <div className={'l'}>{translate('spinup')}: {formats.f1(m.getSpinup())}{u.s}</div> : null }
          { m.getDuration() ? <div className={'l'}>{translate('duration')}: {formats.f1(m.getDuration())}{u.s}</div> : null }
          { m.grp === 'scb' ? <div className={'l'}>{translate('cells')}: {formats.int(m.getAmmo() + 1)}</div> : null }
          { m.grp === 'gsrp' ? <div className={'l'}>{translate('shield addition')}: {formats.f1(m.getShieldAddition())}{u.MJ}</div> : null }
          { m.grp === 'gfsb' ? <div className={'l'}>{translate('jump addition')}: {formats.f1(m.getJumpBoost())}{u.LY}</div> : null }
          { m.grp === 'gs' ? <div className={'l'}>{translate('shield addition')}: {formats.f1(m.getShieldAddition())}{u.MJ}</div> : null }
          { m.getShieldReinforcement() ? <div className={'l'}>{translate('shieldreinforcement')}: {formats.f1(m.getDuration() * m.getShieldReinforcement())}{u.MJ}</div> : null }
          { m.getShieldReinforcement() ? <div className={'l'}>{translate('total')}: {formats.int((m.getAmmo() + 1) * (m.getDuration() * m.getShieldReinforcement()))}{u.MJ}</div> : null }
          { m.repair ? <div className={'l'}>{translate('repair')}: {m.repair}</div> : null }
          { m.getFacingLimit() ? <div className={'l'}>{translate('facinglimit')} {formats.f1(m.getFacingLimit())}°</div> : null }
          { m.getRange() ? <div className={'l'}>{translate('range')} {formats.f2(m.getRange())}{u.km}</div> : null }
          { m.getRangeT() ? <div className={'l'}>{translate('ranget')} {formats.f1(m.getRangeT())}{u.s}</div> : null }
          { m.getTime() ? <div className={'l'}>{translate('time')}: {formats.time(m.getTime())}</div> : null }
          { m.getHackTime() ? <div className={'l'}>{translate('hacktime')}: {formats.time(m.getHackTime())}</div> : null }
          { m.maximum ? <div className={'l'}>{translate('max')}: {(m.maximum)}</div> : null }
          { m.rangeLS ? <div className={'l'}>{translate('range')}: {m.rangeLS}{u.Ls}</div> : null }
          { m.rangeLS === null ? <div className={'l'}>∞{u.Ls}</div> : null }
          { m.rangeRating ? <div className={'l'}>{translate('range')}: {m.rangeRating}</div> : null }
          { m.passengers ? <div className={'l'}>{translate('passengers')}: {m.passengers}</div> : null }
          { m.getRegenerationRate() ? <div className='l'>{translate('regen')}: {formats.round1(m.getRegenerationRate())}{u.ps}</div> : null }
          { m.getBrokenRegenerationRate() ? <div className='l'>{translate('brokenregen')}: {formats.round1(m.getBrokenRegenerationRate())}{u.ps}</div> : null }
          { showModuleResistances && m.getExplosiveResistance() ? <div className='l'>{translate('explres')}: {formats.pct(m.getExplosiveResistance())}</div> : null }
          { showModuleResistances && m.getKineticResistance() ? <div className='l'>{translate('kinres')}: {formats.pct(m.getKineticResistance())}</div> : null }
          { showModuleResistances && m.getThermalResistance() ? <div className='l'>{translate('thermres')}: {formats.pct(m.getThermalResistance())}</div> : null }
          { showModuleResistances && m.getCausticResistance() ? <div className='l'>{translate('causres')}: {formats.pct(m.getCausticResistance())}</div> : null }
          { m.getHullReinforcement() ? <div className='l'>{translate('armour')}: {formats.int(m.getHullReinforcement() + ship.baseArmour * m.getModValue('hullboost') / 10000)}</div> : null }
          { m.getProtection() ? <div className='l'>{translate('protection')}: {formats.rPct(m.getProtection())}</div> : null }
          { m.getIntegrity() ? <div className='l'>{translate('integrity')}: {formats.int(m.getIntegrity())}</div> : null }
          { m.getInfo() ? <div className='l'>{translate(m.getInfo())}</div> : null }
	  { m && hasModifications ? <div className='r' tabIndex="0" ref={ modButton => this.modButton = modButton }><button tabIndex="-1" onClick={(e) => this._toggleModifications(e)} onContextMenu={stopCtxPropagation} onMouseOver={termtip.bind(null, 'modifications')} onMouseOut={tooltip.bind(null, null)}><ListModifications /></button></div> : null }
        </div>
      </div>;
    } else {
      return <div className={'empty'}>{translate('empty')}</div>;
    }
  }
}
