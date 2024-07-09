import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import request from 'superagent';
import Persist from '../stores/Persist';
const zlib = require('zlib');
const base64url = require('base64url');

/**
 * Permalink modal
 */
export default class ModalShoppingList extends TranslatedComponent {

  static propTypes = {
    ship: PropTypes.object.isRequired,
    buildName: PropTypes.string
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    this.state = {
      matsList: '',
      mats: {},
      failed: false,
      cmdrName: Persist.getCmdr().selected,
      cmdrs: Persist.getCmdr().cmdrs,
      matsPerGrade: Persist.getRolls(),
      blueprints: []
    };
  }

  /**
   * React component did mount
   */
  componentDidMount() {
    this.renderMats();
    if (this.checkBrowserIsCompatible()) {
      this.getCommanders();
      this.registerBPs();
    }
  }

  /**
   * Find all blueprints needed to make a build.
   */
  registerBPs() {
    const ship = this.props.ship;
    let blueprints = [];
    for (const module of ship.costList) {
      if (module.type === 'SHIP') {
        continue;
      }
      if (module.m && module.m.blueprint) {
        if (!module.m.blueprint.grade || !module.m.blueprint.grades) {
          continue;
        }
        if (module.m.blueprint.special) {
          blueprints.push({ uuid: module.m.blueprint.special.uuid, number: 1 });
        }
        for (const g in module.m.blueprint.grades) {
          if (!module.m.blueprint.grades.hasOwnProperty(g)) {
            continue;
          }
          if (g > module.m.blueprint.grade) {
            continue;
          }
          blueprints.push({ uuid: module.m.blueprint.grades[g].uuid, number: this.state.matsPerGrade[g] });
        }
      }
    }
    this.setState({ blueprints });
  }

  /**
   * Check browser isn't firefox.
   * @return {boolean} true if compatible, false if not.
   */
  checkBrowserIsCompatible() {
    // Firefox 1.0+
    return typeof InstallTrigger === 'undefined';
  }

  /**
   * Get a list of commanders from EDEngineer.
   */
  getCommanders() {
    request
      .get('http://localhost:44405/commanders')
      .end((err, res) => {
        this.display = 'block';
        if (err) {
          console.log(err);
          this.display = 'none';
          return this.setState({ failed: true });
        }
        const cmdrs = JSON.parse(res.text);
        if (!this.state.cmdrName) {
          this.setState({ cmdrName: cmdrs[0] });
        }
        this.setState({ cmdrs }, () => {
          Persist.setCmdr({ selected: this.state.cmdrName, cmdrs });
        });
      });
  }

  /**
   * Send all blueprints to ED Engineer
   * @param {Event} event React event
   */
  sendToEDEng(event) {
    event.preventDefault();
    let translate = this.context.language.translate;
    const target = event.target;
    target.disabled = this.state.blueprints.length > 0;
    if (this.state.blueprints.length === 0) {
      target.innerText = translate('No modded components.');
      target.disabled = true;
      setTimeout(() => {
        target.innerText = translate('Send to EDEngineer');
        target.disabled = false;
      }, 3000);
    } else {
      target.innerText = translate('Sending...');
    }
    let countSent = 0;
    let countTotal = this.state.blueprints.length;

    for (const i of this.state.blueprints) {
      request
        .patch(`http://localhost:44405/${this.state.cmdrName}/shopping-list`)
        .field('uuid', i.uuid)
        .field('size', i.number)
        .end(err => {
          if (err) {
            console.log(err);
            if (err.message !== 'Bad Request') {
              this.setState({ failed: true });
            }
          }
          countSent++;
          if (countSent === countTotal) {
            target.disabled = false;
            target.innerText = translate('Send to EDEngineer');
          }
        });
    }
  }

  /**
   * Fix issues with the item name for bulkheads when sending to EDOMH
   * @param {*} ship Ship object
   * @param {*} item Item name
   * @returns updated item name
   */
  fixArmourItemNameForEDOMH(ship, item) {
    // The module blueprint fdname contains "Armour_" it's a bulkhead and we need to pre-populate the item field with the correct name from the ship object
    switch (ship.bulkheads.m.name){
      case "Lightweight Alloy":
        item = ship.id + "_Armour_Grade1";
        break;
      case "Reinforced Alloy":
        item = ship.id + "_Armour_Grade2";
        break;
      case "Military Grade Composite":
        item = ship.id + "_Armour_Grade3";
        break;
      case "Mirrored Surface Composite":
        item = ship.id + "_Armour_Mirrored";
        break;
      case "Reactive Surface Composite":
        item = ship.id + "_Armour_Reactive";
        break;
    }
    return item;
  }

