import React from 'react';
import PropTypes from 'prop-types';
import Router from './Router';
import { EventEmitter } from 'fbemitter';
import { getLanguage } from './i18n/Language';
import Persist from './stores/Persist';

import Header from './components/Header';
import Tooltip from './components/Tooltip';
import ModalExport from './components/ModalExport';
import ModalHelp from './components/ModalHelp';
import ModalImport from './components/ModalImport';
import ModalPermalink from './components/ModalPermalink';
import * as CompanionApiUtils from './utils/CompanionApiUtils';

import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import OutfittingPage from './pages/OutfittingPage';
import ComparisonPage from './pages/ComparisonPage';
import ShipyardPage from './pages/ShipyardPage';
import ErrorDetails from './pages/ErrorDetails';

const zlib = require('pako');

/**
 * Coriolis App
 */
export default class Coriolis extends React.Component {

  static childContextTypes = {
    closeMenu: PropTypes.func.isRequired,
    hideModal: PropTypes.func.isRequired,
    language: PropTypes.object.isRequired,
    noTouch: PropTypes.bool.isRequired,
    onCommand: PropTypes.func.isRequired,
    onWindowResize: PropTypes.func.isRequired,
    openMenu: PropTypes.func.isRequired,
    route: PropTypes.object.isRequired,
    showModal: PropTypes.func.isRequired,
    sizeRatio: PropTypes.number.isRequired,
    termtip: PropTypes.func.isRequired,
    tooltip: PropTypes.func.isRequired
  };

  /**
   * Creates an instance of the Coriolis App
   */
  constructor() {
    super();
    this._setPage = this._setPage.bind(this);
    this._openMenu = this._openMenu.bind(this);
    this._closeMenu = this._closeMenu.bind(this);
    this._showModal = this._showModal.bind(this);
    this._hideModal = this._hideModal.bind(this);
    this._tooltip = this._tooltip.bind(this);
    this._termtip = this._termtip.bind(this);
    this._onWindowResize = this._onWindowResize.bind(this);
    this._onCommand = this._onCommand.bind(this);
    this._onLanguageChange = this._onLanguageChange.bind(this);
    this._onSizeRatioChange = this._onSizeRatioChange.bind(this);
    this._keyDown = this._keyDown.bind(this);
    this._importBuild = this._importBuild.bind(this);

    this.emitter = new EventEmitter();
    this.state = {
      noTouch: !('ontouchstart' in window || navigator.msMaxTouchPoints || navigator.maxTouchPoints),
      page: null,
      language: getLanguage(Persist.getLangCode()),
      route: {},
      sizeRatio: Persist.getSizeRatio()
    };

    Router('', (r) => this._setPage(ShipyardPage, r));
    Router('/import?', (r) => this._importBuild(r));
    Router('/import/:data', (r) => this._importBuild(r));
    Router('/outfit/?', (r) => this._setPage(OutfittingPage, r));
    Router('/outfit/:ship/?', (r) => this._setPage(OutfittingPage, r));
    Router('/outfit/:ship/:code?', (r) => this._setPage(OutfittingPage, r));
    Router('/compare/:name?', (r) => this._setPage(ComparisonPage, r));
    Router('/comparison?', (r) => this._setPage(ComparisonPage, r));
    Router('/comparison/:code', (r) => this._setPage(ComparisonPage, r));
    Router('/about', (r) => this._setPage(AboutPage, r));
    Router('*', (r) => this._setPage(null, r));
  }

  /**
   * Import a build directly
   * @param {Object} r The current route
   */
  _importBuild(r) {
    try {
      // Need to decode and gunzip the data, then build the ship
      const data = zlib.inflate(new Buffer(r.params.data, 'base64'), { to: 'string' });
      const json = JSON.parse(data);
      const ship = CompanionApiUtils.shipFromJson(json);
      r.params.ship = ship.id;
      r.params.code = ship.toString();
      this._setPage(OutfittingPage, r);
    } catch (err) {
      this._onError('Failed to import ship', r.path, 0, 0, err);
    }
  }

