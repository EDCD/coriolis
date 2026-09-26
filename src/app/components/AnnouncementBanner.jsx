import React from 'react';
import PropTypes from 'prop-types';

/**
 * Announcement Banner - slides down from top, auto-dismisses after 15s
 * Sets localStorage after 4s so quick navigations still show it again
 */
export default class AnnouncementBanner extends React.Component {

  static propTypes = {
    announcement: PropTypes.object,
    onDismiss: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { hiding: false };
  }

  componentDidMount() {
    // Mark as seen after 4 seconds (only this specific announcement)
    this._cookieTimer = setTimeout(() => {
      if (this.props.announcement) {
        const raw = localStorage.getItem('seenAnnouncementIds');
        let seen = [];
        try { seen = raw ? JSON.parse(raw) : []; } catch (e) { seen = []; }
        if (!seen.includes(this.props.announcement.id)) {
          seen.push(this.props.announcement.id);
          localStorage.setItem('seenAnnouncementIds', JSON.stringify(seen));
        }
      }
    }, 4000);

    // Start slide-up animation at 14.7s, dismiss at 15s
    this._hideTimer = setTimeout(() => {
      this.setState({ hiding: true });
    }, 14700);

    this._dismissTimer = setTimeout(() => {
      this.props.onDismiss();
    }, 15000);
  }

  componentWillUnmount() {
    clearTimeout(this._cookieTimer);
    clearTimeout(this._hideTimer);
    clearTimeout(this._dismissTimer);
  }

  render() {
    const { announcement } = this.props;
    if (!announcement) return null;

    return (
      <div className="announcement-banner-overlay">
        <div className={`announcement-banner ${this.state.hiding ? 'slide-up' : ''}`}>
          {(() => { const h = window.location.hostname; const p = h.includes('alpha') ? 'Alpha v' : h.includes('beta') ? 'Beta v' : 'v'; return p; })()}{announcement.version} — {announcement.text}
        </div>
      </div>
    );
  }
}
