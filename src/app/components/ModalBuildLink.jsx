import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import Persist from '../stores/Persist';
import { PersonIcon, FloppyDisk, Bin } from './SvgIcons';
import { fetchShips, fetchBuilds, saveBuild, updateBuild, unlinkBuild } from '../utils/CmdrApi';
import { SHIP_FD_NAME_TO_CORIOLIS_NAME } from '../utils/CompanionApiUtils';

/**
 * Build a reverse lookup: coriolis shipId → set of lowered FD names.
 * e.g. 'fer_de_lance' → ['ferdelance']
 */
const CORIOLIS_TO_FD = {};
for (const fdName in SHIP_FD_NAME_TO_CORIOLIS_NAME) {
  const corId = SHIP_FD_NAME_TO_CORIOLIS_NAME[fdName];
  if (!CORIOLIS_TO_FD[corId]) CORIOLIS_TO_FD[corId] = [];
  CORIOLIS_TO_FD[corId].push(fdName.toLowerCase());
}

/**
 * Modal for saving a coriolis build to cmdr-coriolis and optionally
 * linking it to an in-game ship.  Shown from the outfitting page.
 */
export default class ModalBuildLink extends TranslatedComponent {

  static propTypes = {
    shipId: PropTypes.string.isRequired,       // coriolis ship id, e.g. 'anaconda'
    shipDisplayName: PropTypes.string.isRequired,
    buildName: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,         // ship.toString()
    url: PropTypes.string.isRequired,          // full coriolis.io outfit URL
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      saving: false,
      error: null,
      success: null,
      ships: [],
      existingBuild: null,    // build record from server (if already saved)
      description: '',
      selectedShipId: '',     // pk of the linked ship (empty = none)
    };