  /**
 * Send all blueprints to EDOMH. This is a modified copy of registerBPs because this.state.blueprints was empty when I tried to modify sendToEDEng and I couldn't figure out why
 * @param {Event} event React event
 */
  sendToEDOMH(event) {
    event.preventDefault();
    const ship = this.props.ship;
    const buildName = this.props.buildName;
    let blueprints = [];

    //create the json
    for (const module of ship.costList) {
      if (module.type === 'SHIP') {
        continue;
      }
      if (module.m && module.m.blueprint) {
        if (!module.m.blueprint.grade || !module.m.blueprint.grades) {
          continue;
        }
        if (module.m.blueprint.special) {
          let item = "";
          // If the module blueprint fdname contains "Armour_" it's a bulkhead and we need to pre-populate the item field with the correct name from the ship object
          if (module.m.blueprint.fdname.includes("Armour_")) {
            item = this.fixArmourItemNameForEDOMH(ship, item)
          }
          else {
            item = module.m.symbol;
          }

          blueprints.push({
            "item": item,
            "blueprint": module.m.blueprint.special.edname
          });
        }
        for (let g in module.m.blueprint.grades) {
          if (!module.m.blueprint.grades.hasOwnProperty(g)) {
            continue;
          }
          // We only want the grade that the module is currently at, not every grade up to that point
          if (Number(g) !== module.m.blueprint.grade) {
            continue;
          }
          let item = "";
          // If the module blueprint fdname contains "Armour_" it's a bulkhead and we need to pre-populate the item field with the correct name from the ship object
          if (module.m.blueprint.fdname.includes("Armour_")) {
            item = this.fixArmourItemNameForEDOMH(ship, item)
          }
          else {
            item = module.m.symbol;
          }
          blueprints.push({
            "item": item,
            "blueprint": module.m.blueprint.fdname,
            "grade": module.m.blueprint.grade,
            "highestGradePercentage":1.0
          });
        }
      }
    }

    let shipName = buildName + " - " + ship.name;

    //create JSON to encode
    let baseJson = {
      "version":1,
      "name": shipName, // TO-DO: Import build name and put that here correctly
      "items": blueprints
    }

    let JSONString = JSON.stringify(baseJson)
    let deflated = zlib.deflateSync(JSONString)

    //actually encode
    let link = base64url.encode(deflated)
    link = "edomh://coriolis/?" + link;

    window.open(link, "_self")
  }

  /**
   * Convert mats object to string
   */
  renderMats() {
    const ship = this.props.ship;
    let mats = {};
    for (const module of ship.costList) {
      if (module.type === 'SHIP') {
        continue;
      }
      if (module.m && module.m.blueprint) {
        if (!module.m.blueprint.grade || !module.m.blueprint.grades) {
          continue;
        }
        for (let g in module.m.blueprint.grades) {
          if (!module.m.blueprint.grades.hasOwnProperty(g)) {
            continue;
          }
          // Ignore grades higher than the grade selected
          if (Number(g) > module.m.blueprint.grade) {
            continue;
          }
          for (let i in module.m.blueprint.grades[g].components) {
            if (!module.m.blueprint.grades[g].components.hasOwnProperty(i)) {
              continue;
            }
            if (mats[i]) {
              mats[i] += module.m.blueprint.grades[g].components[i] * this.state.matsPerGrade[g];
            } else {
              mats[i] = module.m.blueprint.grades[g].components[i] * this.state.matsPerGrade[g];
            }
          }
        }
        if (module.m.blueprint.special) {
          for (const j in module.m.blueprint.special.components) {
            if (!module.m.blueprint.special.components.hasOwnProperty(j)) {
              continue;
            }
            if (mats[j]) {
              mats[j] += module.m.blueprint.special.components[j];
            } else {
              mats[j] = module.m.blueprint.special.components[j];
            }
          }
        }
      }
    }
    let matsString = '';
    for (const i in mats) {
      if (!mats.hasOwnProperty(i)) {
        continue;
      }
      if (mats[i] === 0) {
        delete mats[i];
        continue;
      }
      matsString += `${i}: ${mats[i]}\n`;
    }
    this.setState({ matsList: matsString, mats });
  }

