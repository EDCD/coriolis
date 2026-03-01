import React from 'react';
import PropTypes from 'prop-types';
import { shallowEqual } from '../utils/UtilityFunctions';
import { AppContext } from '../AppContext';

/**
 * Abstract Translated Component
 */
export default class TranslatedComponent extends React.Component {
  static contextType = AppContext;

  /**
   * Created an instance of a Translated Component. This is an abstract class.
   * @param  {object} props Properties
   */
  constructor(props) {
    super(props);
    this.didContextChange = this.didContextChange.bind(this);
  }

  /**
   * Determine if the context change incldues a language or size change
   * @param  {object} nextContext The incoming / next context
   * @return {boolean} true if the language has changed
   */
  didContextChange(nextContext) {
    return (
      nextContext.language !== this.context.language ||
      nextContext.sizeRatio != this.context.sizeRatio
    );
  }

  /**
   * Translated components are 'pure' components that only render when
   * props, state, or context changes. This method performs a shallow comparison to
   * determine change.
   *
   * @param  {object} nextProps   Next/Incoming Properties
   * @param  {objec} nextState    Next/Incoming State
   * @param  {objec} nextContext  Next/Incoming Context
   * @return {boolean}            True if props, state, or context has changed
   */
  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return (
      !shallowEqual(this.props, nextProps) ||
      !shallowEqual(this.state, nextState) ||
      this.didContextChange(nextContext)
    );
  }
}