  /**
   * Updates / Sets the page and route context
   * @param {[type]} page  The page to be shown
   * @param {Object} route The current route
   */
  _setPage(page, route) {
    this.setState({ page, route, currentMenu: null, modal: null, error: null });
  }

  /**
   * Handle unexpected error. This is most likely an unhandled React Error which
   * is also most likely unrecoverable. The best option is to catch as many details
   * as possible so the user can report the error and provide a link to reload the page
   * to reset the VM and clear any error state.
   *
   * @param  {string} msg         Message
   * @param  {string} scriptUrl   URL
   * @param  {number} line        Line number
   * @param  {number} col         Column number
   * @param  {Object} errObj      Error Object
   */
  _onError(msg, scriptUrl, line, col, errObj) {
    console && console.error && console.error(arguments); // eslint-disable-line no-console
    if (errObj) {
      if (errObj instanceof Error) {
        Bugsnag.notifyException(errObj) // eslint-disable-line
      } else if (errObj instanceof String) {
        Bugsnag.notify(msg, errObj) // eslint-disable-line
      }
    }
    this.setState({
      error: <ErrorDetails error={{ message: msg, details: { scriptUrl, line, col, error: JSON.stringify(errObj) } }}/>,
      page: null,
      currentMenu: null,
      modal: null
    });
    // TODO: Improve in the event of React Errors
    // Potentially ReactDOM.render into dom here instead
    // ReactDOM.render(this, document.getElementById('coriolis'));
  }

  /**
   * Propagate language and format changes
   * @param  {string} lang Language code
   */
  _onLanguageChange(lang) {
    this.setState({ language: getLanguage(Persist.getLangCode()) });
  }

  /**
   * Propagate the sizeRatio change
   * @param  {number} sizeRatio Size ratio / scale
   */
  _onSizeRatioChange(sizeRatio) {
    this.setState({ sizeRatio });
  }

  /**
   * Handle Key Down
   * @param  {Event} e  Keyboard Event
   */
  _keyDown(e) {
    // .keyCode will eventually be replaced with .key
    switch (e.keyCode) {
      case 27:    // Escape Key
        this._hideModal();
        this._closeMenu();
        break;
      case 72:     // 'h'
        if (e.ctrlKey || e.metaKey) { // CTRL/CMD + h
          e.preventDefault();
          this._showModal(<ModalHelp />);
        }
        break;
      case 73:     // 'i'
        if (e.ctrlKey || e.metaKey) { // CTRL/CMD + i
          e.preventDefault();
          this._showModal(<ModalImport />);
        }
        break;
      case 79:  // 'o'
        if (e.ctrlKey || e.metaKey) { // CTRL/CMD + o
          e.preventDefault();
          this._showModal(<ModalPermalink url={window.location.href}/>);
        }
        break;
      case 83:  // 's'
        if (e.ctrlKey || e.metaKey) { // CTRL/CMD + s
          e.preventDefault();
          this.emitter.emit('command', 'save');
        }
    }
  }

  /**
   * Opens the modal display with the specified content
   * @param  {React.Component} content Modal Content
   */
  _showModal(content) {
    let modal = <div className='modal-bg' onClick={(e) => this._hideModal() }>{content}</div>;
    this.setState({ modal });
  }

  /**
   * Hides any open modal
   */
  _hideModal() {
    if (this.state.modal) {
      this.setState({ modal: null });
    }
  }

  /**
   * Sets the open menu state
   * @param  {string|object} currentMenu The reference to the current menu
   */
  _openMenu(currentMenu) {
    if (this.state.currentMenu != currentMenu) {
      this.setState({ currentMenu });
    }
  }

  /**
   * Closes the open menu
   */
  _closeMenu() {
    if (this.state.currentMenu) {
      this.setState({ currentMenu: null });
    }
  }

