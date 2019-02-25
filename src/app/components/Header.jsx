import React from 'react';
import TranslatedComponent from './TranslatedComponent';
import { Languages } from '../i18n/Language';
import { Insurance } from '../shipyard/Constants';
import Link from './Link';
import ActiveLink from './ActiveLink';
import cn from 'classnames';
import { Cogs, CoriolisLogo, Hammer, Help, Rocket, StatsBars } from './SvgIcons';
import { Ships } from 'coriolis-data/dist';
import Persist from '../stores/Persist';
import { toDetailedExport } from '../shipyard/Serializer';
import Ship from '../shipyard/Ship';
import ModalBatchOrbis from './ModalBatchOrbis';
import ModalDeleteAll from './ModalDeleteAll';
import ModalExport from './ModalExport';
import ModalHelp from './ModalHelp';
import ModalImport from './ModalImport';
import Slider from './Slider';
import Announcement from './Announcement';
import { outfitURL } from '../utils/UrlGenerators';

const SIZE_MIN = 0.65;
const SIZE_RANGE = 0.55;

/**
 * Normalize percentages to 'clean' values
 * @param  {Number} val Percentage value
 * @return {Number}     Normalized value
 */
function normalizePercent(val) {
  if (val === '' || isNaN(val)) {
    return 0;
  }
  val = Math.round(val * 1000) / 1000;
  return val >= 100 ? 100 : val;
}

/**
 * Rounds the value to the nearest quarter (0, 0.25, 0.5, 0.75)
 * @param  {Number} val Value
 * @return {Number}     Rounded value
 */
function nearestQtrPct(val) {
  return  Math.round(val * 4) / 4;
}

/**
 * Select all text in a field
 * @param {SyntheticEvent} e Event
 */
function selectAll(e) {
  e.target.select();
}

/**
 * Coriolis App Header section / menus
 */
export default class Header extends TranslatedComponent {

	/**
	 * Constructor
	 * @param  {Object} props   React Component properties
	 * @param  {Object} context React Component context
	 */
  constructor(props, context) {
    super(props);
    this.shipOrder = Object.keys(Ships).sort();

    this._setLanguage = this._setLanguage.bind(this);
    this._setInsurance = this._setInsurance.bind(this);
    this._setShipDiscount = this._setShipDiscount.bind(this);
    this._changeShipDiscount = this._changeShipDiscount.bind(this);
    this._kpShipDiscount = this._kpShipDiscount.bind(this);
    this._setModuleDiscount = this._setModuleDiscount.bind(this);
    this._changeModuleDiscount = this._changeModuleDiscount.bind(this);
    this._kpModuleDiscount = this._kpModuleDiscount.bind(this);
    this._openShips = this._openMenu.bind(this, 's');
    this._openBuilds = this._openMenu.bind(this, 'b');
    this._openComp = this._openMenu.bind(this, 'comp');
    this._openAnnounce = this._openMenu.bind(this, 'announce');
    this._getAnnouncementsMenu = this._getAnnouncementsMenu.bind(this);
    this._openSettings = this._openMenu.bind(this, 'settings');
    this._showHelp = this._showHelp.bind(this);
    this.update = this.update.bind(this);
    this.languageOptions = [];
    this.insuranceOptions = [];
    this.state = {
      shipDiscount:  normalizePercent(Persist.getShipDiscount() * 100),
      moduleDiscount: normalizePercent(Persist.getModuleDiscount() * 100),
    };

    let translate = context.language.translate;

    for (let langCode in Languages) {
      this.languageOptions.push(<option key={langCode} value={langCode}>{Languages[langCode]}</option>);
    }

    for (let name in Insurance) {
      this.insuranceOptions.push(<option key={name} value={name}>{translate(name)}</option>);
    }
  }

  /**
   * Update insurance level
   * @param  {SyntheticEvent} e Event
   */
  _setInsurance(e) {
    Persist.setInsurance(e.target.value);
  }

  /**
   * Update the Module discount
   */
  _setModuleDiscount() {
    let moduleDiscount = normalizePercent(this.state.moduleDiscount);
    this.setState({ moduleDiscount });
    Persist.setModuleDiscount(moduleDiscount / 100);  // Decimal value is stored
  }

  /**
   * Update the Ship discount
   */
  _setShipDiscount() {
    let shipDiscount = normalizePercent(this.state.shipDiscount);
    this.setState({ shipDiscount });
    Persist.setShipDiscount(shipDiscount / 100);  // Decimal value is stored
  }

