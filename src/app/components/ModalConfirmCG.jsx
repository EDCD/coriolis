import React from 'react';
import TranslatedComponent from './TranslatedComponent';
import Persist from '../stores/Persist';
import { CommunityGoalSmall } from './SvgIcons';

/**
 * Confirm CG module selection modal
 */
export default class ModalConfirmCG extends TranslatedComponent {
  constructor(props) {
    super(props);
    this.state = {
      dontPromptAgain: false
    };
    this._toggleCheckbox = this._toggleCheckbox.bind(this);
  }

  /**
   * Handle 'Yes' click: select module, save preference, and hide modal
   */
  _confirm() {
    if (this.state.dontPromptAgain) {
      Persist.setPromptCG(false);
    }
    this.props.onSelect(this.props.module);
    this.context.hideModal();
  }

  /**
   * Toggles the state of the checkbox
   */
  _toggleCheckbox() {
    this.setState({ dontPromptAgain: !this.state.dontPromptAgain });
  }

  /**
   * Renders the component
   * @return {React.Component} Modal contents
   */
  render() {
    const translate = this.context.language.translate;

    return (
      <div className='modal' onClick={(e) => e.stopPropagation()}>

        <h2>{<CommunityGoalSmall className={'community'}/>} {translate('Community Goal Module')}</h2>
        <p className='cen'>{translate('This module was a reward for a Community Goal and cannot be purchased in-game.')}</p>
        <p className='cen'>{translate('You can only use this module if you own it.')}</p>
        <p className='cen'>{translate('PHRASE_FIT_MODULE')}</p>
        <div style={{ textAlign: 'center', margin: '1em 0' }}>
          <input id='dont-prompt-cg' type='checkbox' checked={this.state.dontPromptAgain} onChange={this._toggleCheckbox} />
          <label htmlFor='dont-prompt-cg' style={{ marginLeft: '0.5em' }}>{translate("Don't prompt me for CG Modules")}</label>
        </div>
        <button className='l cap' onClick={this._confirm.bind(this)}>{translate('yes')}</button>
        <button className='r cap' onClick={this.context.hideModal}>{translate('no')}</button>
      </div>
    );
  }
}