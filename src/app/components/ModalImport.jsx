import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import TranslatedComponent from './TranslatedComponent';
import Router from '../Router';
import Persist from '../stores/Persist';
import { Ships } from 'coriolis-data/dist';
import Ship from '../shipyard/Ship';
import { ModuleNameToGroup, Insurance } from '../shipyard/Constants';
import * as ModuleUtils from '../shipyard/ModuleUtils';
import { fromDetailedBuild } from '../shipyard/Serializer';
import { Download } from './SvgIcons';
import { outfitURL } from '../utils/UrlGenerators';
import { shipFromJson, shipModelFromJson } from '../utils/CompanionApiUtils';
import { shipFromLoadoutJSON } from '../utils/JournalUtils';

const zlib = require('pako');

const textBuildRegex = new RegExp('^\\[([\\w \\-]+)\\]\n');
const lineRegex = new RegExp('^([\\dA-Z]{1,2}): (\\d)([A-I])[/]?([FGT])?([SD])? ([\\w\\- ]+)');
const mountMap = { 'H': 4, 'L': 3, 'M': 2, 'S': 1, 'U': 0 };
const standardMap = { 'RB': 0, 'TM': 1, 'FH': 2, 'EC': 3, 'PC': 4, 'SS': 5, 'FS': 6 };
const bhMap = { 'lightweight alloy': 0, 'reinforced alloy': 1, 'military grade composite': 2, 'mirrored surface composite': 3, 'reactive surface composite': 4 };

/**
 * Check is slot is empty
 * @param  {Object}  slot Slot model
 * @return {Boolean}      True if empty
 */
function isEmptySlot(slot) {
  return slot.maxClass == this && slot.m === null;
}

/**
 * Determine if a build is valid
 * @param  {string} shipId Ship ID
 * @param  {string} code   Serialzied ship build 'code'
 * @param  {string} name   Build name
 * @throws {string} If build is not valid
 */
function validateBuild(shipId, code, name) {
  let shipData = Ships[shipId];

  if (!shipData) {
    throw '"' + shipId + '" is not a valid Ship Id!';
  }
  if (typeof name != 'string' || name.length == 0) {
    throw shipData.properties.name + ' build "' + name + '" must be a string at least 1 character long!';
  }
  if (typeof code != 'string' || code.length < 10) {
    throw shipData.properties.name + ' build "' + name + '" is not valid!';
  }
  try {
    let ship = new Ship(shipId, shipData.properties, shipData.slots);
    ship.buildFrom(code);
  } catch (e) {
    throw shipData.properties.name + ' build "' + name + '" is not valid!';
  }
}

/**
 * Convert a ship-loadout JSON object to a Coriolis build
 * @param  {Object} detailedBuild ship-loadout
 * @return {Object}               Coriolis build
 */
function detailedJsonToBuild(detailedBuild) {
  let ship;
  if (!detailedBuild.name) {
    throw 'Build Name missing!';
  }

  if (!detailedBuild.name.trim()) {
    throw 'Build Name must be a string at least 1 character long!';
  }

  try {
    ship = fromDetailedBuild(detailedBuild);
  } catch (e) {
    throw detailedBuild.ship + ' Build "' + detailedBuild.name + '": Invalid data';
  }

  return { shipId: ship.id, name: detailedBuild.name, code: ship.toString() };
}

/**
 * Import Modal
 */
export default class ModalImport extends TranslatedComponent {


  static propTypes = {
    importString: PropTypes.string, // Optional: Default data for import modal
    builds: PropTypes.object,  // Optional: Import object
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);

    this.state = {
      builds: props.builds,
      canEdit: !props.builds,
      loadoutEvent: null,
      comparisons: null,
      shipDiscount: null,
      moduleDiscount: null,
      errorMsg: null,
      importString: props.importString || null,
      importValid: false,
      insurance: null
    };