  /**
   * Input handler for the module discount field
   * @param {SyntheticEvent} e Event
   */
  _changeModuleDiscount(e) {
    let moduleDiscount = e.target.value;

    if (e.target.value === '' || e.target.value === '-' || e.target.value === '.') {
      this.setState({ moduleDiscount });
    } else if (!isNaN(moduleDiscount) && Math.round(moduleDiscount) < 100) {
      this.setState({ moduleDiscount });
    }
  }

  /**
   * Input handler for the ship discount field
   * @param  {SyntheticEvent} e Event
   */
  _changeShipDiscount(e) {
    let shipDiscount = e.target.value;

    if (e.target.value === '' || e.target.value === '-' || e.target.value === '.') {
      this.setState({ shipDiscount });
    } else if (!isNaN(shipDiscount) && Math.round(shipDiscount) < 100) {
      this.setState({ shipDiscount });
    }
  }

  /**
   * Key down/press handler for ship discount field
   * @param  {SyntheticEvent} e Event
   */
  _kpShipDiscount(e) {
    let sd = this.state.shipDiscount * 1;
    switch (e.keyCode) {
      case 38:
        e.preventDefault();
        this.setState({ shipDiscount: e.shiftKey ? nearestQtrPct(sd + 0.25) : normalizePercent(sd + 1) });
        break;
      case 40:
        e.preventDefault();
        this.setState({ shipDiscount: e.shiftKey ? nearestQtrPct(sd - 0.25) : normalizePercent(sd - 1) });
        break;
      case 13:
        e.preventDefault();
        e.target.blur();
    }
  }

  /**
   * Key down/press handler for module discount field
   * @param  {SyntheticEvent} e Event
   */
  _kpModuleDiscount(e) {
    let md = this.state.moduleDiscount * 1;
    switch (e.keyCode) {
      case 38:
        e.preventDefault();
        this.setState({ moduleDiscount: e.shiftKey ? nearestQtrPct(md + 0.25) : normalizePercent(md + 1) });
        break;
      case 40:
        e.preventDefault();
        this.setState({ moduleDiscount: e.shiftKey ? nearestQtrPct(md - 0.25) : normalizePercent(md - 1) });
        break;
      case 13:
        e.preventDefault();
        e.target.blur();
    }
  }

  /**
   * Update the current language
   * @param  {SyntheticEvent} e Event
   */
  _setLanguage(e) {
    Persist.setLangCode(e.target.value);
  }

  /**
   * Toggle tooltips setting
   */
  _toggleTooltips() {
    Persist.showTooltips(!Persist.showTooltips());
  }

  /**
   * Toggle module resistances setting
   */
  _toggleModuleResistances() {
    Persist.showModuleResistances(!Persist.showModuleResistances());
  }

  /**
   * Show delete all modal
   * @param  {SyntheticEvent} e Event
   */
  _showDeleteAll(e) {
    e.preventDefault();
    this.context.showModal(<ModalDeleteAll />);
  };

  /**
   * Show export modal with backup data
   * @param  {SyntheticEvent} e Event
   */
  _showBackup(e) {
    let translate = this.context.language.translate;
    e.preventDefault();
    this.context.showModal(<ModalExport
      title={translate('backup')}
      description={translate('PHRASE_BACKUP_DESC')}
      data={Persist.getAll()}
    />);
  };

  /**
   * Uploads all ship-builds to orbis
   * @param {e} e Event
   */
  _uploadAllBuildsToOrbis(e) {
    e.preventDefault();
    const data = Persist.getBuilds();
    let postObject = [];
    for (const ship in data) {
      for (const code in data[ship]) {
        const shipModel = ship;
        if (!shipModel) {
          throw 'No such ship found: "' + ship + '"';
        }
        const shipTemplate = Ships[shipModel];
        const shipPostObject = {};
        let shipInstance = new Ship(shipModel, shipTemplate.properties, shipTemplate.slots);
        shipInstance.buildWith(null);
        shipInstance.buildFrom(data[ship][code]);
        shipPostObject.coriolisId = shipInstance.id;
        shipPostObject.coriolisShip = shipInstance;

        shipPostObject.coriolisShip.url = window.location.origin + outfitURL(shipModel, data[ship][code], code);
        shipPostObject.title = code || shipInstance.id;
        shipPostObject.description = code || shipInstance.id;
        shipPostObject.ShipName = shipInstance.id;
        shipPostObject.Ship = shipInstance.id;
        postObject.push(shipPostObject);
      }
    }
    console.log(postObject);

    this.context.showModal(<ModalBatchOrbis
      ships={postObject}
    />);
  }

