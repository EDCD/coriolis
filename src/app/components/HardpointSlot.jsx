import React from 'react';
import cn from 'classnames';
import Slot from './Slot';
import Persist from '../stores/Persist';
import {
  DamageAbsolute,
  DamageKinetic,
  DamageThermal,
  DamageExplosive,
  MountFixed,
  MountGimballed,
  MountTurret,
  ListModifications,
  Modified,
  CommunityGoalSmall,
  TechBrokerSmall,
  PowerPlaySmall
} from './SvgIcons';
import { Modifications } from 'coriolis-data/dist';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import { getBlueprint, blueprintTooltip } from '../utils/BlueprintFunctions';

/**
 * Hardpoint / Utility Slot
 */
export default class HardpointSlot extends Slot {


  /**
   * Get the CSS class name for the slot.
   * @return {string} CSS Class name
   */
  _getClassNames() {
    return this.props.maxClass > 0 ? 'hardpoint' : null;
  }

  /**
   * Get the label for the slot
   * @param  {Function} translate   Translate function
   * @return {string}               Label
   */
  _getMaxClassLabel(translate) {
    return translate(['U', 'S', 'M', 'L', 'H'][this.props.maxClass]);
  }



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
      let classRating = `${m.class}${m.rating}${m.missile ? '/' + m.missile : ''}`;
      let { drag, drop } = this.props;
      let { termtip, tooltip } = this.context;
      let validMods = Modifications.modules[m.grp] ? (Modifications.modules[m.grp].modifications || []) : [];
      let showModuleResistances = Persist.showModuleResistances();
      // Check if module has engineering disabled (e.g., Mk II Plasma Shock Accelerator)
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

      const className = cn('details', enabled ? '' : 'disabled');
      return <div className={className} draggable='true' onDragStart={drag} onDragEnd={drop}>
        <div className={'cb'}>
          <div className={'l'}>
            {availabilityIcon ? <span onMouseOver={termtip.bind(null, cgttip)}
                                               onMouseOut={tooltip.bind(null, null)}>{availabilityIcon}</span> : ''}
            {m.mount && m.mount == 'F' ? <span onMouseOver={termtip.bind(null, 'fixed')}
                                               onMouseOut={tooltip.bind(null, null)}><MountFixed/></span> : ''}
            {m.mount && m.mount == 'G' ? <span onMouseOver={termtip.bind(null, 'gimballed')}
                                               onMouseOut={tooltip.bind(null, null)}><MountGimballed/></span> : ''}
            {m.mount && m.mount == 'T' ? <span onMouseOver={termtip.bind(null, 'turreted')}
                                               onMouseOut={tooltip.bind(null, null)}><MountTurret/></span> : ''}
            {m.getDamageDist() && m.getDamageDist().K ? <span onMouseOver={termtip.bind(null, 'kinetic')}
                                                              onMouseOut={tooltip.bind(null, null)}><DamageKinetic/></span> : ''}
            {m.getDamageDist() && m.getDamageDist().T ? <span onMouseOver={termtip.bind(null, 'thermal')}
                                                              onMouseOut={tooltip.bind(null, null)}><DamageThermal/></span> : ''}
            {m.getDamageDist() && m.getDamageDist().E ? <span onMouseOver={termtip.bind(null, 'explosive')}
                                                              onMouseOut={tooltip.bind(null, null)}><DamageExplosive/></span> : ''}
            {m.getDamageDist() && m.getDamageDist().A ? <span onMouseOver={termtip.bind(null, 'absolute')}
                                                              onMouseOut={tooltip.bind(null, null)}><DamageAbsolute/></span> : ''}
            {classRating} {translate(m.name || m.grp)}{m.mods && Object.keys(m.mods).length > 0 ? <span className='r'
                                                                                                        onMouseOver={termtip.bind(null, modTT)}
                                                                                                        onMouseOut={tooltip.bind(null, null)}><Modified/></span> : null}
          </div>

