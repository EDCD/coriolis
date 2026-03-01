import React from 'react';
import PropTypes from 'prop-types';
import { AppContext } from './AppContext';
import Router from './Router';
import { register } from 'register-service-worker';
import { EventEmitter } from 'fbemitter';
import { getLanguage } from './i18n/Language';
import Persist from './stores/Persist';

import Announcement from './components/Announcement';
import Header from './components/Header';
import Tooltip from './components/Tooltip';
import ModalExport from './components/ModalExport';
import ModalHelp from './components/ModalHelp';
import ModalImport from './components/ModalImport';
import ModalPermalink from './components/ModalPermalink';
import * as CompanionApiUtils from './utils/CompanionApiUtils';
import * as JournalUtils from './utils/JournalUtils';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import OutfittingPage from './pages/OutfittingPage';
import ComparisonPage from './pages/ComparisonPage';
import ShipyardPage from './pages/ShipyardPage';
import ErrorDetails from './pages/ErrorDetails';


const zlib = require('pako');
const request = require('superagent');

/**
 * Coriolis App
 */
export default class Coriolis extends React.Component {
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
      // Announcements must have an expiry date in format "YYYY-MM-DDTHH:MM:SSZ"
      announcements: [{expiry: "2026-03-31T00:00:00Z", text: "Goodbye React 15. So long and thanks for all the Ships! Welcome to Coriolis 4.0.x"}],

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
      const data = zlib.inflate(new Buffer.from(r.params.data, 'base64'), { to: 'string' });
      const json = JSON.parse(data);
      console.info('Ship import data: ');
      console.info(json);
      let ship, importString;
      if (json) {
        if (json.length && json[0].data) { // SLEF
          if (json.length > 1) { // Multiple builds, open modal
            importString = data;
          } else { // Single build, import directly
            ship = JournalUtils.shipFromLoadoutJSON(json[0].data);
          }
        } else { // not SLEF
          if (json.modules) {
            ship = CompanionApiUtils.shipFromJson(json);
          } else if (json.Modules) {
            ship = JournalUtils.shipFromLoadoutJSON(json);
          }
        }
      }
      if (ship) {
        r.params.ship = ship.id;
        r.params.code = ship.toString();
        this._setPage(OutfittingPage, r);
      } else if (importString) {
        this._setPage(ShipyardPage, r);
        this._showModal(<ModalImport importString={data}/>);
      }
    } catch (err) {
      const fullUrl = window.location.href;

      if (fullUrl.length >= 2083) {
        err = 'URL Length = ' + fullUrl.length;
        this._onError('Failed to import ship - Potential URL Length issue', r.path, 0, 0, err);
      }
      else {
        this._onError('Failed to import ship - Unknown Reason', r.path, 0, 0, err);
      }
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
          this._showModal(<ModalHelp/>);
        }
        break;
      case 73:     // 'i'
        if (e.ctrlKey || e.metaKey) { // CTRL/CMD + i
          e.preventDefault();
          this._showModal(<ModalImport/>);
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
    let modal = <div className='modal-bg' onClick={(e) => this._hideModal()}>{content}</div>;
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
    } else if (content && Persist.showTooltips() && this.state.noTouch) {
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
   * Adds necessary listeners and starts Routing
   */
  UNSAFE_componentWillMount() {
    // Listen for appcache updated event, present refresh to update view
    // Check that service workers are registered
    if (navigator.storage && navigator.storage.persist) {
      window.addEventListener('load', () => {
        navigator.storage.persist().then(granted => {
          if (granted)
            console.log('Storage will not be cleared except by explicit user action');
          else
            console.log('Storage may be cleared by the UA under storage pressure.');
        });
      });
    }
    if ('serviceWorker' in navigator) {
      // Your service-worker.js *must* be located at the top-level directory relative to your site.
      // It won't be able to control pages unless it's located at the same level or higher than them.
      // *Don't* register service worker file in, e.g., a scripts/ sub-directory!
      // See https://github.com/slightlyoff/ServiceWorker/issues/468
      const self = this;
      if (process.env.NODE_ENV === 'production') {
        register('/service-worker.js', {
          ready(registration) {
            console.log('Service worker is active.');
          },
          registered(registration) {
            console.log('Service worker has been registered.');
          },
          cached(registration) {
            console.log('Content has been cached for offline use.');
          },
          updatefound(registration) {
            console.log('New content is downloading.');
          },
          updated(registration) {
            self.setState({ appCacheUpdate: true });
            console.log('New content is available; please refresh.');
          },
          offline() {
            console.log('No internet connection found. App is running in offline mode.');
          },
          error(error) {
            console.error('Error during service worker registration:', error);
          }
        });
      }
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

    // Create context value
    const contextValue = {
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

    return (
      <AppContext.Provider value={contextValue}>
        <div style={{ minHeight: '100%' }} onClick={() => { this._closeMenu(); this._tooltip(); }}
             className={this.state.noTouch ? 'no-touch' : null}>
          <Header announcements={this.state.announcements} appCacheUpdate={this.state.appCacheUpdate}
                  currentMenu={currentMenu}/>
          <div className="announcement-container">{this.state.announcements.map((a, index) => <Announcement
            key={index}
            text={a.text}/>)}</div>
          {this.state.error ? this.state.error : this.state.page ? React.createElement(this.state.page, { currentMenu }) :
            <NotFoundPage/>}
          {this.state.modal}
          {this.state.tooltip}
          <footer>
            <div className="right cap">
              <a href="https://github.com/EDCD/coriolis" target="_blank" rel="noopener noreferrer"
                 title="Coriolis Github Project">{window.CORIOLIS_VERSION} - {window.CORIOLIS_DATE}</a>
              <br/>
              <a
                href={'https://github.com/EDCD/coriolis/compare/edcd:develop@{' + window.CORIOLIS_DATE + '}...edcd:develop'}
                target="_blank" rel="noopener noreferrer" title={'Coriolis Commits since' + window.CORIOLIS_DATE}>Commits
                since last release
                ({window.CORIOLIS_DATE})</a>
            </div>
          </footer>
        </div>
      </AppContext.Provider>
    );
  }
}