    this._process = this._process.bind(this);
    this._import = this._import.bind(this);
    this._importBackup = this._importBackup.bind(this);
    this._importLoadout = this._importLoadout.bind(this);
    this._importDetailedArray = this._importDetailedArray.bind(this);
    this._importTextBuild = this._importTextBuild.bind(this);
    this._importCompanionApiBuild = this._importCompanionApiBuild.bind(this);
    this._validateImport = this._validateImport.bind(this);
  }

  /**
   * Import a Loadout event from Elite: Dangerous journal files
   * @param  {Object} data Loadout event
   * @throws {string} If import fails
   */
  _importLoadout(data) {
    if (data && data.Ship && data.Modules) {
      const deflated = zlib.deflate(JSON.stringify(data), { to: 'string' });
      let compressed = btoa(deflated);
      this.setState({loadoutEvent: compressed});
    } else {
      throw 'Loadout event must contain Ship and Modules';
    }
  }

  /**
   * Import a Coriolis backup
   * @param  {Object} importData Backup Data
   * @throws {string} If import fails
   */
  _importBackup(importData) {
    if (importData.builds && typeof importData.builds == 'object') {
      for (let shipId in importData.builds) {
        for (let buildName in importData.builds[shipId]) {
          try {
            validateBuild(shipId, importData.builds[shipId][buildName], buildName);
          } catch (err) {
            delete importData.builds[shipId][buildName];
          }
        }
      }
      this.setState({ builds: importData.builds });
    } else {
      throw 'builds must be an object!';
    }
    if (importData.comparisons) {
      for (let compName in importData.comparisons) {
        let comparison = importData.comparisons[compName];
        for (let i = 0, l = comparison.builds.length; i < l; i++) {
          let build = comparison.builds[i];
          if (!importData.builds[build.shipId] || !importData.builds[build.shipId][build.buildName]) {
            throw build.shipId + ' build "' + build.buildName + '" data is missing!';
          }
        }
      }
      this.setState({ comparisons: importData.comparisons });
    }
    // Check for old/deprecated discounts
    if (importData.discounts instanceof Array && importData.discounts.length == 2) {
      this.setState({ shipDiscount: importData.discounts[0], moduleDiscount: importData.discounts[1] });
    }
    // Check for ship discount
    if (!isNaN(importData.shipDiscount)) {
      this.setState({ shipDiscount: importData.shipDiscount * 1 });
    }
    // Check for module discount
    if (!isNaN(importData.moduleDiscount)) {
      this.setState({ moduleDiscount: importData.moduleDiscount * 1 });
    }

    if (typeof importData.insurance == 'string') {
      let insurance = importData.insurance.toLowerCase();

      if (Insurance[insurance] !== undefined) {
        this.setState({ insurance });
      } else {
        throw 'Invalid insurance type: ' + insurance;
      }
    }
  }

  /**
   * Import an array of ship-loadout objects / builds
   * @param  {Array} importArr  Array of ship-loadout JSON Schema builds
   */
  _importDetailedArray(importArr) {
    let builds = {};
    for (let i = 0, l = importArr.length; i < l; i++) {
      let build = detailedJsonToBuild(importArr[i]);
      if (!builds[build.shipId]) {
        builds[build.shipId] = {};
      }
      builds[build.shipId][build.name] = build.code;
    }
    this.setState({ builds });
  }

  /**
   * Import a build direct from the companion API
   * @param  {string} build JSON from the companion API information
   * @throws {string} if parse/import fails
   */
  _importCompanionApiBuild(build) {
    const shipModel = shipModelFromJson(build);
    const ship = shipFromJson(build);

    let builds = {};
    builds[shipModel] = {};
    builds[shipModel]['Imported ' + Ships[shipModel].properties.name] = ship.toString();
    this.setState({ builds, singleBuild: true });
  }

  /**
   * Import a text build from ED Shipyard
   * @param  {string} buildStr Build string
   * @throws {string} If parse / import fails
   */
  _importTextBuild(buildStr) {
    let buildName = textBuildRegex.exec(buildStr)[1].trim();
    let shipName = buildName.toLowerCase();
    let shipId = null;

    for (let sId in Ships) {
      if (Ships[sId].properties.name.toLowerCase() == shipName) {
        shipId = sId;
        break;
      }
    }

    if (!shipId) {
      throw 'No such ship found: "' + buildName + '"';
    }

    let lines = buildStr.split('\n');
    let ship = new Ship(shipId, Ships[shipId].properties, Ships[shipId].slots);
    ship.buildWith(null);

    for (let i = 1; i < lines.length; i++) {
      let line = lines[i].trim();

      if (!line) { continue; }
      if (line.substring(0, 3) == '---') { break; }

      let parts = lineRegex.exec(line);

      if (!parts) { throw 'Error parsing: "' + line + '"'; }

      let typeSize = parts[1];
      let cl = parts[2];
      let rating = parts[3];
      let mount = parts[4];
      let missile = parts[5];
      let name = parts[6].trim();
      let slot, group;

      if (isNaN(typeSize)) {  // Standard or Hardpoint
        if (typeSize.length == 1) { // Hardpoint
          let slotClass = mountMap[typeSize];

          if (cl > slotClass) { throw cl + rating + ' ' + name + ' exceeds slot size: "' + line + '"'; }

          slot = ship.hardpoints.find(isEmptySlot, slotClass);

          if (!slot) { throw 'No hardpoint slot available for: "' + line + '"'; }

          group = ModuleNameToGroup[name.toLowerCase()];

          let hp = ModuleUtils.findHardpoint(group, cl, rating, group ? null : name, mount, missile);

          if (!hp) { throw 'Unknown component: "' + line + '"'; }

          ship.use(slot, hp, true);
        } else if (typeSize == 'BH') {
          let bhId = bhMap[name.toLowerCase()];

          if (bhId === undefined) { throw 'Unknown bulkhead: "' + line + '"'; }

          ship.useBulkhead(bhId, true);
        } else if (standardMap[typeSize] != undefined) {
          let standardIndex = standardMap[typeSize];

          if (ship.standard[standardIndex].maxClass < cl) { throw name + ' exceeds max class for the ' + ship.name; }

          ship.use(ship.standard[standardIndex], ModuleUtils.standard(standardIndex, cl + rating), true);
        } else {
          throw 'Unknown component: "' + line + '"';
        }
      } else {
        if (cl > typeSize) { throw cl + rating + ' ' + name + ' exceeds slot size: "' + line + '"'; }

        slot = ship.internal.find(isEmptySlot, typeSize);

        if (!slot) { throw 'No internal slot available for: "' + line + '"'; }

        group = ModuleNameToGroup[name.toLowerCase()];

        let intComp = ModuleUtils.findInternal(group, cl, rating, group ? null : name);

        if (!intComp) { throw 'Unknown component: "' + line + '"'; }

        ship.use(slot, intComp);
      }
    }

    let builds = {};
    builds[shipId] = {};
    builds[shipId]['Imported ' + buildName] = ship.toString();
    this.setState({ builds, singleBuild: true });
  }

  /**
   * Import SLEF formatted builds. Sets state to a map of the builds on success
   * and flags if there was only a single build.
   *
   * @param  {string} importData - Array of the list of builds.
   * @throws {string} If parse / import fails
   */
  _importSlefBuilds(importData) {
    const builds = importData.reduce((memo, { data }) => {
      const shipModel = shipModelFromJson(data);
      const ship = shipFromLoadoutJSON(data);
      const shipTemplate = Ships[shipModel];
      const shipName = data.ShipName || shipTemplate.properties.name;

      const key = `Imported ${shipName}`;
      memo[shipModel] = {};
      memo[shipModel][key] = ship.toString();

      return memo;
    }, {});

    this.setState({ builds, singleBuild: Object.keys(builds).length === 1 });
  }

  /**
   * Validate the import string / text box contents
   * @param  {SyntheticEvent} event Event
   * @throws {string} If validation fails
   */
  _validateImport(event) {
    let importData = null;
    let importString = event.target.value.trim();
    this.setState({
      builds: null,
      comparisons: null,
      shipDiscount: null,
      moduleDiscount: null,
      errorMsg: null,
      importValid: false,
      insurance: null,
      singleBuild: false,
      importString,
    });

    if (!importString) {
      return;
    }

    try {
      if (textBuildRegex.test(importString)) {  // E:D Shipyard build text
        this._importTextBuild(importString);
      } else {                                  // JSON Build data
        importData = JSON.parse(importString);

        if (!importData || typeof importData != 'object') {
          throw 'Must be an object or array!';
        }

        if (importData?.[0]?.header?.appName) { // has SLEF envelope?
          this._importSlefBuilds(importData);
        } else if (importData.modules != null && importData.modules.Armour != null) { // Only the companion API has this information
          this._importCompanionApiBuild(importData); // Single ship definition
        } else if (importData.ship != null && importData.ship.modules != null && importData.ship.modules.Armour != null) { // Only the companion API has this information
          this._importCompanionApiBuild(importData.ship); // Complete API dump
        } else if (importData instanceof Array) {   // Must be detailed export json
          this._importDetailedArray(importData);
        } else if (importData.ship && typeof importData.name !== undefined) { // Using JSON from a single ship build export
          this._importDetailedArray([importData]); // Convert to array with singleobject
          this.setState({ singleBuild: true });
        } else if (importData.Modules != null && importData.Modules[0] != null) {
          this._importLoadout(importData);
        } else { // Using Backup JSON
          this._importBackup(importData);
        }
      }
    } catch (e) {
      console.log(e);
      this.setState({ errorMsg: (typeof e == 'string') ? e : 'Cannot Parse the data!' });
      return;
    }

    this.setState({ importValid: true });
  };

  /**
   * Process imported data
   */
  _process() {
    let builds = null, comparisons = null;

    if (this.state.loadoutEvent) {
      return Router.go(`/import?data=${this.state.loadoutEvent}`);
    }

    // If only importing a single build go straight to the outfitting page
    if (this.state.singleBuild) {
      builds = this.state.builds;
      let shipId = Object.keys(builds)[0];
      let name = Object.keys(builds[shipId])[0];
      Router.go(outfitURL(shipId, builds[shipId][name], name));
      return;
    }


    if (this.state.builds) {
      builds = {};   // Create new builds object such that orginal name retained, but can be renamed
      for (let shipId in this.state.builds) {
        let shipbuilds = this.state.builds[shipId];
        builds[shipId] = {};
        for (let buildName in shipbuilds) {
          builds[shipId][buildName] = {
            code: shipbuilds[buildName],
            useName: buildName
          };
        }
      }
    }

    if (this.state.comparisons) {
      comparisons = {};
      for (let name in this.state.comparisons) {
        comparisons[name] = Object.assign({ useName: name }, this.state.comparisons[name]);
      }
    }

    this.setState({ processed: true, builds, comparisons });
  };

  /**
   * Import parsed, processed data and save
   */
  _import() {
    let state = this.state;
    if (state.builds) {
      let builds = state.builds;
      for (let shipId in builds) {
        for (let buildName in builds[shipId]) {
          let build = builds[shipId][buildName];
          let name = build.useName.trim();
          if (name) {
            Persist.saveBuild(shipId, name, build.code);
          }
        }
      }
    }

    if (state.comparisons) {
      let comparisons = state.comparisons;
      for (let comp in comparisons) {
        let comparison = comparisons[comp];
        let useName = comparison.useName.trim();
        if (useName) {
          Persist.saveComparison(useName, comparison.builds, comparison.facets);
        }
      }
    }

    if (state.shipDiscount !== undefined) {
      Persist.setShipDiscount(state.shipDiscount);
    }
    if (state.moduleDiscount !== undefined) {
      Persist.setModuleDiscount(state.moduleDiscount);
    }

    if (state.insurance) {
      Persist.setInsurance(state.insurance);
    }

    this.context.hideModal();
  };

  /**
   * Capture build name changes
   * @param  {Object} item          Build/Comparison import object
   * @param  {SyntheticEvent} e     Event
   */
  _changeName(item, e) {
    item.useName = e.target.value;
    this.forceUpdate();
  }

  /**
   * If imported data is already provided process immediately on mount
   */
  UNSAFE_componentWillMount() {
    if (this.props.builds) {
      this._process();
    }
  }
  /**
   * If textarea is shown focus on mount
   */
  componentDidMount() {
    if (!this.props.builds && this.importField) {
      this.importField.focus();
    }
  }

  /**
   * Render the import modal
   * @return {React.Component} Modal contents
   */
  render() {
    let translate = this.context.language.translate;
    let state = this.state;
    let importStage;

    if (!state.processed) {
      importStage = (
        <div>
          <textarea spellCheck={false} className='cb json' ref={node => this.importField = node} onChange={this._validateImport} defaultValue={this.state.importString} placeholder={translate('PHRASE_IMPORT')} />
          <button id='proceed' className='l cap' onClick={this._process} disabled={!state.importValid} >{translate('proceed')}</button>
          <div className='l warning' style={{ marginLeft:'3em' }}>{state.errorMsg}</div>
        </div>
      );
    } else {
      let comparisonTable, edit, buildRows = [];
      if (state.comparisons) {
        let comparisonRows = [];

        for (let name in state.comparisons) {
          let comparison = state.comparisons[name];
          let hasComparison = Persist.hasComparison(comparison.useName);
          comparisonRows.push(
            <tr key={name} className='cb'>
              <td>
                <input type='text' onChange={this._changeName.bind(this, comparison)} value={comparison.useName}/>
              </td>
              <td style={{ textAlign:'center' }} className={ cn('cap', { warning: hasComparison, disabled: comparison.useName == '' }) }>
                {translate(comparison.useName == '' ? 'skip' : (hasComparison ? 'overwrite' : 'create'))}
              </td>
            </tr>
          );
        }

        comparisonTable = (
          <table className='l' style={{ overflow:'hidden', margin: '1em 0', width: '100%' }} >
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>{translate('comparison')}</th>
                <th>{translate('action')}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows}
            </tbody>
          </table>
        );
      }

      if(this.state.canEdit) {
        edit = <button className='l cap' style={{ marginLeft: '2em' }} onClick={() => this.setState({ processed: false })}>{translate('edit data')}</button>;
      }

      let builds = this.state.builds;
      for (let shipId in builds) {
        let shipBuilds = builds[shipId];
        for (let buildName in shipBuilds) {
          let b = shipBuilds[buildName];
          let hasBuild = Persist.hasBuild(shipId, b.useName);
          buildRows.push(
            <tr key={shipId + buildName} className='cb'>
              <td>{Ships[shipId].properties.name}</td>
              <td><input type='text' onChange={this._changeName.bind(this, b)} value={b.useName}/></td>
              <td style={{ textAlign: 'center' }} className={cn('cap', { warning: hasBuild, disabled: b.useName == '' })}>
                {translate(b.useName == '' ? 'skip'  : (hasBuild ? 'overwrite' : 'create'))}
              </td>
            </tr>
          );
        }
      }

      importStage = (
        <div>
          <table className='l' style={{ overflow:'hidden', margin: '1em 0', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }} >{translate('ship')}</th>
                <th style={{ textAlign: 'left' }} >{translate('build name')}</th>
                <th>{translate('action')}</th>
              </tr>
            </thead>
            <tbody>
              {buildRows}
            </tbody>
          </table>
          {comparisonTable}
          <button id='import' className='cl l' onClick={this._import}><Download/> {translate('import')}</button>
          {edit}
        </div>
      );
    }

    return <div className='modal' onClick={ (e) => e.stopPropagation() }>
      <h2 >{translate('import')}</h2>
      {importStage}
      <button className={'r dismiss cap'} onClick={this.context.hideModal}>{translate('close')}</button>
    </div>;
  }
}
