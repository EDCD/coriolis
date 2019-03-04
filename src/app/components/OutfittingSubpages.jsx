import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import Persist from '../stores/Persist';
import TranslatedComponent from './TranslatedComponent';
import PowerManagement from './PowerManagement';
import CostSection from './CostSection';
import EngineProfile from './EngineProfile';
import FSDProfile from './FSDProfile';
import Movement from './Movement';
import Offence from './Offence';
import Defence from './Defence';
import WeaponDamageChart from './WeaponDamageChart';

/**
 * Outfitting subpages
 */
export default class OutfittingSubpages extends TranslatedComponent {

  static propTypes = {
    ship: PropTypes.object.isRequired,
    code: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    buildName: PropTypes.string,
    sys: PropTypes.number.isRequired,
    eng: PropTypes.number.isRequired,
    wep: PropTypes.number.isRequired,
    cargo: PropTypes.number.isRequired,
    fuel: PropTypes.number.isRequired,
    boost: PropTypes.bool.isRequired,
    engagementRange: PropTypes.number.isRequired,
    opponent: PropTypes.object.isRequired,
    opponentBuild: PropTypes.string,
    opponentSys: PropTypes.number.isRequired,
    opponentEng: PropTypes.number.isRequired,
    opponentWep: PropTypes.number.isRequired,
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    this._powerTab = this._powerTab.bind(this);
    this._profilesTab = this._profilesTab.bind(this);
    this._offenceTab = this._offenceTab.bind(this);
    this._defenceTab = this._defenceTab.bind(this);

    this.state = {
      tab: Persist.getOutfittingTab() || 'power',
    };
  }

  /**
   * Show selected tab
   * @param  {string} tab Tab name
   */
  _showTab(tab) {
    this.setState({ tab });
  }

  /**
   * Render the power tab
   * @return {React.Component} Tab contents
   */
  _powerTab() {
    let { ship, buildName, code, onChange } = this.props;
    Persist.setOutfittingTab('power');

    const powerMarker = `${ship.toString()}`;
    const costMarker = `${ship.toString().split('.')[0]}`;

    return <div>
      <PowerManagement ship={ship} code={powerMarker} onChange={onChange} />
      <CostSection ship={ship} buildName={buildName} code={costMarker} />
    </div>;
  }

  /**
   * Render the profiles tab
   * @return {React.Component} Tab contents
   */
  _profilesTab() {
    const { ship, opponent, cargo, fuel, eng, boost, engagementRange, opponentSys } = this.props;
    const { translate } = this.context.language;
    let realBoost = boost && ship.canBoost(cargo, fuel);
    Persist.setOutfittingTab('profiles');

    const engineProfileMarker = `${ship.toString()}:${cargo}:${fuel}:${eng}:${realBoost}`;
    const fsdProfileMarker = `${ship.toString()}:${cargo}:${fuel}`;
    const movementMarker = `${ship.topSpeed}:${ship.pitch}:${ship.roll}:${ship.yaw}:${ship.canBoost(cargo, fuel)}`;
    const damageMarker = `${ship.toString()}:${opponent.toString()}:${engagementRange}:${opponentSys}`;

    return <div>
      <div className='group third'>
        <h1>{translate('engine profile')}</h1>
        <EngineProfile ship={ship} marker={engineProfileMarker} fuel={fuel} cargo={cargo} eng={eng} boost={realBoost} />
      </div>

      <div className='group third'>
        <h1>{translate('fsd profile')}</h1>
        <FSDProfile ship={ship} marker={fsdProfileMarker} fuel={fuel} cargo={cargo} />
      </div>

      <div className='group third'>
        <h1>{translate('movement profile')}</h1>
        <Movement marker={movementMarker} ship={ship} boost={boost} eng={eng} cargo={cargo} fuel={fuel} />
      </div>

      <div className='group half'>
        <h1>{translate('damage to opponent\'s shields')}</h1>
        <WeaponDamageChart marker={damageMarker} ship={ship} opponent={opponent} opponentSys={opponentSys} hull={false} engagementRange={engagementRange} />
      </div>

      <div className='group half'>
        <h1>{translate('damage to opponent\'s hull')}</h1>
        <WeaponDamageChart marker={damageMarker} ship={ship} opponent={opponent} opponentSys={opponentSys} hull={true} engagementRange={engagementRange} />
      </div>
    </div>;
  }

  /**
   * Render the offence tab
   * @return {React.Component} Tab contents
   */
  _offenceTab() {
    const { ship, sys, eng, wep, cargo, fuel, boost, engagementRange, opponent, opponentBuild, opponentSys } = this.props;
    Persist.setOutfittingTab('offence');

    const marker = `${ship.toString()}${opponent.toString()}${opponentBuild}${engagementRange}${opponentSys}`;

    return <div>
      <Offence marker={marker} ship={ship} opponent={opponent} wep={wep} opponentSys={opponentSys} engagementrange={engagementRange}/>
    </div>;
  }

  /**
   * Render the defence tab
   * @return {React.Component} Tab contents
   */
  _defenceTab() {
    const { ship, sys, eng, wep, cargo, fuel, boost, engagementRange, opponent, opponentBuild, opponentWep } = this.props;
    Persist.setOutfittingTab('defence');

    const marker = `${ship.toString()}${opponent.toString()}{opponentBuild}${engagementRange}${opponentWep}`;

    return <div>
      <Defence marker={marker} ship={ship} opponent={opponent} sys={sys} opponentWep={opponentWep} engagementrange={engagementRange}/>
    </div>;
  }

  /**
   * Render the section
   * @return {React.Component} Contents
   */
  render() {
    const tab = this.state.tab;
    const translate = this.context.language.translate;
    let tabSection;

    switch (tab) {
      case 'power': tabSection = this._powerTab(); break;
      case 'profiles': tabSection = this._profilesTab(); break;
      case 'offence': tabSection = this._offenceTab(); break;
      case 'defence': tabSection = this._defenceTab(); break;
    }

    return (
      <div className='group full' style={{ minHeight: '1000px' }}>
        <table className='tabs'>
          <thead>
            <tr>
              <th style={{ width:'25%' }} className={cn({ active: tab == 'power' })} onClick={this._showTab.bind(this, 'power')} >{translate('power and costs')}</th>
              <th style={{ width:'25%' }} className={cn({ active: tab == 'profiles' })} onClick={this._showTab.bind(this, 'profiles')} >{translate('profiles')}</th>
              <th style={{ width:'25%' }} className={cn({ active: tab == 'offence' })} onClick={this._showTab.bind(this, 'offence')} >{translate('offence')}</th>
              <th style={{ width:'25%' }} className={cn({ active: tab == 'defence' })} onClick={this._showTab.bind(this, 'defence')} >{translate('tab_defence')}</th>
            </tr>
          </thead>
        </table>
        {tabSection}
      </div>
    );
  }
}