  /**
   * Show export modal with detailed export
   * @param  {SyntheticEvent} e Event
   */
  _showDetailedExport(e) {
    let translate = this.context.language.translate;
    e.preventDefault();

    this.context.showModal(<ModalExport
      title={translate('detailed export')}
      description={translate('PHRASE_EXPORT_DESC')}
      data={toDetailedExport(Persist.getBuilds())}
    />);
  }

  /**
   * Show help modal
   * @param  {SyntheticEvent} e Event
   */
  _showHelp(e) {
    let translate = this.context.language.translate;
    e.preventDefault();

    this.context.showModal(<ModalHelp title={translate('help')} />);
  }

  /**
   * Show import modal
   * @param  {SyntheticEvent} e Event
   */
  _showImport(e) {
    e.preventDefault();
    this.context.showModal(<ModalImport/>);
  }

  /**
   * Update the app scale / size ratio
   * @param {number} scale scale Size Ratio
   */
  _setTextSize(scale) {
    Persist.setSizeRatio((scale * SIZE_RANGE) + SIZE_MIN);
  }

  /**
   * Reset the app scale / size ratio
   */
  _resetTextSize() {
    Persist.setSizeRatio(1);
  }

  /**
   * Open a menu
   * @param  {string} menu          Menu name
   * @param  {SyntheticEvent} event Event
   */
  _openMenu(menu, event) {
    event.stopPropagation();
    if (this.props.currentMenu == menu) {
      menu = null;
    }

    this.context.openMenu(menu);
  }

  /**
   * Generate the ships menu
   * @return {React.Component} Menu
   */
  _getShipsMenu() {
    let shipList = [];

    for (let s of this.shipOrder) {
      shipList.push(<ActiveLink key={s} href={outfitURL(s)} className='block'>{Ships[s].properties.name}</ActiveLink>);
    }

    return (
      <div className='menu-list dbl no-wrap' onClick={ (e) => e.stopPropagation() }>
        {shipList}
      </div>
    );
  }

  /**
   * Generate the builds menu
   * @return {React.Component} Menu
   */
  _getBuildsMenu() {
    let builds = Persist.getBuilds();
    let buildList = [];
    for (let shipId of this.shipOrder) {
      if (builds[shipId]) {
        let shipBuilds = [];
        let buildNameOrder = Object.keys(builds[shipId]).sort();
        for (let buildName of buildNameOrder) {
          let href = outfitURL(shipId, builds[shipId][buildName], buildName);
          shipBuilds.push(<li key={shipId + '-' + buildName} ><ActiveLink href={href} className='block'>{buildName}</ActiveLink></li>);
        }
        buildList.push(<ul key={shipId}>{Ships[shipId].properties.name}{shipBuilds}</ul>);
      }
    }

    return (
      <div className='menu-list' onClick={ (e) => e.stopPropagation() }>
        <div className='dbl'>{buildList}</div>
      </div>
    );
  }

  /**
   * Generate the comparison menu
   * @return {React.Component} Menu
   */
  _getComparisonsMenu() {
    let comparisons;
    let translate = this.context.language.translate;

    if (Persist.hasComparisons()) {
      comparisons = [];
      let comps =  Object.keys(Persist.getComparisons()).sort();

      for (let name of comps) {
        comparisons.push(<ActiveLink key={name} href={'/compare/' + encodeURIComponent(name)} className='block name'>{name}</ActiveLink>);
      }
    } else {
      comparisons = <span className='cap'>{translate('none created')}</span>;
    }

    return (
      <div className='menu-list' onClick={ (e) => e.stopPropagation() } style={{ whiteSpace: 'nowrap' }}>
        {comparisons}
        <hr />
        <Link href='/compare/all' className='block cap'>{translate('compare all')}</Link>
        <Link href='/compare' className='block cap'>{translate('create new')}</Link>
      </div>
    );
  }

  /**
   * Generate the announcement menu
   * @return {React.Component} Menu
   */
  _getAnnouncementsMenu() {
    let announcements;
    let translate = this.context.language.translate;

    if (this.props.announcements) {
      announcements = [];
      for (let announce of this.props.announcements) {
        announcements.push(<Announcement text={announce.message} />);
        announcements.push(<hr/>);
      }
    }
    return (
      <div className='menu-list' onClick={ (e) => e.stopPropagation() } style={{ whiteSpace: 'nowrap' }}>
        {announcements}
        <hr />
      </div>
    );
  }