          <div className={'r'}>{formats.round(m.getMass())}{u.T}</div>
        </div>
        <div className={'cb'}>
          {m.getDps() ? <div className={'l'} onMouseOver={termtip.bind(null, m.getClip() ? 'dpssdps' : 'dps')}
                             onMouseOut={tooltip.bind(null, null)}>{translate('DPS')}: {formats.round1(m.getDps())} {m.getClip() ?
            <span>({formats.round1(m.getSDps())})</span> : null}</div> : null}
          {m.getDamage() ? <div className={'l'} onMouseOver={termtip.bind(null, m.getDamage() ? 'shotdmg' : 'shotdmg')}
                                onMouseOut={tooltip.bind(null, null)}>{translate('shotdmg')}: {formats.round1(m.getDamage())}</div> : null}
          {m.getEps() ? <div className={'l'} onMouseOver={termtip.bind(null, m.getClip() ? 'epsseps' : 'eps')}
                             onMouseOut={tooltip.bind(null, null)}>{translate('EPS')}: {formats.round1(m.getEps())}{u.MW} {m.getClip() ?
            <span>({formats.round1(m.getEps() * m.getSustainedFactor())}{u.MW})</span> : null}</div> : null}
          {m.getHps() ? <div className={'l'} onMouseOver={termtip.bind(null, m.getClip() ? 'hpsshps' : 'hps')}
                             onMouseOut={tooltip.bind(null, null)}>{translate('HPS')}: {formats.round1(m.getHps())} {m.getClip() ?
            <span>({formats.round1(m.getHps() * m.getSustainedFactor())})</span> : null}</div> : null}
          {m.getDps() && m.getEps() ? <div className={'l'} onMouseOver={termtip.bind(null, 'dpe')}
                                           onMouseOut={tooltip.bind(null, null)}>{translate('DPE')}: {formats.f1(m.getDps() / m.getEps())}</div> : null}
          {m.getRoF() ? <div className={'l'} onMouseOver={termtip.bind(null, 'rof')}
                             onMouseOut={tooltip.bind(null, null)}>{translate('ROF')}: {formats.f1(m.getRoF())}{u.ps}</div> : null}
          {m.getRange() ? <div
            className={'l'}>{translate('range', m.grp)} {formats.f1(m.getRange() / 1000)}{u.km}</div> : null}
          {m.getScanTime() ? <div
            className={'l'}>{translate('scantime')} {formats.f1(m.getScanTime())}{u.s}</div> : null}
          {m.getFalloff() ? <div
            className={'l'}>{translate('falloff')} {formats.round(m.getFalloff() / 1000)}{u.km}</div> : null}
          {m.getShieldBoost() ? <div className={'l'}>+{formats.pct1(m.getShieldBoost())}</div> : null}
          {m.getAmmo() ? <div
            className={'l'}>{translate('ammunition')}: {formats.int(m.getClip())}/{formats.int(m.getAmmo())}</div> : null}
          {m.getReload() ? <div className={'l'}>{translate('wep_reload')}: {formats.round(m.getReload())}{u.s}</div> : null}
          {m.getShotSpeed() ? <div
            className={'l'}>{translate('shotspeed')}: {formats.int(m.getShotSpeed())}{u.mps}</div> : null}
          {m.getPiercing() ? <div className={'l'}>{translate('piercing')}: {formats.int(m.getPiercing())}</div> : null}
          {m.getJitter() ? <div className={'l'}>{translate('jitter')}: {formats.f2(m.getJitter())}°</div> : null}
          {m.getScanAngle() ? <div className={'l'}>{translate('scan angle')}: {formats.f2(m.getScanAngle())}°</div> : null}
          {m.getScanRange() ? <div className={'l'}>{translate('scan range')}: {formats.int(m.getScanRange())}{u.m}</div> : null}
          {m.getMaxAngle() ? <div className={'l'}>{translate('max angle')}: {formats.f2(m.getMaxAngle())}°</div> : null}
          {showModuleResistances && m.getExplosiveResistance() ? <div
            className='l'>{translate('explres')}: {formats.pct(m.getExplosiveResistance())}</div> : null}
          {showModuleResistances && m.getKineticResistance() ? <div
            className='l'>{translate('kinres')}: {formats.pct(m.getKineticResistance())}</div> : null}
          {showModuleResistances && m.getThermalResistance() ? <div
            className='l'>{translate('thermres')}: {formats.pct(m.getThermalResistance())}</div> : null}
          {m.getIntegrity() ? <div className='l'>{translate('integrity')}: {formats.int(m.getIntegrity())}</div> : null}
          {m.getInfo() ? <div className='l'>{translate(m.getInfo())}</div> : null}
          {m && hasModifications ? <div className='r' tabIndex="0" ref={modButton => this.modButton = modButton}>
            <button tabIndex="-1" onClick={(e) => this._toggleModifications(e)} onContextMenu={stopCtxPropagation}
                    onMouseOver={termtip.bind(null, 'modifications')} onMouseOut={tooltip.bind(null, null)}>
              <ListModifications/></button>
          </div> : null}
        </div>
      </div>;
    } else {
      return <div className={'empty'}>{translate('empty')}</div>;
    }
  }


}