  /**
   * Handler for changing roll amounts
   * @param {SyntheticEvent} e React Event
   */
  changeHandler(e) {
    let grade = e.target.id;
    let newState = this.state.matsPerGrade;
    newState[grade] = parseInt(e.target.value);
    this.setState({ matsPerGrade: newState });
    Persist.setRolls(newState);
    this.renderMats();
    this.registerBPs();
  }

  /**
   * Handler for changing cmdr name
   * @param {SyntheticEvent} e React Event
   */
  cmdrChangeHandler(e) {
    let cmdrName = e.target.value;
    this.setState({ cmdrName }, () => {
      Persist.setCmdr({ selected: this.state.cmdrName, cmdrs: this.state.cmdrs });
    });
  }

  /**
   * Render the modal
   * @return {React.Component} Modal Content
   */
  render() {
    let translate = this.context.language.translate;
    this.changeHandler = this.changeHandler.bind(this);
    const compatible = this.checkBrowserIsCompatible();
    this.cmdrChangeHandler = this.cmdrChangeHandler.bind(this);
    this.sendToEDEng = this.sendToEDEng.bind(this);
    this.sendToEDOMH = this.sendToEDOMH.bind(this);
    return <div className='modal' onClick={ (e) => e.stopPropagation() }>
      <h3>{translate('PHRASE_SHOPPING_MATS')}</h3>
      <div>
      <p>{translate('PHRASE_DIFFERENT_ROLLS')}</p>
        <label>{translate('G1')}</label>
        <input className={'groll'} id={1} type={'number'} min={0} defaultValue={this.state.matsPerGrade[1]} onChange={this.changeHandler} />
        &nbsp;|&nbsp;<label>{translate('G2')}</label>
        <input className={'groll'} id={2} type={'number'} min={0} defaultValue={this.state.matsPerGrade[2]} onChange={this.changeHandler} />
        &nbsp;|&nbsp;<label>{translate('G3')}</label>
        <input className={'groll'} id={3} type={'number'} min={0} value={this.state.matsPerGrade[3]} onChange={this.changeHandler} />
        &nbsp;|&nbsp;<label>{translate('G4')}</label>
        <input className={'groll'} id={4} type={'number'} min={0} value={this.state.matsPerGrade[4]} onChange={this.changeHandler} />
        &nbsp;|&nbsp;<label>{translate('G5')}</label>
        <input className={'groll'} id={5} type={'number'} min={0} value={this.state.matsPerGrade[5]} onChange={this.changeHandler} />
      </div>

      <div>
        <p>{translate('PHRASE_ALL_MODULES_ALL_ROLLS')}</p>
        <textarea className='cb json' readOnly value={this.state.matsList} />
        <p>{translate('PHRASE_FOR_FINER_CONTROL')}</p>
      </div>

      <div id='edengineer' display={this.display} hidden={!!this.state.failed && !compatible}>
      <hr />
        <h3>ED Engineer</h3>
        <h4 hidden={compatible} id={'browserbad'} className={'l'}>{translate('PHRASE_FIREFOX_EDENGINEER')}</h4>
        <h4 hidden={!this.state.failed} id={'failed'} className={'l'}>{translate('PHRASE_FAILED_TO_FIND_EDENGINEER')}</h4>
        <label for='cmdr-select' hidden={!!this.state.failed || !compatible} className={'l cap'}>{translate('CMDR Name:')}</label>
        <select id='cmdr-select' hidden={!!this.state.failed || !compatible} className={'cmdr-select l cap'} onChange={this.cmdrChangeHandler} defaultValue={this.state.cmdrName}>
          {this.state.cmdrs.map(e => <option key={e}>{e}</option>)}
        </select>
        <br/>
          <button className={'l cb dismiss cap'} disabled={!!this.state.failed || !compatible} onClick={this.sendToEDEng}>{translate('Send to EDEngineer')}</button>
      </div>
      <div id='edomh'>
      <hr />
        <h3>ED Odyssey Materials Helper</h3>
        <p>{translate('PHRASE_ENSURE_EDOMH')}</p>
        <button className={'l cb dismiss cap'} onClick={this.sendToEDOMH}>{translate('Send to EDOMH')}</button>
      </div>
      <hr />

      <button className={'r dismiss cap'} onClick={this.context.hideModal}>{translate('close')}</button>
    </div>;
  }
}
