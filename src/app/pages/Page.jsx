import React from 'react';
import PropTypes from 'prop-types';
import ErrorDetails from './ErrorDetails';
import { shallowEqual } from '../utils/UtilityFunctions';
import { AppContext } from '../AppContext';

/**
 * Abstract/Base Page
 */
export default class Page extends React.Component {
  static contextType = AppContext;

  // REMOVE the legacy contextTypes:
  // static contextTypes = {
  //   closeMenu: PropTypes.func.isRequired,
  //   hideModal: PropTypes.func.isRequired,
  //   language: PropTypes.object.isRequired,
  //   noTouch: PropTypes.bool.isRequired,
  //   onCommand: PropTypes.func.isRequired,
  //   onWindowResize: PropTypes.func.isRequired,
  //   openMenu: PropTypes.func.isRequired,
  //   route: PropTypes.object.isRequired,
  //   showModal: PropTypes.func.isRequired,
  //   sizeRatio: PropTypes.number.isRequired,
  //   termtip: PropTypes.func.isRequired,
  //   tooltip: PropTypes.func.isRequired
  // };

  static propTypes = {
    currentMenu: PropTypes.any
  };

  /**
   * Created an instance of a Page. This is an abstract class.
   * @param  {object} props Properties
   */
  constructor(props) {
    super(props);

    // Autobind private functions
    Object.getOwnPropertyNames(this.constructor.prototype).forEach(prop => {
      if(prop.charAt(0) == '_' && typeof this[prop] === 'function') {
        this[prop] = this[prop].bind(this);
      }
    });

    let fix = sessionStorage.getItem('__safari_history_fix');
    sessionStorage.removeItem('__safari_history_fix');
    if (fix) {
      fix = JSON.parse(fix);
      history.replaceState(history.state, document.title, location.href);
      history.pushState(fix.state, fix.title, fix.path);
    }
  }

  /**
   * Update the window title upon mount
   */
  UNSAFE_componentWillMount() {
    document.title = this.state.title || 'Coriolis';
  }

  /**
   * Update the window title upon mount
   */
  componentDidMount() {
    document.title = this.state.title || 'Coriolis';
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({
        google_ad_client: "ca-pub-3709458261881414",
        enable_page_level_ads: true
      });
    } catch (error) {

    }
  }

  /**
   * Updates the title upon change
   * @param  {Object} newProps  Incoming properties
   * @param  {Object} newState  Incoming state
   */
  UNSAFE_componentWillUpdate(newProps, newState) {
    document.title = newState.title || 'Coriolis';
  }

  /**
   * Checks error state before rendering the page contents.
   * Pages should catch all errors where possible capture details to state.error.
   * @return {React.Component} Page contents
   */
  render() {
    if (this.state.error) {
      return <ErrorDetails error={this.state.error} />;
    }
    return this.renderPage();
  }
}
