import React from 'react';
import TranslatedComponent from './TranslatedComponent';
import Persist from '../stores/Persist';
import { PersonIcon } from './SvgIcons';
import { fetchProfile, fetchShips, fetchMaterials } from '../utils/CmdrApi';

/**
 * CMDR link/management URL — always cmdr.coriolis.io for now, but the
 * host is stored per-link so users could theoretically link different
 * deployments.
 */
const CMDR_HOST = 'https://cmdr.coriolis.io';

/**
 * CMDR Coriolis modal — link accounts, switch CMDRs, view ships & mats.
 */
export default class ModalCmdr extends TranslatedComponent {

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);

    const data = Persist.getCmdrLinks();
    this.state = {
      links: data.links,
      activeIndex: data.activeIndex,
      profile: null,
      ships: null,
      materials: null,
      loading: false,
      error: null,
    };

    this._linkAccount = this._linkAccount.bind(this);
    this._removeLink = this._removeLink.bind(this);
    this._switchCmdr = this._switchCmdr.bind(this);
  }

  /**
   * Fetch data for the active link on mount
   */
  componentDidMount() {
    this._sub = Persist.addListener('cmdrLinks', this._onLinksChange.bind(this));
    this._fetchActiveData();
  }

  /**
   * Clean up listener
   */
  componentWillUnmount() {
    if (this._sub) this._sub.remove();
  }

  /**
   * Re-read links from Persist when they change
   */
  _onLinksChange(data) {
    this.setState({
      links: data.links,
      activeIndex: data.activeIndex,
    }, () => this._fetchActiveData());
  }

  /**
   * Fetch profile + ships for the active CMDR link
   */
  _fetchActiveData() {
    const link = Persist.getActiveCmdrLink();
    if (!link) {
      this.setState({ profile: null, ships: null, materials: null, loading: false });
      return;
    }

    this.setState({ loading: true, error: null });

    Promise.all([
      fetchProfile(link),
      fetchShips(link),
      fetchMaterials(link),
    ]).then(([profile, shipsResp, matsResp]) => {
      this.setState({
        profile,
        ships: shipsResp.ships || [],
        materials: matsResp.materials || {},
        loading: false,
      });
    }).catch(err => {
      this.setState({ error: err.message, loading: false });
    });
  }

  /**
   * Open the link popup on cmdr.coriolis.io
   */
  _linkAccount() {
    window.open(
      CMDR_HOST + '/link/?origin=' + encodeURIComponent(window.location.origin),
      'cmdr-link',
      'width=500,height=450,menubar=no,toolbar=no'
    );
  }

  /**
   * Remove a CMDR link
   * @param {number} index
   */
  _removeLink(index) {
    Persist.removeCmdrLink(index);
  }

  /**
   * Switch to a different CMDR
   * @param {number} index
   */
  _switchCmdr(index) {
    Persist.setActiveCmdrLink(index);
  }

  /**
   * Render the modal
   * @return {React.Component} Modal Content
   */
  render() {
    const translate = this.context.language.translate;
    const { links, activeIndex, profile, ships, materials, loading, error } = this.state;
    const hasLinks = links.length > 0;

    return (
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <PersonIcon className='lg' />
          {translate('CMDR Coriolis')}
        </h2>

        {/* Linked CMDRs list */}
        {hasLinks && (
          <div className='cmdr-links-list'>
            {links.map((link, i) => (
              <div
                key={i}
                className={'cmdr-link-item' + (i === activeIndex ? ' active' : '')}
                onClick={() => this._switchCmdr(i)}
              >
                <span className='cmdr-link-name'>
                  CMDR {link.cmdrName}
                </span>
                {i === activeIndex && <span className='cmdr-link-active'>&#10003;</span>}
                <button
                  className='cmdr-link-remove'
                  onClick={(e) => { e.stopPropagation(); this._removeLink(i); }}
                  title={translate('remove')}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Link button */}
        <button
          className='btn cmdr-link-btn cap'
          onClick={this._linkAccount}
        >
          {hasLinks ? translate('link another CMDR') : translate('link CMDR account')}
        </button>

        {/* Loading indicator */}
        {loading && <p className='cmdr-loading'>{translate('loading')}...</p>}

        {/* Error */}
        {error && <p className='cmdr-error'>{error}</p>}

        {/* Active CMDR data */}
        {!loading && profile && (
          <div className='cmdr-data'>
            <h3>{translate('profile')}</h3>
            <table className='cmdr-table'>
              <tbody>
                <tr><td className='le'>{translate('commander')}</td><td>{profile.cmdrName}</td></tr>
                <tr><td className='le'>{translate('credits')}</td><td>{(profile.credits || 0).toLocaleString()} CR</td></tr>
                {profile.lastSystem && <tr><td className='le'>{translate('system')}</td><td>{profile.lastSystem}</td></tr>}
                {profile.lastStation && <tr><td className='le'>{translate('station')}</td><td>{profile.lastStation}</td></tr>}
              </tbody>
            </table>

            {/* Ships */}
            <h3>{translate('ships')}</h3>
            {ships && ships.length > 0 ? (
              <table className='cmdr-table ships-table'>
                <thead>
                  <tr>
                    <th className='le'>{translate('ship')}</th>
                    <th className='le'>{translate('name')}</th>
                    <th className='le'>{translate('system')}</th>
                    <th className='le'>{translate('station')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ships.map((s, i) => (
                    <tr key={i} className={s.isCurrent ? 'cmdr-current-ship' : ''}>
                      <td>{s.shipTypeDisplay}</td>
                      <td>{s.shipName || s.shipIdent || '-'}</td>
                      <td>{s.starSystem || '-'}</td>
                      <td>{s.stationName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className='cmdr-empty'>{translate('PHRASE_CMDR_NO_SHIPS')}</p>
            )}

            {/* Materials summary */}
            <h3>{translate('materials')}</h3>
            {materials && (
              <div className='cmdr-materials-summary'>
                <span className='cmdr-mat-cat'>
                  <strong>{translate('Raw')}:</strong> {Object.keys(materials.raw || {}).length} types, {Object.values(materials.raw || {}).reduce((a, b) => a + b, 0)} total
                </span>
                <span className='cmdr-mat-cat'>
                  <strong>{translate('Manufactured')}:</strong> {Object.keys(materials.manufactured || {}).length} types, {Object.values(materials.manufactured || {}).reduce((a, b) => a + b, 0)} total
                </span>
                <span className='cmdr-mat-cat'>
                  <strong>{translate('Encoded')}:</strong> {Object.keys(materials.encoded || {}).length} types, {Object.values(materials.encoded || {}).reduce((a, b) => a + b, 0)} total
                </span>
              </div>
            )}
          </div>
        )}

        <br/>
        <button className='r dismiss cap' onClick={this.context.hideModal}>
          {translate('close')}
        </button>
      </div>
    );
  }
}
