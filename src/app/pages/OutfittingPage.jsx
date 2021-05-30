import React from 'react';
import { Ships } from 'coriolis-data/dist';
import cn from 'classnames';
import Page from './Page';
import Router from '../Router';
import Persist from '../stores/Persist';
import * as Utils from '../utils/UtilityFunctions';
import Ship from '../shipyard/Ship';
import * as _ from 'lodash';
import { toDetailedBuild } from '../shipyard/Serializer';
import { outfitURL } from '../utils/UrlGenerators';
import {
  FloppyDisk,
  Bin,
  Switch,
  Download,
  Reload,
  LinkIcon,
  ShoppingIcon,
  MatIcon,
} from '../components/SvgIcons';
import LZString from 'lz-string';
import ShipSummaryTable from '../components/ShipSummaryTable';
import StandardSlotSection from '../components/StandardSlotSection';
import HardpointSlotSection from '../components/HardpointSlotSection';
import InternalSlotSection from '../components/InternalSlotSection';
import UtilitySlotSection from '../components/UtilitySlotSection';
import Pips from '../components/Pips';
import Boost from '../components/Boost';
import Fuel from '../components/Fuel';
import Cargo from '../components/Cargo';
import ShipPicker from '../components/ShipPicker';
import EngagementRange from '../components/EngagementRange';
import OutfittingSubpages from '../components/OutfittingSubpages';
import ModalExport from '../components/ModalExport';
import ModalPermalink from '../components/ModalPermalink';
import ModalShoppingList from '../components/ModalShoppingList';

/**
 * Document Title Generator
 * @param  {String} shipName  Ship Name
 * @param  {String} buildName Build Name
 * @return {String}           Document title
 */
function getTitle(shipName, buildName) {
  return buildName ? buildName : shipName;
}

/**
 * The Outfitting Page
 */
