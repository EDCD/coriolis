import React from 'react';
import cn from 'classnames';
import Slot from './Slot';
import Persist from '../stores/Persist';
import { DamageAbsolute, DamageKinetic, DamageThermal, DamageExplosive, MountFixed, MountGimballed, MountTurret, ListModifications, Modified } from './SvgIcons';
import { Modifications } from 'coriolis-data/dist';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import { blueprintTooltip } from '../utils/BlueprintFunctions';


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
    return translate(['U','S','M','L','H'][this.props.maxClass]);
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
      let validMods = Modifications.modules[m.grp].modifications || [];
      let showModuleResistances = Persist.showModuleResistances();

      // Modifications tooltip shows blueprint and grade, if available
      let modTT = translate('modified');
      if (m && m.blueprint && m.blueprint.name) {
        modTT = translate(m.blueprint.name) + ' ' + translate('grade') + ' ' + m.blueprint.grade;
        if (m.blueprint.special && m.blueprint.special.id >= 0) {
          modTT += ', ' + translate(m.blueprint.special.name);
        }
        modTT = (
          <div>
            <div>{modTT}</div>
            {blueprintTooltip(translate, m.blueprint.grades[m.blueprint.grade], null, m.grp, m)}
          </div>
        );
      }

      const className = cn('details', enabled ? '' : 'disabled');
      return <div className={className} draggable='true' onDragStart={drag} onDragEnd={drop}>
        <div className={'cb'}>
          <div className={'l'}>
          {m.mount && m.mount == 'F' ? <span onMouseOver={termtip.bind(null, 'fixed')} onMouseOut={tooltip.bind(null, null)}><MountFixed /></span> : ''}
          {m.mount && m.mount == 'G' ? <span onMouseOver={termtip.bind(null, 'gimballed')} onMouseOut={tooltip.bind(null, null)}><MountGimballed /></span> : ''}
          {m.mount && m.mount == 'T' ? <span onMouseOver={termtip.bind(null, 'turreted')} onMouseOut={tooltip.bind(null, null)}><MountTurret /></span> : ''}
          {m.getDamageDist() && m.getDamageDist().K ? <span onMouseOver={termtip.bind(null, 'kinetic')} onMouseOut={tooltip.bind(null, null)}><DamageKinetic /></span> : ''}
          {m.getDamageDist() && m.getDamageDist().T ? <span onMouseOver={termtip.bind(null, 'thermal')} onMouseOut={tooltip.bind(null, null)}><DamageThermal /></span> : ''}
          {m.getDamageDist() && m.getDamageDist().E ? <span onMouseOver={termtip.bind(null, 'explosive')} onMouseOut={tooltip.bind(null, null)}><DamageExplosive /></span> : ''}
          {m.getDamageDist() && m.getDamageDist().A ? <span onMouseOver={termtip.bind(null, 'absolute')} onMouseOut={tooltip.bind(null, null)}><DamageAbsolute /></span> : ''}
          {classRating} {translate(m.name || m.grp)}{ m.mods && Object.keys(m.mods).length > 0 ? <span className='r' onMouseOver={termtip.bind(null, modTT)} onMouseOut={tooltip.bind(null, null)}><Modified /></span> : null }
          </div>

          <div className={'r'}>{formats.round(m.getMass())}{u.T}</div>
        </div>
        <div className={'cb'}>
          { m.getDps() ? <div className={'l'} onMouseOver={termtip.bind(null, m.getClip() ? 'dpssdps' : 'dps')} onMouseOut={tooltip.bind(null, null)}>{translate('DPS')}: {formats.round1(m.getDps())} { m.getClip() ? <span>({formats.round1((m.getClip() * m.getDps() / m.getRoF()) / ((m.getClip() / m.getRoF()) + m.getReload())) })</span> : null }</div> : null }
          { m.getEps() ? <div className={'l'} onMouseOver={termtip.bind(null, m.getClip() ? 'epsseps' : 'eps')} onMouseOut={tooltip.bind(null, null)}>{translate('EPS')}: {formats.round1(m.getEps())}{u.MW} { m.getClip() ? <span>({formats.round1((m.getClip() * m.getEps() / m.getRoF()) / ((m.getClip() / m.getRoF()) + m.getReload())) }{u.MW})</span> : null }</div> : null }
          { m.getHps() ? <div className={'l'} onMouseOver={termtip.bind(null, m.getClip() ? 'hpsshps' : 'hps')} onMouseOut={tooltip.bind(null, null)}>{translate('HPS')}: {formats.round1(m.getHps())} { m.getClip() ? <span>({formats.round1((m.getClip() * m.getHps() / m.getRoF()) / ((m.getClip() / m.getRoF()) + m.getReload())) })</span> : null }</div> : null }
          { m.getDps() && m.getEps() ? <div className={'l'} onMouseOver={termtip.bind(null, 'dpe')} onMouseOut={tooltip.bind(null, null)}>{translate('DPE')}: {formats.f1(m.getDps() / m.getEps())}</div> : null }
          { m.getRoF() ? <div className={'l'} onMouseOver={termtip.bind(null, 'rof')} onMouseOut={tooltip.bind(null, null)}>{translate('ROF')}: {formats.f1(m.getRoF())}{u.ps}</div> : null }
          { m.getRange() ? <div className={'l'}>{translate('range', m.grp)} {formats.f1(m.getRange() / 1000)}{u.km}</div> : null }
          { m.getScanTime() ? <div className={'l'}>{translate('scantime')} {formats.f1(m.getScanTime())}{u.s}</div> : null }
          { m.getFalloff() ? <div className={'l'}>{translate('falloff')} {formats.round(m.getFalloff() / 1000)}{u.km}</div> : null }
          { m.getShieldBoost() ? <div className={'l'}>+{formats.pct1(m.getShieldBoost())}</div> : null }
          { m.getAmmo() ? <div className={'l'}>{translate('ammunition')}: {formats.int(m.getClip())}/{formats.int(m.getAmmo())}</div> : null }
          { m.getReload() ? <div className={'l'}>{translate('reload')}: {formats.round(m.getReload())}{u.s}</div> : null }
          { m.getShotSpeed() ? <div className={'l'}>{translate('shotspeed')}: {formats.int(m.getShotSpeed())}{u.mps}</div> : null }
          { m.getPiercing() ? <div className={'l'}>{translate('piercing')}: {formats.int(m.getPiercing())}</div> : null }
          { m.getJitter() ? <div className={'l'}>{translate('jitter')}: {formats.f2(m.getJitter())}°</div> : null }
          { showModuleResistances && m.getExplosiveResistance() ? <div className='l'>{translate('explres')}: {formats.pct(m.getExplosiveResistance())}</div> : null }
          { showModuleResistances && m.getKineticResistance() ? <div className='l'>{translate('kinres')}: {formats.pct(m.getKineticResistance())}</div> : null }
          { showModuleResistances && m.getThermalResistance() ? <div className='l'>{translate('thermres')}: {formats.pct(m.getThermalResistance())}</div> : null }
          { m.getIntegrity() ? <div className='l'>{translate('integrity')}: {formats.int(m.getIntegrity())}</div> : null }
          { m && validMods.length > 0 ? <div className='r' tabIndex="0" ref={ modButton => this.modButton = modButton }><button tabIndex="-1" onClick={this._toggleModifications.bind(this)} onContextMenu={stopCtxPropagation} onMouseOver={termtip.bind(null, 'modifications')} onMouseOut={tooltip.bind(null, null)}><ListModifications /></button></div> : null }
        </div>
      </div>;
    } else {
      return  <div className={'empty'}>{translate('empty')}</div>;
    }
  }

}