    this._save = this._save.bind(this);
    this._unlink = this._unlink.bind(this);
    this._onDescChange = this._onDescChange.bind(this);
    this._onShipChange = this._onShipChange.bind(this);
  }

  /**
   * Fetch ships + existing builds on mount
   */
  componentDidMount() {
    const link = Persist.getActiveCmdrLink();
    if (!link) {
      this.setState({ loading: false, error: 'No CMDR link active.' });
      return;
    }

    Promise.all([
      fetchShips(link),
      fetchBuilds(link),
    ]).then(([shipsResp, buildsResp]) => {
      const ships = shipsResp.ships || [];
      const builds = buildsResp.builds || [];

      // Check if this build already exists server-side
      const existing = builds.find(
        b => b.shipType === this.props.shipId && b.buildName === this.props.buildName
      );

      this.setState({
        loading: false,
        ships,
        existingBuild: existing || null,
        description: existing ? existing.description : '',
        selectedShipId: existing && existing.linkedShip ? String(existing.linkedShip.id) : '',
      });
    }).catch(err => {
      this.setState({ loading: false, error: err.message });
    });
  }

  /**
   * Handle description input change
   * @param {SyntheticEvent} e
   */
  _onDescChange(e) {
    this.setState({ description: e.target.value, success: null });
  }

  /**
   * Handle ship dropdown change
   * @param {SyntheticEvent} e
   */
  _onShipChange(e) {
    this.setState({ selectedShipId: e.target.value, success: null });
  }

  /**
   * Save (create/update) the build, then optionally link it to a ship
   */
  _save() {
    const link = Persist.getActiveCmdrLink();
    if (!link) return;

    this.setState({ saving: true, error: null, success: null });

    const { shipId, shipDisplayName, buildName, code, url } = this.props;
    const { description, selectedShipId } = this.state;

    // Step 1: save (create or update) the build
    saveBuild(link, {
      shipType: shipId,
      shipDisplayName,
      buildName,
      code,
      url,
      description,
    }).then(resp => {
      const buildId = resp.id || (this.state.existingBuild && this.state.existingBuild.id);
      if (!buildId) {
        this.setState({ saving: false, error: 'No build ID returned.' });
        return;
      }

      // Step 2: update description & linked ship
      const linkedShipId = selectedShipId ? parseInt(selectedShipId, 10) : null;
      return updateBuild(link, buildId, {
        description,
        linkedShipId,
      }).then(() => {
        this.setState({
          saving: false,
          success: resp.created ? 'Build saved to CMDR Coriolis.' : 'Build updated.',
          existingBuild: {
            id: buildId,
            shipType: shipId,
            shipDisplayName,
            buildName,
            code,
            url,
            description,
            linkedShip: linkedShipId ? { id: linkedShipId } : null,
          },
        });
      });
    }).catch(err => {
      this.setState({ saving: false, error: err.message });
    });
  }

  /**
   * Unlink the ship from the build (without deleting)
   */
  _unlink() {
    const link = Persist.getActiveCmdrLink();
    const { existingBuild } = this.state;
    if (!link || !existingBuild) return;

    this.setState({ saving: true, error: null, success: null });

    unlinkBuild(link, existingBuild.id).then(() => {
      this.setState({
        saving: false,
        success: 'Ship unlinked from build.',
        selectedShipId: '',
        existingBuild: { ...existingBuild, linkedShip: null },
      });
    }).catch(err => {
      this.setState({ saving: false, error: err.message });
    });
  }

  /**
   * Render the modal
   * @return {React.Component} Modal Content
   */
  render() {
    const translate = this.context.language.translate;
    const { shipId, buildName, shipDisplayName } = this.props;
    const {
      loading, saving, error, success,
      ships, existingBuild,
      description, selectedShipId,
    } = this.state;

    const isLinked = existingBuild && existingBuild.linkedShip;

    // Filter ships to only those matching this build's ship type
    const fdNames = CORIOLIS_TO_FD[shipId] || [shipId];
    const matchingShips = ships.filter(s => fdNames.indexOf(s.shipType) !== -1);

    return (
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <PersonIcon className='lg' />
          {shipDisplayName + ' — ' + buildName}
        </h2>

        {loading && <p className='cmdr-loading'>{translate('loading')}...</p>}
        {error && <p className='cmdr-error'>{error}</p>}
        {success && <p className='cmdr-success' style={{ color: '#4CAF50' }}>{success}</p>}

        {!loading && (
          <div className='build-link-form'>
            {/* Description */}
            <div style={{ marginBottom: '0.8em' }}>
              <label className='cap' style={{ display: 'block', marginBottom: '0.3em' }}>
                {translate('Description')}
              </label>
              <input
                type='text'
                className='build-link-desc'
                value={description}
                onChange={this._onDescChange}
                placeholder={translate('optional description')}
                style={{ width: '100%', padding: '0.4em' }}
                disabled={saving}
              />
            </div>

            {/* Ship link dropdown */}
            <div style={{ marginBottom: '1em' }}>
              <label className='cap' style={{ display: 'block', marginBottom: '0.3em' }}>
                {translate('Link to Ship')}
              </label>
              <select
                className='build-link-ship-select'
                value={selectedShipId}
                onChange={this._onShipChange}
                disabled={saving}
                style={{ width: '100%', padding: '0.4em' }}
              >
                <option value=''>— {translate('None')} —</option>
                {matchingShips.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.shipName || s.shipIdent || 'Unnamed'} — #{s.capiShipId}
                  </option>
                ))}
              </select>
              {matchingShips.length === 0 && !loading && (
                <p className='cmdr-empty' style={{ marginTop: '0.3em', fontSize: '0.85em', opacity: 0.7 }}>
                  {translate('No matching ships found for')} {shipDisplayName}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5em' }}>
              <button
                className='btn cap'
                onClick={this._save}
                disabled={saving}
              >
                <FloppyDisk className='lg' style={{ marginRight: '0.3em' }} />
                {existingBuild ? translate('update') : translate('save')}
              </button>

              {isLinked && (
                <button
                  className='btn danger cap'
                  onClick={this._unlink}
                  disabled={saving}
                >
                  <Bin className='lg' style={{ marginRight: '0.3em' }} />
                  {translate('unlink')}
                </button>
              )}
            </div>
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