export default class OutfittingPage extends Page {
  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props, context);
    this.state = this._initState(props, context);
    this._keyDown = this._keyDown.bind(this);
    this._exportBuild = this._exportBuild.bind(this);
    this._pipsUpdated = this._pipsUpdated.bind(this);
    this._boostUpdated = this._boostUpdated.bind(this);
    this._cargoUpdated = this._cargoUpdated.bind(this);
    this._fuelUpdated = this._fuelUpdated.bind(this);
    this._opponentUpdated = this._opponentUpdated.bind(this);
    this._engagementRangeUpdated = this._engagementRangeUpdated.bind(this);
    this._sectionMenuRefs = {};
  }

  /**
   * [Re]Create initial state from context
   * @param  {Object} props    React component properties
   * @param  {context} context React component context
   * @return {Object}          New state object
   */
  _initState(props, context) {
    let params = context.route.params;
    let shipId = params.ship;
    let code = params.code;
    let buildName = params.bn;
    let data = Ships[shipId]; // Retrieve the basic ship properties, slots and defaults
    let savedCode = Persist.getBuild(shipId, buildName);
    if (!data) {
      return { error: { message: 'Ship not found: ' + shipId } };
    }
    let ship = new Ship(shipId, data.properties, data.slots); // Create a new Ship instance
    if (code) {
      ship.buildFrom(code); // Populate modules from serialized 'code' URL param
    } else {
      ship.buildWith(data.defaults); // Populate with default components
    }

    this._getTitle = getTitle.bind(this, data.properties.name);

    // Obtain ship control from code
    const {
      sys,
      eng,
      wep,
      mcSys,
      mcEng,
      mcWep,
      boost,
      fuel,
      cargo,
      opponent,
      opponentBuild,
      opponentSys,
      opponentEng,
      opponentWep,
      engagementRange
    } = this._obtainControlFromCode(ship, code);
    return {
      error: null,
      title: this._getTitle(buildName),
      costTab: Persist.getCostTab() || 'costs',
      buildName,
      newBuildName: buildName,
      shipId,
      ship,
      code,
      savedCode,
      sys,
      eng,
      wep,
      mcSys,
      mcEng,
      mcWep,
      boost,
      fuel,
      cargo,
      opponent,
      opponentBuild,
      opponentSys,
      opponentEng,
      opponentWep,
      engagementRange
    };
  }

  /**
   * Handle build name change and update state
   * @param  {SyntheticEvent} event React Event
   */
  _buildNameChange(event) {
    let stateChanges = {
      newBuildName: event.target.value
    };

    if (Persist.hasBuild(this.state.shipId, stateChanges.newBuildName)) {
      stateChanges.savedCode = Persist.getBuild(
        this.state.shipId,
        stateChanges.newBuildName
      );
    } else {
      stateChanges.savedCode = null;
    }

    this.setState(stateChanges);
  }

  /**
   * Update the control part of the route
   */
  _updateRouteOnControlChange() {
    const { ship, shipId, buildName } = this.state;
    const code = this._fullCode(ship);
    this._updateRoute(shipId, buildName, code);
    this.setState({ code });
  }

  /**
   * Provide a full code for this ship, including any additions due to the outfitting page
   * @param   {Object}  ship  the ship
   * @param   {number}  fuel  the fuel carried by the ship (if different from that in state)
   * @param   {number}  cargo the cargo carried by the ship (if different from that in state)
   * @returns {string}        the code for this ship
   */
  _fullCode(ship, fuel, cargo) {
    return `${ship.toString()}.${LZString.compressToBase64(
      this._controlCode(fuel, cargo)
    )}`;
  }

  /**
   * Obtain the control information from the build code
   * @param   {Object} ship    The ship
   * @param   {string} code    The build code
   * @returns {Object}         The control information
   */
  _obtainControlFromCode(ship, code) {
    // Defaults
    let sys = 2;
    let eng = 2;
    let wep = 2;
    let mcSys = 0;
    let mcEng = 0;
    let mcWep = 0;
    let boost = false;
    let fuel = ship.fuelCapacity;
    let cargo = ship.cargoCapacity;
    let opponent = new Ship(
      'eagle',
      Ships['eagle'].properties,
      Ships['eagle'].slots
    ).buildWith(Ships['eagle'].defaults);
    let opponentSys = 2;
    let opponentEng = 2;
    let opponentWep = 2;
    let opponentBuild;
    let engagementRange = 1000;

    // Obtain updates from code, if available
    if (code) {
      const parts = code.split('.');
      if (parts.length >= 5) {
        // We have control information in the code
        const control = LZString.decompressFromBase64(
          Utils.fromUrlSafe(parts[4])
        ).split('/');
        sys = parseFloat(control[0]);
        eng = parseFloat(control[1]);
        wep = parseFloat(control[2]);
        if (sys + eng + wep > 6) {
          sys = eng = wep = 2;
        }
        boost = control[3] == 1 ? true : false;
        fuel = parseFloat(control[4]) || fuel;
        cargo = parseInt(control[5]) || cargo;
        if (control[6]) {
          const shipId = control[6];
          opponent = new Ship(
            shipId,
            Ships[shipId].properties,
            Ships[shipId].slots
          );
          if (control[7] && Persist.getBuild(shipId, control[7])) {
            // Ship is a particular build
            const opponentCode = Persist.getBuild(shipId, control[7]);
            opponent.buildFrom(opponentCode);
            opponentBuild = control[7];
            if (opponentBuild) {
              // Obtain opponent's sys/eng/wep pips from their code
              const opponentParts = opponentCode.split('.');
              if (opponentParts.length >= 5) {
                const opponentControl = LZString.decompressFromBase64(
                  Utils.fromUrlSafe(opponentParts[4])
                ).split('/');
                opponentSys = parseFloat(opponentControl[0]) || opponentSys;
                opponentEng = parseFloat(opponentControl[1]) || opponentEng;
                opponentWep = parseFloat(opponentControl[2]) || opponentWep;
              }
            }
          } else {
            // Ship is a stock build
            opponent.buildWith(Ships[shipId].defaults);
          }
        }
        engagementRange = parseInt(control[8]) || engagementRange;

        // Multi-crew pips were introduced later on so assign default values
        // because those values might not be present.
        mcSys = parseInt(control[9]) || mcSys;
        mcEng = parseInt(control[10]) || mcEng;
        mcWep = parseInt(control[11]) || mcWep;
      }
    }

    return {
      sys,
      eng,
      wep,
      mcSys,
      mcEng,
      mcWep,
      boost,
      fuel,
      cargo,
      opponent,
      opponentBuild,
      opponentSys,
      opponentEng,
      opponentWep,
      engagementRange
    };
  }

  /**
   * Triggered when pips have been updated. Multi-crew pips are already included
   * in sys, eng and wep but mcSys, mcEng and mcWep make clear where each pip
   * comes from.
   * @param {number} sys    SYS pips
   * @param {number} eng    ENG pips
   * @param {number} wep    WEP pips
   * @param {number} mcSys  SYS pips from multi-crew
   * @param {number} mcEng  ENG pips from multi-crew
   * @param {number} mcWep  WEP pips from multi-crew
   */
  _pipsUpdated(sys, eng, wep, mcSys, mcEng, mcWep) {
    this.setState({ sys, eng, wep, mcSys, mcEng, mcWep }, () =>
      this._updateRouteOnControlChange()
    );
  }

  /**
   * Triggered when boost has been updated
   * @param {boolean} boost true if boosting
   */
  _boostUpdated(boost) {
    this.setState({ boost }, () => this._updateRouteOnControlChange());
  }

  /**
   * Triggered when fuel has been updated
   * @param {number} fuel the amount of fuel, in T
   */
  _fuelUpdated(fuel) {
    this.setState({ fuel }, () => this._updateRouteOnControlChange());
  }

  /**
   * Triggered when cargo has been updated
   * @param {number} cargo the amount of cargo, in T
   */
  _cargoUpdated(cargo) {
    this.setState({ cargo }, () => this._updateRouteOnControlChange());
  }

  /**
   * Triggered when engagement range has been updated
   * @param {number} engagementRange the engagement range, in m
   */
  _engagementRangeUpdated(engagementRange) {
    this.setState({ engagementRange }, () =>
      this._updateRouteOnControlChange()
    );
  }

  /**
   * Triggered when target ship has been updated
   * @param {string} opponent       the opponent's ship model
   * @param {string} opponentBuild  the name of the opponent's build
   */
  _opponentUpdated(opponent, opponentBuild) {
    const opponentShip = new Ship(
      opponent,
      Ships[opponent].properties,
      Ships[opponent].slots
    );
    let opponentSys = this.state.opponentSys;
    let opponentEng = this.state.opponentEng;
    let opponentWep = this.state.opponentWep;
    if (opponentBuild && Persist.getBuild(opponent, opponentBuild)) {
      // Ship is a particular build
      opponentShip.buildFrom(Persist.getBuild(opponent, opponentBuild));
      // Set pips for opponent
      const opponentParts = Persist.getBuild(opponent, opponentBuild).split(
        '.'
      );
      if (opponentParts.length >= 5) {
        const opponentControl = LZString.decompressFromBase64(
          Utils.fromUrlSafe(opponentParts[4])
        ).split('/');
        opponentSys = parseFloat(opponentControl[0]);
        opponentEng = parseFloat(opponentControl[1]);
        opponentWep = parseFloat(opponentControl[2]);
      }
    } else {
      // Ship is a stock build
      opponentShip.buildWith(Ships[opponent].defaults);
      opponentSys = 2;
      opponentEng = 2;
      opponentWep = 2;
    }

    this.setState(
      {
        opponent: opponentShip,
        opponentBuild,
        opponentSys,
        opponentEng,
        opponentWep
      },
      () => this._updateRouteOnControlChange()
    );
  }

  /**
   * Set the control code for this outfitting page
   * @param   {number}  fuel  the fuel carried by the ship (if different from that in state)
   * @param   {number}  cargo the cargo carried by the ship (if different from that in state)
   * @returns {string}        The control code
   */
  _controlCode(fuel, cargo) {
    const {
      sys,
      eng,
      wep,
      mcSys,
      mcEng,
      mcWep,
      boost,
      opponent,
      opponentBuild,
      engagementRange
    } = this.state;
    const code = `${sys}/${eng}/${wep}/${boost ? 1 : 0}/${fuel ||
      this.state.fuel}/${cargo || this.state.cargo}/${opponent.id}/${
      opponentBuild ? opponentBuild : ''
    }/${engagementRange}/${mcSys}/${mcEng}/${mcWep}`;
    return code;
  }

  /**
   * Save the current build
   */
  _saveBuild() {
    const { ship, buildName, newBuildName, shipId } = this.state;

    // If this is a stock ship the code won't be set, so ensure that we have it
    const code = this.state.code || ship.toString();

    Persist.saveBuild(shipId, newBuildName, code);
    this._updateRoute(shipId, newBuildName, code);

    let opponent, opponentBuild, opponentSys, opponentEng, opponentWep;
    if (
      shipId === this.state.opponent.id &&
      buildName === this.state.opponentBuild
    ) {
      // This is a save of our current opponent build; update it
      opponentBuild = newBuildName;
      opponent = new Ship(
        shipId,
        Ships[shipId].properties,
        Ships[shipId].slots
      ).buildFrom(code);
      opponentSys = this.state.sys;
      opponentEng = this.state.eng;
      opponentWep = this.state.wep;
    } else {
      opponentBuild = this.state.opponentBuild;
      opponent = this.state.opponent;
      opponentSys = this.state.opponentSys;
      opponentEng = this.state.opponentEng;
      opponentWep = this.state.opponentWep;
    }
    this.setState({
      buildName: newBuildName,
      code,
      savedCode: code,
      opponent,
      opponentBuild,
      opponentSys,
      opponentEng,
      opponentWep,
      title: this._getTitle(newBuildName)
    });
  }

  /**
   * Rename the current build
   */
  _renameBuild() {
    const { code, buildName, newBuildName, shipId, ship } = this.state;
    if (buildName != newBuildName && newBuildName.length) {
      Persist.deleteBuild(shipId, buildName);
      Persist.saveBuild(shipId, newBuildName, code);
      this._updateRoute(shipId, newBuildName, code);
      this.setState({
        buildName: newBuildName,
        code,
        savedCode: code,
        opponentBuild: newBuildName
      });
    }
  }

  /**
   * Reload build from last save
   */
  _reloadBuild() {
    this.setState({ code: this.state.savedCode }, () => this._codeUpdated());
  }

  /**
   * Reset build to Stock/Factory defaults
   */
  _resetBuild() {
    const { ship, shipId, buildName } = this.state;
    // Rebuild ship
    ship.buildWith(Ships[shipId].defaults);
    // Reset controls
    const code = ship.toString();
    const {
      sys,
      eng,
      wep,
      mcSys,
      mcEng,
      mcWep,
      boost,
      fuel,
      cargo,
      opponent,
      opponentBuild,
      engagementRange
    } = this._obtainControlFromCode(ship, code);
    // Update state, and refresh the ship
    this.setState(
      {
        sys,
        eng,
        wep,
        mcSys,
        mcEng,
        mcWep,
        boost,
        fuel,
        cargo,
        opponent,
        opponentBuild,
        engagementRange
      },
      () => this._updateRoute(shipId, buildName, code)
    );
  }

  /**
   * Delete the build
   */
  _deleteBuild() {
    const { shipId, buildName } = this.state;
    Persist.deleteBuild(shipId, buildName);

    let opponentBuild;
    if (
      shipId === this.state.opponent.id &&
      buildName === this.state.opponentBuild
    ) {
      // Our current opponent has been deleted; revert to stock
      opponentBuild = null;
    } else {
      opponentBuild = this.state.opponentBuild;
    }
    Router.go(outfitURL(this.state.shipId));

    this.setState({ opponentBuild });
  }

  /**
   * Serialized and show the export modal
   */
  _exportBuild() {
    let translate = this.context.language.translate;
    let { buildName, ship } = this.state;
    this.context.showModal(
      <ModalExport
        title={(buildName || ship.name) + ' ' + translate('export')}
        description={translate('PHRASE_EXPORT_DESC')}
        data={toDetailedBuild(buildName, ship, ship.toString())}
      />
    );
  }

  /**
   * Called when the code for the ship has been updated, to synchronise the rest of the data
   */
  _codeUpdated() {
    const { code, ship, shipId, buildName } = this.state;

    // Rebuild ship from the code
    this.state.ship.buildFrom(code);

    // Obtain controls from the code
    const {
      sys,
      eng,
      wep,
      mcSys,
      mcEng,
      mcWep,
      boost,
      fuel,
      cargo,
      opponent,
      opponentBuild,
      engagementRange
    } = this._obtainControlFromCode(ship, code);
    // Update state, and refresh the route when complete
    this.setState(
      {
        sys,
        eng,
        wep,
        mcSys,
        mcEng,
        mcWep,
        boost,
        fuel,
        cargo,
        opponent,
        opponentBuild,
        engagementRange
      },
      () => this._updateRoute(shipId, buildName, code)
    );
  }

  /**
   * Called when the ship has been updated, to set the code and then update accordingly
   */
  _shipUpdated() {
    let { ship, shipId, buildName, cargo, fuel } = this.state;
    if (cargo > ship.cargoCapacity) {
      cargo = ship.cargoCapacity;
    }
    if (fuel > ship.fuelCapacity) {
      fuel = ship.fuelCapacity;
    }
    const code = this._fullCode(ship, fuel, cargo);
    // Only update the state if this really has been updated
    if (
      this.state.code != code ||
      this.state.cargo != cargo ||
      this.state.fuel != fuel
    ) {
      this.setState({ code, cargo, fuel }, () =>
        this._updateRoute(shipId, buildName, code)
      );
    }
  }

  /**
   * Update the current route based on build
   * @param  {string} shipId    Ship Id
   * @param  {string} buildName Current build name
   * @param  {string} code      Serialized ship 'code'
   */
  _updateRoute(shipId, buildName, code) {
    Router.replace(outfitURL(shipId, code, buildName));
  }

  /**
   * Update state based on context changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next conext
   */
  componentWillReceiveProps(nextProps, nextContext) {
    if (this.context.route !== nextContext.route) {
      // Only reinit state if the route has changed
      this.setState(this._initState(nextProps, nextContext));
    }
  }

  /**
   * Add listeners when about to mount
   */
  componentWillMount() {
    document.addEventListener('keydown', this._keyDown);
  }

  /**
   * Remove listeners on unmount
   */
  componentWillUnmount() {
    document.removeEventListener('keydown', this._keyDown);
  }

  /**
   * Generates the short URL
   */
  _genShortlink() {
    this.context.showModal(<ModalPermalink url={window.location.href} />);
  }

  /**
   * Open up a window for EDDB with a shopping list of our components
   */
  _eddbShoppingList() {
    const ship = this.state.ship;

    const shipId = Ships[ship.id].eddbID;
    // Provide unique list of non-PP module EDDB IDs
    const modIds = ship.internal
      .concat(ship.bulkheads, ship.standard, ship.hardpoints)
      .filter(slot => slot !== null && slot.m !== null && !slot.m.pp)
      .map(slot => slot.m.eddbID)
      .filter((v, i, a) => a.indexOf(v) === i);

    // Open up the relevant URL
    window.open(
      'https://eddb.io/station?s=' + shipId + '&m=' + modIds.join(',')
    );
  }

  /**
   * Generates the shopping list
   */
  _genShoppingList() {
    this.context.showModal(<ModalShoppingList ship={this.state.ship} />);
  }

  /**
   * Handle Key Down
   * @param  {Event} e  Keyboard Event
   */
  _keyDown(e) {
    // .keyCode will eventually be replaced with .key
    switch (e.keyCode) {
      case 69: // 'e'
        if (e.ctrlKey || e.metaKey) {
          // CTRL/CMD + e
          e.preventDefault();
          this._exportBuild();
        }
        break;
    }
  }

  /**
   * Render the Page
   * @return {React.Component} The page contents
   */
  renderPage() {
    let state = this.state,
        { language, termtip, tooltip, sizeRatio, onWindowResize } = this.context,
        { translate, units, formats } = language,
        {
          ship,
          code,
          savedCode,
          buildName,
          newBuildName,
          sys,
          eng,
          wep,
          mcSys,
          mcEng,
          mcWep,
          boost,
          fuel,
          cargo,
          opponent,
          opponentBuild,
          opponentSys,
          opponentEng,
          opponentWep,
          engagementRange
        } = state,
        hide = tooltip.bind(null, null),
        menu = this.props.currentMenu,
        shipUpdated = this._shipUpdated,
        canSave = (newBuildName || buildName) && code !== savedCode,
        canRename = buildName && newBuildName && buildName != newBuildName,
        canReload = savedCode && canSave;

    // Code can be blank for a default loadout.  Prefix it with the ship name to ensure that changes in default ships is picked up
    code = ship.name + (code || '');

    // Markers are used to propagate state changes without requiring a deep comparison of the ship, as that takes a long time
    const _sStr = ship.getStandardString();
    const _iStr = ship.getInternalString();
    const _hStr = ship.getHardpointsString();
    const _pStr = `${ship.getPowerEnabledString()}${ship.getPowerPrioritiesString()}`;
    const _mStr = ship.getModificationsString();

    const standardSlotMarker = `${ship.name}${_sStr}${_pStr}${_mStr}${
      ship.ladenMass
    }${cargo}${fuel}`;
    const internalSlotMarker = `${ship.name}${_iStr}${_pStr}${_mStr}`;
    const hardpointsSlotMarker = `${ship.name}${_hStr}${_pStr}${_mStr}`;
    const boostMarker = `${ship.canBoost(cargo, fuel)}`;
    const shipSummaryMarker = `${
      ship.name
    }${_sStr}${_iStr}${_hStr}${_pStr}${_mStr}${ship.ladenMass}${cargo}${fuel}`;

    const requirements = Ships[ship.id].requirements;
    let requirementElements = [];
    /**
     * Render the requirements for a ship / etc
     * @param {string} className Class names
     * @param {string} textKey The key for translating
     * @param {String} tooltipTextKey  Tooltip key
     */
    function renderRequirement(className, textKey, tooltipTextKey) {
      if (textKey.startsWith('empire') || textKey.startsWith('federation')) {
        requirementElements.push(
          <div
            key={textKey}
            className={className}
            onMouseEnter={termtip.bind(null, tooltipTextKey)}
            onMouseLeave={hide}
          >
            <a
              href={
                textKey.startsWith('empire') ?
                  'http://elite-dangerous.wikia.com/wiki/Empire/Ranks' :
                  'http://elite-dangerous.wikia.com/wiki/Federation/Ranks'
              }
              target="_blank"
              rel="noopener"
            >
              {translate(textKey)}
            </a>
          </div>
        );
      } else {
        requirementElements.push(
          <div
            key={textKey}
            className={className}
            onMouseEnter={termtip.bind(null, tooltipTextKey)}
            onMouseLeave={hide}
          >
            {translate(textKey)}
          </div>
        );
      }
    }

    if (requirements) {
      requirements.federationRank &&
        renderRequirement(
          'federation',
          'federation rank ' + requirements.federationRank,
          'federation rank required'
        );
      requirements.empireRank &&
        renderRequirement(
          'empire',
          'empire rank ' + requirements.empireRank,
          'empire rank required'
        );
      requirements.horizons &&
        renderRequirement('horizons', 'horizons', 'horizons required');
      requirements.horizonsEarlyAdoption &&
        renderRequirement(
          'horizons',
          'horizons early adoption',
          'horizons early adoption required'
        );
    }

    return (
      <div
        id="outfit"
        className={'page'}
        style={{ fontSize: sizeRatio * 0.9 + 'em' }}
      >
        <div id="overview">
          <h1>{ship.name}</h1>
          <div id="requirements">{requirementElements}</div>
          <div id="build">
            <input
              value={newBuildName || ''}
              onChange={this._buildNameChange}
              placeholder={translate('Enter Name')}
              maxLength={50}
            />
            <button
              onClick={canSave && this._saveBuild}
              disabled={!canSave}
              onMouseOver={termtip.bind(null, 'save')}
              onMouseOut={hide}
            >
              <FloppyDisk className="lg" />
            </button>
            <button
              onClick={canRename && this._renameBuild}
              disabled={!canRename}
              onMouseOver={termtip.bind(null, 'rename')}
              onMouseOut={hide}
            >
              <span style={{ textTransform: 'none', fontSize: '1.8em' }}>
                a|
              </span>
            </button>
            <button
              onClick={canReload && this._reloadBuild}
              disabled={!canReload}
              onMouseOver={termtip.bind(null, 'reload')}
              onMouseOut={hide}
            >
              <Reload className="lg" />
            </button>
            <button
              className={'danger'}
              onClick={savedCode && this._deleteBuild}
              disabled={!savedCode}
              onMouseOver={termtip.bind(null, 'delete')}
              onMouseOut={hide}
            >
              <Bin className="lg" />
            </button>
            <button
              onClick={code && this._resetBuild}
              disabled={!code}
              onMouseOver={termtip.bind(null, 'reset')}
              onMouseOut={hide}
            >
              <Switch className="lg" />
            </button>
            <button
              onClick={buildName && this._exportBuild}
              disabled={!buildName}
              onMouseOver={termtip.bind(null, 'export')}
              onMouseOut={hide}
            >
              <Download className="lg" />
            </button>
            <button
              onClick={this._eddbShoppingList}
              onMouseOver={termtip.bind(null, 'PHRASE_SHOPPING_LIST')}
              onMouseOut={hide}
            >
              <ShoppingIcon className="lg" />
            </button>
            <button
              onClick={this._genShortlink}
              onMouseOver={termtip.bind(null, 'shortlink')}
              onMouseOut={hide}
            >
              <LinkIcon className="lg" />
            </button>
            <button
              onClick={this._genShoppingList}
              onMouseOver={termtip.bind(null, 'PHRASE_SHOPPING_MATS')}
              onMouseOut={hide}
            >
              <MatIcon className="lg" />
            </button>
          </div>
        </div>

        {/* Main tables */}
        <ShipSummaryTable
          ship={ship}
          fuel={fuel}
          cargo={cargo}
          marker={shipSummaryMarker}
          pips={{
            sys: this.state.sys,
            wep: this.state.wep,
            eng: this.state.eng
          }}
        />
        <StandardSlotSection
          ship={ship}
          fuel={fuel}
          cargo={cargo}
          code={standardSlotMarker}
          onChange={shipUpdated}
          onCargoChange={this._cargoUpdated}
          onFuelChange={this._fuelUpdated}
          currentMenu={menu}
          sectionMenuRefs={this._sectionMenuRefs}
        />
        <InternalSlotSection
          ship={ship}
          code={internalSlotMarker}
          onChange={shipUpdated}
          onCargoChange={this._cargoUpdated}
          onFuelChange={this._fuelUpdated}
          currentMenu={menu}
          sectionMenuRefs={this._sectionMenuRefs}
        />
        <HardpointSlotSection
          ship={ship}
          code={hardpointsSlotMarker}
          onChange={shipUpdated}
          onCargoChange={this._cargoUpdated}
          onFuelChange={this._fuelUpdated}
          currentMenu={menu}
          sectionMenuRefs={this._sectionMenuRefs}
        />
        <UtilitySlotSection
          ship={ship}
          code={hardpointsSlotMarker}
          onChange={shipUpdated}
          onCargoChange={this._cargoUpdated}
          onFuelChange={this._fuelUpdated}
          currentMenu={menu}
          sectionMenuRefs={this._sectionMenuRefs}
        />

        {/* Control of ship and opponent */}
        <div className="group quarter">
          <div className="group half">
            <h2 style={{ verticalAlign: 'middle', textAlign: 'left' }}>
              {translate('ship control')}
            </h2>
          </div>
          <div className="group half">
            <Boost
              marker={boostMarker}
              ship={ship}
              boost={boost}
              onChange={this._boostUpdated}
            />
          </div>
        </div>
        <div className="group quarter">
          <Pips
            sys={sys}
            eng={eng}
            wep={wep}
            mcSys={mcSys}
            mcEng={mcEng}
            mcWep={mcWep}
            onChange={this._pipsUpdated}
          />
        </div>
        <div className="group quarter">
          <Fuel
            fuelCapacity={ship.fuelCapacity}
            fuel={fuel}
            onChange={this._fuelUpdated}
          />
        </div>
        <div className="group quarter">
          {ship.cargoCapacity > 0 ? (
            <Cargo
              cargoCapacity={ship.cargoCapacity}
              cargo={cargo}
              onChange={this._cargoUpdated}
            />
          ) : null}
        </div>
        <div className="group half">
          <div className="group quarter">
            <h2 style={{ verticalAlign: 'middle', textAlign: 'left' }}>
              {translate('opponent')}
            </h2>
          </div>
          <div className="group threequarters">
            <ShipPicker
              ship={opponent.id}
              build={opponentBuild}
              onChange={this._opponentUpdated}
            />
          </div>
        </div>
        <div className="group half">
          <EngagementRange
            ship={ship}
            engagementRange={engagementRange}
            onChange={this._engagementRangeUpdated}
          />
        </div>

        {/* Tabbed subpages */}
        <OutfittingSubpages
          ship={ship}
          code={code}
          buildName={buildName}
          onChange={shipUpdated}
          sys={sys}
          eng={eng}
          wep={wep}
          boost={boost}
          cargo={cargo}
          fuel={fuel}
          engagementRange={engagementRange}
          opponent={opponent}
          opponentBuild={opponentBuild}
          opponentSys={opponentSys}
          opponentEng={opponentEng}
          opponentWep={opponentWep}
        />
      </div>
    );
  }
}
