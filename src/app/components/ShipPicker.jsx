import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import Ship from '../shipyard/Ship';
import { Ships } from 'coriolis-data/dist';
import { Rocket } from './SvgIcons';
import Persist from '../stores/Persist';
import cn from 'classnames';

/**
 * Ship picker
 * Requires an onChange() function of the form onChange(ship), providing the ship, which is triggered on ship change
 */
export default class ShipPicker extends TranslatedComponent {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    ship: PropTypes.string.isRequired,
    build: PropTypes.string
  };

  static defaultProps = {
    ship: 'eagle'
  }

  /**
   * constructor
   * @param {object} props  Properties react
   * @param {object} context   react context
   */
  constructor(props, context) { // eslint-disable-line
    super(props);

    this.shipOrder = Object.keys(Ships).sort();
    this._toggleMenu = this._toggleMenu.bind(this);
    this._closeMenu = this._closeMenu.bind(this);

    this.state = { menuOpen: false };
  }

  /**
   * Update ship
   * @param {object} ship  the ship
   * @param {string} build   the build, if present
   */
  _shipChange(ship, build) {
    this._closeMenu();

    // Ensure that the ship has changed
    if (ship !== this.props.ship || build !== this.props.build) {
      this.props.onChange(ship, build);
    }
  }

  /**
   * Render the menu for the picker
   * @returns {object}    the picker menu
   */
  _renderPickerMenu() {
    const { ship, build } = this.props;
    const _shipChange = this._shipChange;
    const builds = Persist.getBuilds();
    const buildList = [];
    for (let shipId of this.shipOrder) {
      const shipBuilds = [];
      // Add stock build
      const stockSelected = (ship == shipId && !build);
      shipBuilds.push(<li key={shipId} className={ cn({ 'selected': stockSelected })} onClick={_shipChange.bind(this, shipId, null)}>Stock</li>);
      if (builds[shipId]) {
        let buildNameOrder = Object.keys(builds[shipId]).sort();
        for (let buildName of buildNameOrder) {
          const buildSelected = ship === shipId && build === buildName;
          shipBuilds.push(<li key={shipId + '-' + buildName} className={ cn({ 'selected': buildSelected })} onClick={_shipChange.bind(this, shipId, buildName)}>{buildName}</li>);
        }
      }
      buildList.push(<ul key={shipId} className='block'>{Ships[shipId].properties.name}{shipBuilds}</ul>);
    }

    return buildList;
  }

  /**
   * Toggle the menu state
   */
  _toggleMenu() {
    const { menuOpen } = this.state;
    this.setState({ menuOpen: !menuOpen });
  }

  /**
   * Close the menu
   */
  _closeMenu() {
    const { menuOpen } = this.state;
    if (menuOpen) {
      this._toggleMenu();
    }
  }

  /**
   * Render picker
   * @return {React.Component} contents
   */
  render() {
    const { language, onWindowResize, sizeRatio, tooltip, termtip } = this.context;
    const { formats, translate, units } = language;
    const { ship, build } = this.props;
    const { menuOpen } = this.state;

    const shipString = ship + ': ' + (build ? build : translate('stock'));
    return (
      <div className='shippicker' onClick={ (e) => e.stopPropagation() }>
        <div className='menu'>
          <div className={cn('menu-header', { selected: menuOpen })} onClick={this._toggleMenu}>
            <span><Rocket className='warning' /></span>
            <span className='menu-item-label'>{shipString}</span>
          </div>
          { menuOpen ?
          <div className='menu-list' onClick={ (e) => e.stopPropagation() }>
            <div className='quad'>
              {this._renderPickerMenu()}
            </div>
          </div> : null }
        </div>
      </div>
    );
  }
}
