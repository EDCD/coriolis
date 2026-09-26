import React from 'react';
import Page from './Page';
import announcements from '../data/announcements.json';

/**
 * Returns version prefix based on current site environment
 */
function getVersionPrefix() {
  const host = window.location.hostname;
  if (host.includes('alpha')) return 'Alpha v';
  if (host.includes('beta')) return 'Beta v';
  return 'v';
}

/**
 * Changelog Page - renders version history from generated announcements data
 */
export default class ChangelogPage extends Page {

  constructor(props) {
    super(props);
    this.state = { title: 'Changelog - Coriolis' };
  }

  componentDidMount() {
    // Mark all announcements as seen when the changelog is opened
    if (announcements.length > 0) {
      const ids = announcements.map(a => a.id);
      localStorage.setItem('seenAnnouncementIds', JSON.stringify(ids));
      window.dispatchEvent(new CustomEvent('announcementsSeen'));
    }
  }

  renderPage() {
    const prefix = getVersionPrefix();

    return (
      <div className='page changelog-page' style={{ padding: '2em', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Changelog</h1>
        {announcements.map(a => (
          <div key={a.id} id={`v${a.version}`} className='changelog-entry'>
            <h2>{prefix}{a.version}</h2>
            <ul>
              {a.changes.map((change, i) => (
                <li key={i}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
        <p>Only versions since 4.0.9 are tracked, as there was a huge gap in the use of ChangeLog for several years.</p>
      </div>
    );
  }
}
