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
    this.modItems = [];// Array to hold various element refs (<li>, <div>, <ul>, etc.)
    this.firstModId = null;
    this.firstBPLabel = null;// First item in mod menu
    this.lastModId = null;
    this.selectedModId = null;
    this.selectedSpecialId = null;
    this.lastNeId = null;// Last number editor id. Used to set focus to last number editor when shift-tab pressed on first element in mod menu.
    this.modValDidChange = false; // used to determine if component update was caused by change in modification value.
    this._handleModChange = this._handleModChange.bind(this);

    this.state = {
      blueprintMenuOpened: !(props.m.blueprint && props.m.blueprint.name),
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
        // Grade is a string in the JSON so make it a number
        grade = Number(grade);
        const classes = cn('c', {
          active: m.blueprint && blueprint.id === m.blueprint.id && grade === m.blueprint.grade
        });
        const close = this._blueprintSelected.bind(this, blueprintName, grade);
        const key = blueprintName + ':' + grade;
        const tooltipContent = blueprintTooltip(translate, blueprint.grades[grade], Modifications.modules[m.grp].blueprints[blueprintName].grades[grade].engineers, m.grp);
        if (classes.indexOf('active') >= 0) this.selectedModId = key;
        blueprintGrades.unshift(<li key={key} tabIndex="0" data-id={key} className={classes} style={{ width: '2em' }} onMouseOver={termtip.bind(null, tooltipContent)} onMouseOut={tooltip.bind(null, null)} onClick={close} onKeyDown={this._keyDown} ref={modItem => this.modItems[key] = modItem}>{grade}</li>);
      }
      if (blueprintGrades) {
        const thisLen = blueprintGrades.length;
        if (this.firstModId == null) this.firstModId = blueprintGrades[0].key;
        this.lastModId = blueprintGrades[thisLen - 1].key;
        blueprints.push(<div key={blueprint.name} className={'select-group cap'}>{translate(blueprint.name)}</div>);
        blueprints.push(<ul key={blueprintName}>{blueprintGrades}</ul>);
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
        this.modItems[elemId].click();
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
          this.modItems[this.lastModId].focus();
          return;
        } else  if (event.currentTarget.className.indexOf('button-inline-menu') >= 0 && event.currentTarget.previousElementSibling == null && this.lastNeId != null && this.modItems[this.lastNeId] != null) {
          // shift-tab on first element in modifications menu. set focus to last number editor field if open
          event.preventDefault();
          this.modItems[this.lastNeId].lastChild.focus();
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
          this.modItems[this.firstModId].focus();
          return;
        } else if (event.currentTarget.className.indexOf('button-inline-menu') >= 0 && event.currentTarget.nextSibling == null && event.currentTarget.nodeName != 'TD') {
          // Experimental menu
          event.preventDefault();
          event.currentTarget.parentElement.firstElementChild.focus();
          return;
        } else if (event.currentTarget.className == 'cb' && event.currentTarget.parentElement.nextSibling == null) {
          event.preventDefault();
          this.modItems[this.firstBPLabel].focus();
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
      specials.push(<div tabIndex="0" style={{ cursor: 'pointer', fontWeight: 'bold' }} className={ 'button-inline-menu warning' } key={ 'none' } data-id={ 'none' } onClick={ close } onKeyDown={this._keyDown} ref={modItem => this.modItems['none'] = modItem}>{translate('PHRASE_NO_SPECIAL')}</div>);
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
          let specialTt = specialToolTip(translate, m.blueprint.grades[m.blueprint.grade], m.grp, m, specialName);
          m.blueprint.special = tmp;
          specials.push(<div tabIndex="0" style={{ cursor: 'pointer' }} className={classes} key={ specialName } data-id={ specialName } onMouseOver={termtip.bind(null, specialTt)} onMouseOut={tooltip.bind(null, null)} onClick={ close } onKeyDown={this._keyDown} ref={modItem => this.modItems[specialName] = modItem}>{translate(Modifications.specials[specialName].name)}</div>);
        } else {
          specials.push(<div tabIndex="0" style={{ cursor: 'pointer' }} className={classes} key={ specialName } data-id={ specialName }onClick={ close } onKeyDown={this._keyDown} ref={modItem => this.modItems[specialName] = modItem}>{translate(Modifications.specials[specialName].name)}</div>);
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
        const highlight = m.blueprint.grades[m.blueprint.grade].features[modName];
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

    if (special === null) {
      ship.clearModuleSpecial(m);
    } else {
      ship.setModuleSpecial(m, Modifications.specials[special]);
    }

    this.setState({ specialMenuOpened: false });
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
    ship.clearModifications(m);
    ship.clearModuleBlueprint(m);
    this.selectedModId = null;
    this.selectedSpecialId = null;
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
    let firstEleCn = this.modItems['modMainDiv'].children.length > 0 ? this.modItems['modMainDiv'].children[0].className : null;
    if (firstEleCn.indexOf('select-group cap') >= 0) {
      this.modItems['modMainDiv'].children[1].firstElementChild.focus();
    } else {
      this.modItems['modMainDiv'].firstElementChild.focus();
    }
  }

  /**
   * Set focus on first element in modifications menu
   * if component updates, unless update is due to value change
   * in a modification
   */
  componentDidUpdate() {
    if (!this.modValDidChange) {
      if (this.modItems['modMainDiv'].children.length > 0) {
        if (this.modItems[this.selectedModId]) {
          this.modItems[this.selectedModId].focus();
          return;
        } else if (this.modItems[this.selectedSpecialId]) {
          this.modItems[this.selectedSpecialId].focus();
          return;
        }
        let firstEleCn = this.modItems['modMainDiv'].children[0].className;
        if (firstEleCn.indexOf('button-inline-menu') >= 0) {
          this.modItems['modMainDiv'].firstElementChild.focus();
        } else if (firstEleCn.indexOf('select-group cap') >= 0)  {
          this.modItems['modMainDiv'].children[1].firstElementChild.focus();
        }
      }
    } else {
      this._handleModChange(false);// Need to reset if component update due to value change
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
   * @return {React.Component} List
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

    let blueprintLabel;
    let haveBlueprint = false;
    let blueprintTt;
    let blueprintCv;
    // TODO: Fix this to actually find the correct blueprint.
    if (!m.blueprint || !m.blueprint.name || !m.blueprint.fdname || !Modifications.modules[m.grp].blueprints || !Modifications.modules[m.grp].blueprints[m.blueprint.fdname]) {
      this.props.ship.clearModuleBlueprint(m);
      this.props.ship.clearModuleSpecial(m);
    }
    if (m.blueprint && m.blueprint.name && Modifications.modules[m.grp].blueprints[m.blueprint.fdname].grades[m.blueprint.grade]) {
      blueprintLabel = translate(m.blueprint.name) + ' ' + translate('grade') + ' ' + m.blueprint.grade;
      haveBlueprint = true;
      blueprintTt  = blueprintTooltip(translate, m.blueprint.grades[m.blueprint.grade], Modifications.modules[m.grp].blueprints[m.blueprint.fdname].grades[m.blueprint.grade].engineers, m.grp);
      blueprintCv = getPercent(m);
    }

    let specialLabel;
    let specialTt;
    if (m.blueprint && m.blueprint.special) {
      specialLabel = m.blueprint.special.name;
      specialTt = specialToolTip(translate, m.blueprint.grades[m.blueprint.grade], m.grp, m, m.blueprint.special.edname);
    } else {
      specialLabel = translate('PHRASE_SELECT_SPECIAL');
    }

    const specials = this._renderSpecials(this.props, this.context);
    /**
     * pnellesen - 05/28/2018 - added additional checks for specials.length below to ensure menus
     * display correctly in cases where there are no specials (ex: AFMUs.)
     */
    const showBlueprintsMenu = blueprintMenuOpened;
    const showSpecial = haveBlueprint && specials.length && !blueprintMenuOpened;
    const showSpecialsMenu = specialMenuOpened && specials.length;
    const showRolls = haveBlueprint && !blueprintMenuOpened && (!specialMenuOpened || !specials.length);
    const showReset = !blueprintMenuOpened && (!specialMenuOpened || !specials.length) && haveBlueprint;
    const showMods = !blueprintMenuOpened && (!specialMenuOpened || !specials.length) && haveBlueprint;
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
        ref={modItem => this.modItems['modMainDiv'] = modItem}
      >
        { showBlueprintsMenu | showSpecialsMenu ? '' : haveBlueprint ?
          <div tabIndex="0" className={ cn('section-menu button-inline-menu', { selected: blueprintMenuOpened })} style={{ cursor: 'pointer' }} onMouseOver={termtip.bind(null, blueprintTt)} onMouseOut={tooltip.bind(null, null)} onClick={_toggleBlueprintsMenu} onKeyDown={ this._keyDown } ref={modItems => this.modItems[this.firstBPLabel] = modItems}>{blueprintLabel}</div> :
          <div tabIndex="0" className={ cn('section-menu button-inline-menu', { selected: blueprintMenuOpened })} style={{ cursor: 'pointer' }} onClick={_toggleBlueprintsMenu} onKeyDown={ this._keyDown } ref={modItems => this.modItems[this.firstBPLabel] = modItems}>{translate('PHRASE_SELECT_BLUEPRINT')}</div> }
        { showBlueprintsMenu ? this._renderBlueprints(this.props, this.context) : null }
        { showSpecial & !showSpecialsMenu ? <div tabIndex="0" className={ cn('section-menu button-inline-menu', { selected: specialMenuOpened })} style={{ cursor: 'pointer' }} onMouseOver={specialTt ? termtip.bind(null, specialTt) : null} onMouseOut={specialTt ? tooltip.bind(null, null) : null}  onClick={_toggleSpecialsMenu} onKeyDown={ this._keyDown }>{specialLabel}</div> : null }
        { showSpecialsMenu ? specials : null }
        { showReset ? <div tabIndex="0" className={'section-menu button-inline-menu warning'} style={{ cursor: 'pointer' }} onClick={_reset} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_RESET')} onMouseOut={tooltip.bind(null, null)}> { translate('reset') } </div> : null }
        { showRolls ?

          <table style={{ width: '100%', backgroundColor: 'transparent' }}>
            <tbody>
              { showRolls ?
                <tr>
                  <td tabIndex="0" className={ cn('section-menu button-inline-menu', { active: false }) }> { translate('mroll') }: </td>
                  <td tabIndex="0" className={ cn('section-menu button-inline-menu', { active: blueprintCv ===    0 }) } style={{ cursor: 'pointer' }} onClick={_rollWorst} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_WORST')} onMouseOut={tooltip.bind(null, null)}> { translate('0%') } </td>
                  <td tabIndex="0" className={ cn('section-menu button-inline-menu', { active: blueprintCv ===   50 })} style={{ cursor: 'pointer' }} onClick={_rollFifty} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_FIFTY')} onMouseOut={tooltip.bind(null, null)}> { translate('50%') } </td>
                  <td tabIndex="0" className={ cn('section-menu button-inline-menu', { active: blueprintCv ===  100 })} style={{ cursor: 'pointer' }} onClick={_rollFull} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_BEST')} onMouseOut={tooltip.bind(null, null)}> { translate('100%') } </td>
                  <td tabIndex="0" className={ cn('section-menu button-inline-menu', { active: blueprintCv === null || blueprintCv % 50 != 0 })} style={{ cursor: 'pointer' }} onClick={_rollRandom} onKeyDown={ this._keyDown } onMouseOver={termtip.bind(null, 'PHRASE_BLUEPRINT_RANDOM')} onMouseOut={tooltip.bind(null, null)}> { translate('random') } </td>
                </tr> : null }
            </tbody>
          </table> : null }
        { showMods ? <hr /> : null }
        { showMods ?
          <span onMouseOver={termtip.bind(null, 'HELP_MODIFICATIONS_MENU')} onMouseOut={tooltip.bind(null, null)} >
            { this._renderModifications(this.props) }
          </span> : null }
      </div>
    );
  }
}