  /**
   * Show/Hide the tooltip
   * @param  {React.Component} content Tooltip content
   * @param  {DOMRect} rect            Target bounding rect
   * @param  {[type]} opts             Options
   */
  _tooltip(content, rect, opts) {
    if (!content && this.state.tooltip) {
      this.setState({ tooltip: null });
    } else if (content && Persist.showTooltips()) {
      this.setState({ tooltip: <Tooltip rect={rect} options={opts}>{content}</Tooltip> });
    }
  }

  /**
   * Show the term tip
   * @param  {string} term            Term or Phrase
   * @param  {Object} opts            Options - dontCap, orientation (n,e,s,w) (can also be the event if no options supplied)
   * @param  {SyntheticEvent} event   Event
   * @param  {SyntheticEvent} e2      Alternative location for synthetic event from charts (where 'Event' is actually a chart index)
   */
  _termtip(term, opts, event, e2) {
    if (opts && opts.nativeEvent) { // Opts is the SyntheticEvent
      event = opts;
      opts = { cap: true };
    }
    if (e2 instanceof Object && e2.nativeEvent) { // E2 is the SyntheticEvent
      event = e2;
    }

    this._tooltip(
      <div className={'cen' + (opts.cap ? ' cap' : '')}>{this.state.language.translate(term)}</div>,
      event.currentTarget.getBoundingClientRect(),
      opts
    );
  }

  /**
   * Add a listener to on window resize
   * @param  {Function} listener Listener callback
   * @return {Object}            Subscription token
   */
  _onWindowResize(listener) {
    return this.emitter.addListener('windowResize', listener);
  }

    /**
   * Add a listener to global commands such as save,
   * @param  {Function} listener Listener callback
   * @return {Object}            Subscription token
   */
  _onCommand(listener) {
    return this.emitter.addListener('command', listener);
  }

  /**
   * Creates the context to be passed down to pages / components containing
   * language, sizeRatio and route references
   * @return {object} Context to be passed down
   */
  getChildContext() {
    return {
      closeMenu: this._closeMenu,
      hideModal: this._hideModal,
      language: this.state.language,
      noTouch: this.state.noTouch,
      onCommand: this._onCommand,
      onWindowResize: this._onWindowResize,
      openMenu: this._openMenu,
      route: this.state.route,
      showModal: this._showModal,
      sizeRatio: this.state.sizeRatio,
      termtip: this._termtip,
      tooltip: this._tooltip
    };
  }

  /**
   * Adds necessary listeners and starts Routing
   */
  componentWillMount() {
    // Listen for appcache updated event, present refresh to update view
    if (window.applicationCache) {
      window.applicationCache.addEventListener('updateready', () => {
        if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
          this.setState({ appCacheUpdate: true }); // Browser downloaded a new app cache.
        }
      });
    }

    window.onerror = this._onError.bind(this);
    window.addEventListener('resize', () => this.emitter.emit('windowResize'));
    document.getElementById('coriolis').addEventListener('scroll', () => this._tooltip());
    document.addEventListener('keydown', this._keyDown);
    Persist.addListener('language', this._onLanguageChange);
    Persist.addListener('sizeRatio', this._onSizeRatioChange);

    Router.start();
  }

  /**
   * Renders the main app
   * @return {React.Component} The main app
   */
  render() {
    let currentMenu = this.state.currentMenu;

    return <div style={{ minHeight: '100%' }} onClick={this._closeMenu} className={ this.state.noTouch ? 'no-touch' : null }>
      <Header appCacheUpdate={this.state.appCacheUpdate} currentMenu={currentMenu} />
      { this.state.error ? this.state.error : this.state.page ? React.createElement(this.state.page, { currentMenu }) : <NotFoundPage/> }
      { this.state.modal }
      { this.state.tooltip }
      <footer>
        <div className="right cap">
          <a href="https://github.com/EDCD/coriolis" target="_blank" title="Coriolis Github Project">{window.CORIOLIS_VERSION} - {window.CORIOLIS_DATE}</a>
        </div>
      </footer>
    </div>;
  }
}
