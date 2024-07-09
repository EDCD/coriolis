import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import ShortenUrl from '../utils/ShortenUrl';

/**
 * Permalink modal
 */
export default class ModalPermalink extends TranslatedComponent {

  static propTypes = {
    url: PropTypes.string.isRequired
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);

    this.state = {
      shortenedUrl: 'Shortening...'
    };
  }

  /**
   * Shorten URL on mount
   */
  componentWillMount() {
    ShortenUrl(this.props.url,
      (shortenedUrl) => this.setState({ shortenedUrl }),
      (error) => this.setState({ shortenedUrl: 'Error - ' + error })
    );
  }

  /**
   * Copy the shortened URL to the clipboard
   * @param  {Event} e Click event
   * @return {void}
   */
  copyShortLink() {
    let copyText = document.getElementById("shortenedUrl");
    // Copy the text inside the shortendUrl input to the clipboard
    copyText.select();
    document.execCommand("copy");
  }

  /**
   * Render the modal
   * @return {React.Component} Modal Content
   */
  render() {
    let translate = this.context.language.translate;

    return <div className='modal' onClick={ (e) => e.stopPropagation() }>
      <h3>{translate('permalink')}</h3>
      <br/>
      <h3>{translate('URL')}</h3>
      <input value={this.props.url} size={40} readOnly onFocus={ (e) => e.target.select() }/>
      <br/><br/>
      <h3 >{translate('shortened')}</h3>
      <input id={'shortenedUrl'} value={this.state.shortenedUrl} readOnly size={25} onFocus={ (e) => e.target.select() }/><button className={'cb dismiss cap'} onClick={this.copyShortLink}>{translate('copy to clipboard')}</button>
      <br/><br/>
      <hr />
      <p>s.orbis.zone is the URL shortener domain. These links should persist indefinitely going forward. If for some reason there is a problem with the link shortening process, please report it in the EDCD Discord Server.</p>
      <hr />
      <button className={'r dismiss cap'} onClick={this.context.hideModal}>{translate('close')}</button>
    </div>;
  }
}