  /**
   * Generate the settings menu
   * @return {React.Component} Menu
   */
  _getSettingsMenu() {
    let translate = this.context.language.translate;
    let tips = Persist.showTooltips();
    let moduleResistances = Persist.showModuleResistances();

    return (
      <div className='menu-list no-wrap cap' onClick={ (e) => e.stopPropagation() }>
        <table style={{ width: '100%', background: 'none', borderSpacing: '0 0.5em' }}>
          <tbody>
            <tr>
              <td>{translate('language')}</td>
              <td className='ri'>
                <select className='cap' dir='rtl' value={Persist.getLangCode()} onChange={this._setLanguage}>
                  {this.languageOptions}
                </select>
              </td>
            </tr>
            <tr className='cap ptr' onClick={this._toggleTooltips} >
              <td>{translate('tooltips')}</td>
              <td className={cn('ri', { disabled: !tips, 'primary-disabled': tips })}>{(tips ? '✓' : '✗')}</td>
            </tr>
            <tr className='cap ptr' onClick={this._toggleModuleResistances} >
              <td>{translate('module resistances')}</td>
              <td className={cn('ri', { disabled: !moduleResistances, 'primary-disabled': moduleResistances })}>{(moduleResistances ? '✓' : '✗')}</td>
            </tr>
            <tr>
              <td>{translate('insurance')}</td>
              <td className='ri'>
                <select className='cap' dir='rtl' value={Persist.getInsurance()} onChange={this._setInsurance}>
                  {this.insuranceOptions}
                </select>
              </td>
            </tr>
            <tr>
              <td>{translate('ship')} {translate('discount')}</td>
              <td className='ri'>
                <input type='text' size='10' value={this.state.shipDiscount} onChange={this._changeShipDiscount} onFocus={selectAll} onBlur={this._setShipDiscount} onKeyDown={this._kpShipDiscount}/>
                <u className='primary-disabled'>%</u>
              </td>
            </tr>
            <tr>
              <td>{translate('module')} {translate('discount')}</td>
              <td className='ri'>
                <input type='text' size='10' value={this.state.moduleDiscount} onChange={this._changeModuleDiscount} onFocus={selectAll} onBlur={this._setModuleDiscount} onKeyDown={this._kpModuleDiscount}/>
                <u className='primary-disabled'>%</u>
              </td>
            </tr>
          </tbody>
        </table>
        <hr />
        <ul style={{ width: '100%' }}>
          {translate('builds')} & {translate('comparisons')}
          <li><Link href="#" className='block' onClick={this._showBackup.bind(this)}>{translate('backup')}</Link></li>
          <li><Link href="#" className='block' onClick={this._showDetailedExport.bind(this)}>{translate('detailed export')}</Link></li>
          <li><Link href="#" className='block' onClick={this._uploadAllBuildsToOrbis.bind(this)}>{translate('upload all builds to orbis')}</Link></li>
          <li><Link href="#" className='block' onClick={this._showImport.bind(this)}>{translate('import')}</Link></li>
          <li><Link href="#" className='block' onClick={this._showDeleteAll.bind(this)}>{translate('delete all')}</Link></li>
        </ul>
        <hr />
        <table style={{ width: 300, backgroundColor: 'transparent' }}>
          <tbody>
            <tr>
              <td style={{ width: '1em', verticalAlign: 'top' }}><u>A</u></td>
              <td><Slider onChange={this._setTextSize} percent={(Persist.getSizeRatio() - SIZE_MIN) / SIZE_RANGE} /></td>
              <td style={{ width: 20 }}><span style={{ fontSize: 30 }}>A</span></td>
            </tr>
            <tr>
             <td colSpan='3' style={{ textAlign: 'center', cursor: 'pointer' }} className='primary-disabled cap' onClick={this._resetTextSize.bind(this)}>{translate('reset')}</td>
            </tr>
          </tbody>
        </table>
        <hr />
        <Link href="/about" className='block'>{translate('about')}</Link>
      </div>
    );
  }

  /**
   * Add listeners on mount
   */
  componentWillMount() {
    let update = () => this.forceUpdate();
    Persist.addListener('language', update);
    Persist.addListener('insurance', update);
    // Persist.addListener('discounts', update);
    Persist.addListener('deletedAll', update);
    Persist.addListener('builds', update);
    Persist.addListener('tooltips', update);
    Persist.addListener('moduleresistances', update);
  }

