import React from 'react';
import PropTypes from 'prop-types';
import * as _ from 'lodash';
import TranslatedComponent from './TranslatedComponent';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import cn from 'classnames';
import { Modifications } from 'coriolis-data/dist';
import Modification from './Modification';
import {
  getBlueprint,
  blueprintTooltip,
  preEngineeredTooltip,
  setPercent,
  getPercent,
  setRandom,
  specialToolTip
} from '../utils/BlueprintFunctions';

const MODIFICATIONS_COMPARATOR = (mod1, mod2) => {
  return mod1.props.name.localeCompare(mod2.props.name);
};

/**
 * Modifications menu
 */
export default class ModificationsMenu extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired,
    m: PropTypes.object.isRequired,
    marker: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    modButton:PropTypes.object
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);

    this._toggleBlueprintsMenu = this._toggleBlueprintsMenu.bind(this);
    this._toggleSpecialsMenu = this._toggleSpecialsMenu.bind(this);
    this._rollFifty = this._rollFifty.bind(this);
    this._rollRandom = this._rollRandom.bind(this);
    this._rollBest = this._rollBest.bind(this);
    this._rollWorst = this._rollWorst.bind(this);
    this._reset = this._reset.bind(this);
    this._keyDown = this._keyDown.bind(this);
    this.modItems = new Map(); // Change to Map
    this.firstModId = null;
    this.firstBPLabel = null;
    this.lastModId = null;
    this.selectedModId = null;
    this.selectedSpecialId = null;
    this.lastNeId = null;
    this.modValDidChange = false;
    this._handleModChange = this._handleModChange.bind(this);

    // Check if module has a blueprint - if not, open blueprints menu by default
    const { m } = props;
    const hasBlueprint = m.blueprint && m.blueprint.name;

    this.state = {
      blueprintMenuOpened: !hasBlueprint, // Open blueprints menu if no blueprint exists
      specialMenuOpened: false
    };
  }

  /**
   * Render the blueprints
   * @param  {Object} props   React component properties
   * @param  {Object} context React component context
   * @return {Object}         list: Array of React Components
   */
  _renderBlueprints(props, context) {
    const { m } = props;
    const { language, tooltip, termtip } = context;
    const translate = language.translate;
    const blueprints = [];
    for (const blueprintName in Modifications.modules[m.grp].blueprints) {
      const blueprint = getBlueprint(blueprintName, m);
      let blueprintGrades = [];
      for (let grade in Modifications.modules[m.grp].blueprints[blueprintName].grades) {
        grade = Number(grade);
        const classes = cn('compact-module', {
          active: m.blueprint && blueprint.id === m.blueprint.id && grade === m.blueprint.grade
        });
        const close = this._blueprintSelected.bind(this, blueprintName, grade);
        const key = blueprintName + ':' + grade;
        const tooltipContent = blueprintTooltip(translate, blueprint.grades[grade], Modifications.modules[m.grp].blueprints[blueprintName].grades[grade].engineers, m.grp);
        if (classes.indexOf('active') >= 0) this.selectedModId = key;
        blueprintGrades.unshift(
          <div
            role='button'
            key={key}
            tabIndex='0'
            data-id={key}
            className={classes}
            onMouseOver={termtip.bind(null, tooltipContent)}
            onMouseOut={tooltip.bind(null, null)}
            onClick={close}
            onKeyDown={this._keyDown}
            ref={(modItem) => this.modItems.set(key, modItem)}
          ><div className='module-content'><span className='module-text'>{grade}</span></div></div>
        );
      }
      if (blueprintGrades) {
        const thisLen = blueprintGrades.length;
        if (this.firstModId == null) this.firstModId = blueprintGrades[0].key;
        this.lastModId = blueprintGrades[thisLen - 1].key;
        blueprints.push(<div key={blueprint.name} className='select-group cap'>{translate(blueprint.name)}</div>);
        blueprints.push(<div key={blueprintName} className='grades-row' data-grade-count={thisLen}>{blueprintGrades}</div>);
      }
    }
    return blueprints;
  }

  /**
   * Key down - select module on Enter key, move to next/previous module on Tab/Shift-Tab, close on Esc
   * @param  {SyntheticEvent} event Event
   *
   */
  _keyDown(event) {
    let className = null;
    let elemId = null;
    if (event.currentTarget.attributes['class']) className = event.currentTarget.attributes['class'].value;
    if (event.currentTarget.attributes['data-id']) elemId = event.currentTarget.attributes['data-id'].value;

    if (event.key == 'Enter' && className.indexOf('disabled') < 0 && className.indexOf('active') < 0) {
      event.stopPropagation();
      if (elemId != null) {
        this.modItems.get(elemId).click();
      } else {
        event.currentTarget.click();
      }
      return;
    }
    if (event.key == 'Tab') {
      // Shift-Tab
      if(event.shiftKey) {
        if (elemId == this.firstModId && elemId != null) {
          // Initial modification menu
          event.preventDefault();
          this.modItems.get(this.lastModId).focus();
          return;
        } else  if (event.currentTarget.className.indexOf('button-inline-menu') >= 0 && event.currentTarget.previousElementSibling == null && this.lastNeId != null && this.modItems.get(this.lastNeId) != null) {
          // shift-tab on first element in modifications menu. set focus to last number editor field if open
          event.preventDefault();
          this.modItems.get(this.lastNeId).lastChild.focus();
          return;
        } else if (event.currentTarget.className.indexOf('button-inline-menu') >= 0 && event.currentTarget.previousElementSibling == null) {
          // shift-tab on button-inline-menu with no number editor
          event.preventDefault();
          event.currentTarget.parentElement.lastElementChild.focus();
        }
      } else {
        if (elemId == this.lastModId && elemId != null) {
          // Initial modification menu
          event.preventDefault();
          this.modItems.get(this.firstModId).focus();
          return;
        } else if (event.currentTarget.className.indexOf('button-inline-menu') >= 0 && event.currentTarget.nextSibling == null && event.currentTarget.nodeName != 'TD') {
          // Experimental menu
          event.preventDefault();
          event.currentTarget.parentElement.firstElementChild.focus();
          return;
        } else if (event.currentTarget.className == 'cb' && event.currentTarget.parentElement.nextSibling == null) {
          event.preventDefault();
          this.modItems.get(this.firstBPLabel).focus();
        }
      }
    }
  }


  /**
   * Render the specials
   * @param  {Object} props   React component properties
   * @param  {Object} context React component context
   * @return {Object}         list: Array of React Components
   */
  _renderSpecials(props, context) {
    const { m } = props;
    const { language, tooltip, termtip } = context;
    const translate = language.translate;
    const specials = [];
    const specialsId = m.missile && Modifications.modules[m.grp]['specials_' + m.missile] ? 'specials_' + m.missile : 'specials';
    if (Modifications.modules[m.grp][specialsId] && Modifications.modules[m.grp][specialsId].length > 0) {
      const close = this._specialSelected.bind(this, null);
      specials.push(<div tabIndex="0" style={{ cursor: 'pointer', fontWeight: 'bold' }} className={ 'button-inline-menu warning' } key={ 'none' } data-id={ 'none' } onClick={ close } onKeyDown={this._keyDown} ref={modItem => {
        if (modItem) {
          this.modItems.set('none', modItem);
        }
      }}>{translate('PHRASE_NO_SPECIAL')}</div>);
      for (const specialName of Modifications.modules[m.grp][specialsId]) {
        if (Modifications.specials[specialName].name.search('Legacy') >= 0) {
          continue;
        }
        const classes = cn('button-inline-menu', {
          active: m.blueprint && m.blueprint.special && m.blueprint.special.edname == specialName
        });
        if (classes.indexOf('active') >= 0) this.selectedSpecialId = specialName;
        const close = this._specialSelected.bind(this, specialName);
        if (m.blueprint && m.blueprint.name) {
          let tmp = {};
          if (m.blueprint.special) {
            tmp = m.blueprint.special;
          } else {
            tmp = undefined;
          }
          m.blueprint.special = Modifications.specials[specialName];
          // For pre-engineered modules, grades might not exist in the same structure
          const blueprintGrade = m.blueprint.grades && m.blueprint.grades[m.blueprint.grade] ? m.blueprint.grades[m.blueprint.grade] : {};
          let specialTt = specialToolTip(translate, blueprintGrade || {}, m.grp, m, specialName);
          m.blueprint.special = tmp;
          specials.push(<div tabIndex="0" style={{ cursor: 'pointer' }} className={classes} key={ specialName } data-id={ specialName } onMouseOver={termtip.bind(null, specialTt)} onMouseOut={tooltip.bind(null, null)} onClick={ close } onKeyDown={this._keyDown} ref={modItem => {
            if (modItem) {
              this.modItems.set(specialName, modItem);
            }
          }}>{translate(Modifications.specials[specialName].name)}</div>);
        } else {
          specials.push(<div tabIndex="0" style={{ cursor: 'pointer' }} className={classes} key={ specialName } data-id={ specialName }onClick={ close } onKeyDown={this._keyDown} ref={modItem => {
            if (modItem) {
              this.modItems.set(specialName, modItem);
            }
          }}>{translate(Modifications.specials[specialName].name)}</div>);
        }
      }
    }
    return specials;
  }

  /**
   * Render the modifications
   * @param  {Object} props   React Component properties
   * @return {Object}         list: Array of React Components
   */
  _renderModifications(props) {
    const { m, onChange, ship } = props;
    const modifiableModifications = [];
    const modifications = [];
    for (const modName of Modifications.modules[m.grp].modifications) {
      if (!Modifications.modifications[modName].hidden) {
        const key = modName + (m.getModValue(modName) / 100 || 0);
        const editable = modName !== 'fallofffromrange';
        // For pre-engineered modules, grades might not exist in the same structure
        const blueprintGrade = m.blueprint && m.blueprint.grades && m.blueprint.grades[m.blueprint.grade] ? m.blueprint.grades[m.blueprint.grade] : { features: {} };
        const highlight = blueprintGrade.features[modName];
        this.lastNeId = modName;
        (editable && highlight ? modifiableModifications : modifications).push(
          <Modification key={ key } ship={ ship } m={ m } highlight={highlight}
            value={m.getPretty(modName) || 0} modItems={this.modItems}
            onChange={onChange} onKeyDown={this._keyDown} name={modName}
            editable={editable} handleModChange = {this._handleModChange} />
        );
      }
    }

    modifiableModifications.sort(MODIFICATIONS_COMPARATOR);
    modifications.sort(MODIFICATIONS_COMPARATOR);
    return modifiableModifications.concat(modifications);
  }

  /**
   * Toggle the blueprints menu
   */
  _toggleBlueprintsMenu() {
    const blueprintMenuOpened = !this.state.blueprintMenuOpened;
    this.setState({ blueprintMenuOpened });
  }

  /**
   * Activated when a blueprint is selected
   * @param  {int} fdname     The Frontier name of the blueprint
   * @param  {int} grade      The grade of the selected blueprint
   */
  _blueprintSelected(fdname, grade) {
    this.context.tooltip(null);
    const { m, ship } = this.props;

    if (m.preEngineered && !m.preEngineered.reengineerable) {
      return; // Prevent Re-engineering of pre-engineered modules
    }

    const blueprint = getBlueprint(fdname, m);
    blueprint.grade = grade;
    ship.setModuleBlueprint(m, blueprint);
    setPercent(ship, m, 100);

    this.setState({ blueprintMenuOpened: false, specialMenuOpened: true });
    this.props.onChange();
  }

  /**
   * Toggle the specials menu
   */
  _toggleSpecialsMenu() {
    const specialMenuOpened = !this.state.specialMenuOpened;
    this.setState({ specialMenuOpened });
  }

  /**
   * Activated when a special is selected
   * @param  {int} special     The name of the selected special
   */
  _specialSelected(special) {
    this.context.tooltip(null);
    const { m, ship } = this.props;
    if (m.preEngineered && !m.preEngineered.canApplyExperimental) {
      console.log('Cannot apply experimental effects to pre-engineered modules');
      return; // Prevent applying experimental effects
    }

    if (special === null) {
      ship.clearModuleSpecial(m);
    } else {
      ship.setModuleSpecial(m, Modifications.specials[special]);
    }

    this.setState({ specialMenuOpened: false });
    this.props.onChange();
  }

  /**
   * Clear the special effect from a pre-engineered module
   */
  _clearSpecial() {
    this.context.tooltip(null);
    const { m, ship } = this.props;
    ship.clearModuleSpecial(m);
    this.props.onChange();
  }

  /**
   * Provide a '50%' roll within the information we have
   */
  _rollFifty() {
    const { m, ship } = this.props;
    setPercent(ship, m, 50);

    // this will change the values in the modifications. Set modDidChange to true to prevent focus change when component updates
    this._handleModChange(true);

    this.props.onChange();
  }

  /**
   * Provide a random roll within the information we have
   */
  _rollRandom() {
    const { m, ship } = this.props;
    setRandom(ship, m);

    // this will change the values in the modifications. Set modDidChange to true to prevent focus change when component updates
    this._handleModChange(true);

    this.props.onChange();
  }

  /**
   * Provide a 'best' roll within the information we have
   */
  _rollBest() {
    const { m, ship } = this.props;
    setPercent(ship, m, 100);

    // this will change the values in the modifications. Set modDidChange to true to prevent focus change when component updates
    this._handleModChange(true);

    this.props.onChange();
  }

  /**
   * Provide a 'worst' roll within the information we have
   */
  _rollWorst() {
    const { m, ship } = this.props;
    setPercent(ship, m, 0);
    // this will change the values in the modifications. Set modDidChange to true to prevent focus change when component updates
    this._handleModChange(true);
    this.props.onChange();
  }

  /**
   * Reset modification information
   */
  _reset() {
    const { m, ship } = this.props;

    if (m.preEngineered && !m.preEngineered.reengineerable) {
      // For pre-engineered modules that cannot be re-engineered,
      // only clear the special effect.
      ship.clearModuleSpecial(m);
    } else {
      // For standard modules, clear everything.
      ship.clearModifications(m);
      ship.clearModuleBlueprint(m);
      this.selectedModId = null;
      this.selectedSpecialId = null;
    }

    this.props.onChange();
  }

  /**
   * set mod did change boolean
   * @param {boolean} b Boolean to determine if a change has been made to a module
   */
  _handleModChange(b) {
    this.modValDidChange = b;
  }

  /**
   * Set focus on first element in modifications menu
   * after it first mounts
   */
  componentDidMount() {
    let firstEleCn = this.modItems.get('modMainDiv').children.length > 0 ? this.modItems.get('modMainDiv').children[0].className : null;
    if (firstEleCn.indexOf('select-group cap') >= 0) {
      this.modItems.get('modMainDiv').children[1].firstElementChild.focus();
    } else {
      this.modItems.get('modMainDiv').firstElementChild.focus();
    }
  }

  componentDidUpdate() {
    if (!this.modValDidChange) {
      if (this.modItems.get('modMainDiv').children.length > 0) {
        if (this.modItems.get(this.selectedModId)) {
          if (this.modItems.get(this.selectedModId).focus)
          this.modItems.get(this.selectedModId).focus();
          return;
        } else if (this.modItems.get(this.selectedSpecialId)) {
          this.modItems.get(this.selectedSpecialId).focus();
          return;
        }
        let firstEleCn = this.modItems.get('modMainDiv').children[0].className;
        if (firstEleCn && firstEleCn.indexOf('button-inline-menu') >= 0) {
          this.modItems.get('modMainDiv').firstElementChild.focus();
        } else if (firstEleCn.indexOf('select-group cap') >= 0)  {
          this.modItems.get('modMainDiv').children[1].firstElementChild.focus();
        }
      }
    } else {
      this._handleModChange(false);
    }
  }
  /**
   * set focus to the modification menu icon after mod menu is unmounted.
   */
  componentWillUnmount() {
    if (this.props.modButton) {
      this.props.modButton.focus();
    }
  }

  /**
   * Render the list
   * @return {React.Component} List of items related to blueprint/modifications
   */
  render() {
    const { language, tooltip, termtip } = this.context;
    const translate = language.translate;
    const { m } = this.props;
    const { blueprintMenuOpened, specialMenuOpened } = this.state;

    const _toggleBlueprintsMenu = this._toggleBlueprintsMenu;
    const _toggleSpecialsMenu = this._toggleSpecialsMenu;
    const _rollFull = this._rollBest;
    const _rollWorst = this._rollWorst;
    const _rollFifty = this._rollFifty;
    const _rollRandom = this._rollRandom;
    const _reset = this._reset;

    // Check if this is a pre-engineered module
    const isPreEngineered = m.preEngineered && m.preEngineered.blueprints && m.preEngineered.blueprints.length > 0;
    const canReengineer = isPreEngineered ? m.preEngineered.reengineerable : true;
    const canApplyExperimental = isPreEngineered ? m.preEngineered.canApplyExperimental : true;

    // Check if module has engineering explicitly disabled
    const engineeringDisabled = m.engineering === false || m.engineering === 'False';
    if (engineeringDisabled) {
      return (
        <div className={cn('select', this.props.className)} onClick={(e) => e.stopPropagation()}>
          <div className="section-menu disabled" style={{ cursor: 'not-allowed', textAlign: 'center', padding: '10px' }}>
            {translate('PHRASE_ENGINEERING_DISABLED')}
          </div>
        </div>
      );
    }

    let blueprintLabel;
    let haveBlueprint = false;
    let blueprintTt;
    let blueprintCv;
    let bprintSearchName;

    // REMOVE the blueprint object creation from render - this was destroying saved experimentals
    // The blueprint object is now created once in the constructor

    // If the fdname is Weapon_Overcharged, we need to check if it's an MC
    if (m.blueprint && m.blueprint.fdname) {
      // Set the bprintSearchName value to the fdname of the blueprint for this module
      bprintSearchName = m.blueprint.fdname;
      if (m.blueprint.fdname === 'Weapon_Overcharged') {
        // If the module is a MultiCannon, we need to fix the blueprint search name
        if (m.symbol.match(/MultiCannon/i)) {
          bprintSearchName = 'MC_Overcharged';
        }
      }
    }

    // Only clear blueprint for non-pre-engineered modules
    if (!m.preEngineered && (!m.blueprint || !m.blueprint.name || !m.blueprint.fdname || !Modifications.modules[m.grp].blueprints || !Modifications.modules[m.grp].blueprints[bprintSearchName])) {
      this.props.ship.clearModuleBlueprint(m);
      this.props.ship.clearModuleSpecial(m);
    }
    if (m.blueprint && m.blueprint.name && Modifications.modules[m.grp].blueprints[bprintSearchName] && Modifications.modules[m.grp].blueprints[bprintSearchName].grades && Modifications.modules[m.grp].blueprints[bprintSearchName].grades[m.blueprint.grade]) {
      blueprintLabel = translate(m.blueprint.name) + ' ' + translate('grade') + ' ' + m.blueprint.grade;
      haveBlueprint = true;

      blueprintTt  = blueprintTooltip(translate, m.blueprint.grades[m.blueprint.grade], Modifications.modules[m.grp].blueprints[bprintSearchName].grades[m.blueprint.grade].engineers, m.grp);
      blueprintCv = getPercent(m);
    } else if (isPreEngineered && m.preEngineered.blueprints && m.preEngineered.blueprints.length > 0) {
      // For pre-engineered modules, show all applied blueprints
      const blueprintNames = m.preEngineered.blueprints.map(bpName => {
        const bp = getBlueprint(bpName, m);
        return translate(bp.name);
      }).join(' + ');
      blueprintLabel = blueprintNames + ' ' + translate('grade') + ' ' + m.preEngineered.grade;
      haveBlueprint = true;
      // For pre-engineered modules, use the custom tooltip that shows all blueprints combined
      blueprintTt = preEngineeredTooltip(translate, m, m.grp);
      blueprintCv = 100; // Pre-engineered modules are always at 100%
    }

    let specialLabel;
    let specialTt;
    let haveSpecial = false;
    if (m.blueprint && m.blueprint.special) {
      specialLabel = translate(m.blueprint.special.name);
      // For pre-engineered modules, grades might not exist in the same structure
      const blueprintGrade = m.blueprint.grades && m.blueprint.grades[m.blueprint.grade] ? m.blueprint.grades[m.blueprint.grade] : {};
      specialTt = specialToolTip(translate, blueprintGrade, m.grp, m, m.blueprint.special.edname);
      haveSpecial = true;
    } else {
      specialLabel = translate('PHRASE_SELECT_SPECIAL');
    }

    const specials = this._renderSpecials(this.props, this.context);

    // Special logic for pre-engineered modules - they skip blueprint selection and go straight to experimentals
    const showBlueprintsMenu = blueprintMenuOpened && !m.preEngineered;
    const showSpecial = haveBlueprint && specials.length && (!blueprintMenuOpened || m.preEngineered);
    const showSpecialsMenu = specialMenuOpened && specials.length;
    const showRolls = haveBlueprint && !blueprintMenuOpened && (!specialMenuOpened || !specials.length) && !m.preEngineered;
    const showReset = !blueprintMenuOpened && (!specialMenuOpened || !specials.length) && haveBlueprint;
    const showMods = !blueprintMenuOpened && (!specialMenuOpened || !specials.length) && haveBlueprint && !m.preEngineered;

    if (haveBlueprint) {
      this.firstBPLabel = blueprintLabel;
    } else {
      this.firstBPLabel = 'selectBP';
    }

    return (
      <div
        className={cn('select', this.props.className)}
        onClick={(e) => e.stopPropagation() }
        onContextMenu={stopCtxPropagation}
        ref={modItem => {
          if (modItem) {
            this.modItems.set('modMainDiv', modItem);
          }
        }}
      >
        { showBlueprintsMenu | showSpecialsMenu ? '' : haveBlueprint ?
          <div tabIndex="0" className={ cn('section-menu button-inline-menu', { selected: blueprintMenuOpened, disabled: isPreEngineered && !canReengineer })} style={{ cursor: isPreEngineered && !canReengineer ? 'not-allowed' : 'pointer' }} onMouseOver={termtip.bind(null, isPreEngineered && !canReengineer ? translate('PHRASE_PREENGINEERED_LOCKED') : blueprintTt)} onMouseOut={tooltip.bind(null, null)} onClick={isPreEngineered && !canReengineer ? null : _toggleBlueprintsMenu} onKeyDown={ this._keyDown } ref={modItems => {
            if (modItems) {
              this.modItems.set(this.firstBPLabel, modItems);
            }
          }}>{blueprintLabel}{isPreEngineered ? ' (Pre-Eng)' : ''}</div> :
          <div tabIndex="0" className={ cn('section-menu button-inline-menu', { selected: blueprintMenuOpened })} style={{ cursor: 'pointer' }} onClick={_toggleBlueprintsMenu} onKeyDown={ this._keyDown } ref={modItems => {
            if (modItems) {
              this.modItems.set(this.firstBPLabel, modItems);
            }
          }}>{translate('PHRASE_SELECT_BLUEPRINT')}</div> }

        <div className={cn('menu-section-wrapper', { open: showBlueprintsMenu })}>
          { showBlueprintsMenu ? this._renderBlueprints(this.props, this.context) : null }
        </div>

        { showSpecial & !showSpecialsMenu ?
          canApplyExperimental ?
            <div tabIndex="0" className={ cn('section-menu button-inline-menu', { selected: specialMenuOpened })} style={{ cursor: 'pointer' }} onMouseOver={specialTt ? termtip.bind(null, specialTt) : null} onMouseOut={specialTt ? tooltip.bind(null, null) : null}  onClick={_toggleSpecialsMenu} onKeyDown={ this._keyDown }>{specialLabel}</div>
            :
            <div tabIndex="0" className={ cn('section-menu button-inline-menu', { disabled: true })} style={{ cursor: 'not-allowed' }} onMouseOver={specialTt ? termtip.bind(null, haveSpecial ? translate('PHRASE_PREENGINEERED_LOCKED_EXP') : specialTt) : null} onMouseOut={specialTt ? tooltip.bind(null, null) : null}>{specialLabel}{haveSpecial ? ' (Pre-Eng)' : ''}</div>
          : null }

        <div className={cn('menu-section-wrapper', { open: showSpecialsMenu })}>
          { showSpecialsMenu ? specials : null }
        </div>

        { showReset && !isPreEngineered ? <div tabIndex="0" className={'section-menu button-inline-menu warning'} style={{ cursor: 'pointer' }} onClick={_reset} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_RESET')} onMouseOut={tooltip.bind(null, null)}> { translate('reset') } </div> : null }
        { isPreEngineered && haveBlueprint && m.blueprint && m.blueprint.special && canApplyExperimental ? <div tabIndex="0" className={'section-menu button-inline-menu warning'} style={{ cursor: 'pointer' }} onClick={this._clearSpecial.bind(this)} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_CLEAR_SPECIAL')} onMouseOut={tooltip.bind(null, null)}> { translate('clear special') } </div> : null }

        <div className={cn('menu-section-wrapper', { open: showRolls })}>
          { showRolls ?
            <table style={{ width: '100%', backgroundColor: 'transparent' }}>
              <tbody>
                <tr>
                  <td tabIndex="0" className={ cn('section-menu button-inline-menu', { active: false }) }> { translate('mroll') }: </td>
                  <td tabIndex="0" className={ cn('section-menu button-inline-menu', { active: blueprintCv ===    0 }) } style={{ cursor: 'pointer' }} onClick={_rollWorst} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_WORST')} onMouseOut={tooltip.bind(null, null)}> { translate('0%') } </td>
                  <td tabIndex="0" className={ cn('section-menu button-inline-menu', { active: blueprintCv ===   50 })} style={{ cursor: 'pointer' }} onClick={_rollFifty} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_FIFTY')} onMouseOut={tooltip.bind(null, null)}> { translate('50%') } </td>
                  <td tabIndex="0" className={ cn('section-menu button-inline-menu', { active: blueprintCv ===  100 })} style={{ cursor: 'pointer' }} onClick={_rollFull} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_BEST')} onMouseOut={tooltip.bind(null, null)}> { translate('100%') } </td>
                  <td tabIndex="0" className={ cn('section-menu button-inline-menu', { active: blueprintCv === null || blueprintCv % 50 != 0 })} style={{ cursor: 'pointer' }} onClick={_rollRandom} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_RANDOM')} onMouseOut={tooltip.bind(null, null)}> { translate('random') } </td>
                </tr>
              </tbody>
            </table> : null }
        </div>

        <div className={cn('menu-section-wrapper', { open: showMods })}>
          { showMods ? <hr /> : null }
          { showMods ?
            <span onMouseOver={termtip.bind(null, 'HELP_MODIFICATIONS_MENU')} onMouseOut={tooltip.bind(null, null)} >
              { this._renderModifications(this.props) }
            </span> : null }
        </div>
      </div>
    );
  }
}