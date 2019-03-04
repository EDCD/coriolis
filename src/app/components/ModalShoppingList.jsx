import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import request from 'superagent';
import Persist from '../stores/Persist';

/**
 * Permalink modal
 */
export default class ModalShoppingList extends TranslatedComponent {

  static propTypes = {
    ship: PropTypes.object.isRequired
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
          console.log(module.m.blueprint.special);
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
        if (err) {
          console.log(err);
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
        for (const g in module.m.blueprint.grades) {
          if (!module.m.blueprint.grades.hasOwnProperty(g)) {
            continue;
          }
          if (g > module.m.blueprint.grade) {
            continue;
          }
          for (const i in module.m.blueprint.grades[g].components) {
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
    return <div className='modal' onClick={ (e) => e.stopPropagation() }>
      <h2>{translate('PHRASE_SHOPPING_MATS')}</h2>
      <label>{translate('Grade 1 rolls ')}</label>
      <input id={1} type={'number'} min={0} defaultValue={this.state.matsPerGrade[1]} onChange={this.changeHandler} />
      <br/>
      <label>{translate('Grade 2 rolls ')}</label>
      <input id={2} type={'number'} min={0} defaultValue={this.state.matsPerGrade[2]} onChange={this.changeHandler} />
      <br/>
      <label>{translate('Grade 3 rolls ')}</label>
      <input id={3} type={'number'} min={0} value={this.state.matsPerGrade[3]} onChange={this.changeHandler} />
      <br/>
      <label>{translate('Grade 4 rolls ')}</label>
      <input id={4} type={'number'} min={0} value={this.state.matsPerGrade[4]} onChange={this.changeHandler} />
      <br/>
      <label>{translate('Grade 5 rolls ')}</label>
      <input id={5} type={'number'} min={0} value={this.state.matsPerGrade[5]} onChange={this.changeHandler} />
      <div>
        <textarea className='cb json' readOnly value={this.state.matsList} />
      </div>
      <label hidden={!compatible} className={'l cap'}>{translate('CMDR Name')}</label>
      <br/>
      <select hidden={!compatible} className={'cmdr-select l cap'} onChange={this.cmdrChangeHandler} defaultValue={this.state.cmdrName}>
        {this.state.cmdrs.map(e => <option key={e}>{e}</option>)}
      </select>
      <br/>
      <p hidden={!this.state.failed} id={'failed'} className={'l'}>{translate('PHRASE_FAIL_EDENGINEER')}</p>
      <p hidden={compatible} id={'browserbad'} className={'l'}>{translate('PHRASE_FIREFOX_EDENGINEER')}</p>
      <button className={'l cb dismiss cap'} disabled={!!this.state.failed || !compatible} onClick={this.sendToEDEng}>{translate('Send to EDEngineer')}</button>
      <button className={'r dismiss cap'} onClick={this.context.hideModal}>{translate('close')}</button>
    </div>;
  }
}