  /**
   * Update state based on property and context changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next conext
   */
  componentWillReceiveProps(nextProps, nextContext) {
    if(this.context.language != nextContext.language) {
      let translate = nextContext.language.translate;
      this.insuranceOptions = [];
      for (let name in Insurance) {
        this.insuranceOptions.push(<option key={name} value={name}>{translate(name)}</option>);
      }
    }
    if (nextProps.currentMenu == 'settings') {  // Settings menu is about to be opened
      this.setState({
        shipDiscount:  normalizePercent(Persist.getShipDiscount() * 100),
        moduleDiscount: normalizePercent(Persist.getModuleDiscount() * 100),
      });
    } else if (this.props.currentMenu == 'settings') { // Settings menu is about to be closed
      if (this.state.shipDiscount != (Persist.getShipDiscount() * 100)) {
        this._setShipDiscount();
      }
      if (this.state.moduleDiscount != (Persist.getModuleDiscount() * 100)) {
        this._setModuleDiscount();
      }
    }
  }

  async update() {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg || !reg.waiting) {
      return window.location.reload();
    }
    reg.waiting.postMessage('skipWaiting');
    window.location.reload();
  }

  /**
   * Render the header
   * @return {React.Component} Header
   */
  render() {
    let translate = this.context.language.translate;
    let openedMenu = this.props.currentMenu;
    let hasBuilds = Persist.hasBuilds();
    return (
      <header>
        {this.props.appCacheUpdate && <div id="app-update" onClick={this.update}>{translate('PHRASE_UPDATE_RDY')}</div>}
        {this.props.appCacheUpdate ? <a className={'view-changes'} href={'https://github.com/EDCD/coriolis/compare/edcd:develop@{' + window.CORIOLIS_DATE + '}...edcd:develop'} target="_blank">
          {'View Release Changes'}
        </a> : null}
        <Link className='l' href='/' style={{ marginRight: '1em' }} title='Home'><CoriolisLogo className='icon xl' /></Link>

        <div className='l menu'>
          <div className={cn('menu-header', { selected: openedMenu == 's' })} onClick={this._openShips}>
            <Rocket className='warning' /><span className='menu-item-label'>{translate('ships')}</span>
          </div>
          {openedMenu == 's' ? this._getShipsMenu() : null}
        </div>

        <div className='l menu'>
          <div className={cn('menu-header', { selected: openedMenu == 'b', disabled: !hasBuilds })} onClick={hasBuilds && this._openBuilds}>
            <Hammer className={cn('warning', { 'warning-disabled': !hasBuilds })} /><span className='menu-item-label'>{translate('builds')}</span>
          </div>
          {openedMenu == 'b' ? this._getBuildsMenu() : null}
        </div>

        <div className='l menu'>
          <div className={cn('menu-header', { selected: openedMenu == 'comp', disabled: !hasBuilds })} onClick={hasBuilds && this._openComp}>
            <StatsBars className={cn('warning', { 'warning-disabled': !hasBuilds })} /><span className='menu-item-label'>{translate('compare')}</span>
          </div>
          {openedMenu == 'comp' ? this._getComparisonsMenu() : null}
        </div>

        <div className='l menu'>
          <div className={cn('menu-header', { selected: openedMenu == 'announce', disabled: this.props.announcements.length === 0})} onClick={this.props.announcements.length !== 0 && this._openAnnounce}>
            <span className='menu-item-label'>{translate('announcements')}</span>
          </div>
          {openedMenu == 'announce' ? this._getAnnouncementsMenu() : null}
        </div>

        {window.location.origin.search('.edcd.io') >= 0 ?
          <div className='l menu'>
            <a href="https://youtu.be/4SvnLcefhtI" target="_blank">
              <div className={cn('menu-header')}>
                <Rocket className='warning'/><span className='menu-item-label'>{translate('please migrate to coriolis.io')}</span>
              </div>
            </a>
          </div> : null
        }

        <div className='r menu'>
          <div className={cn('menu-header', { selected: openedMenu == 'settings' })} onClick={this._openSettings}>
            <Cogs className='xl warning'/><span className='menu-item-label'>{translate('settings')}</span>
          </div>
          {openedMenu == 'settings' ? this._getSettingsMenu() : null}
        </div>

        <div className='r menu'>
          <div className={cn('menu-header')} onClick={this._showHelp}>
            <Help className='xl warning'/>
          </div>
        </div>
      </header>
    );
  }

}
